// electron/main/index.ts
try {
  require('dotenv').config();
} catch {
  // dotenv optional (e.g. when not in node_modules or in packaged app)
}

import { app, BrowserWindow } from 'electron';
import { initDatabase, closeDatabase } from '../services/database';
import ProcessMonitor from '../services/process-monitor';
import supabaseSyncService from '../services/supabase-sync';
import gamesSyncService from '../services/games-sync';
import tamperProtection from '../services/tamper-protection';
import adminProtection from '../services/admin-protection';
import breakReminderService from '../services/break-reminder';
import { logger } from '../utils/logger';
import { registerIpcHandlers } from './ipc-handlers';
import { createMainWindow, showMainWindow, destroyMainWindow } from './windows';
import { createTray, destroyTray, updateTrayIcon } from './tray';
import { initAutoUpdater } from './auto-updater';
import { initCrashReporter } from './crash-reporter';
import {
  showGameStartedNotification,
  showGameEndedNotification,
} from '../services/notification';

let processMonitor: ProcessMonitor | null = null;
let mainWindow: BrowserWindow | null = null;

// Handle --verify-uninstall command line argument
// This is called by the uninstaller to verify admin password before allowing uninstall
if (process.argv.includes('--verify-uninstall')) {
  app.whenReady().then(async () => {
    const { dialog } = require('electron');

    // Check if admin password is set
    const storedPassword = await adminProtection.getStoredPassword();

    if (!storedPassword) {
      // No password set, allow uninstall
      app.exit(0);
      return;
    }

    // Prompt for password
    const result = await dialog.showMessageBox({
      type: 'question',
      title: 'Admin Password Required',
      message: 'Enter admin password to uninstall PlaySense Companion',
      buttons: ['Cancel', 'Continue'],
      defaultId: 1,
      cancelId: 0,
    });

    if (result.response === 0) {
      // User cancelled
      app.exit(1);
      return;
    }

    // Show password input dialog
    const verified = await adminProtection.verifyAdmin('uninstall');

    if (verified) {
      app.exit(0); // Allow uninstall
    } else {
      app.exit(1); // Block uninstall
    }
  });
} else {
  // Normal app startup
  // Prevent multiple instances
  const gotTheLock = app.requestSingleInstanceLock();

  if (!gotTheLock) {
    app.quit();
  } else {
    app.on('second-instance', () => {
      // Someone tried to run a second instance, focus our window
      showMainWindow();
    });

    // App ready
    app.whenReady().then(async () => {
      logger.info('App starting...');

      // Initialize crash reporter
      initCrashReporter();

      // Initialize database
      initDatabase();

      // Register IPC handlers
      registerIpcHandlers();

      // Create main window (but don't show it)
      mainWindow = createMainWindow();

      // Create system tray
      createTray(
        () => showMainWindow(),
        async () => {
          // Require admin password before quitting
          const canQuit = await adminProtection.canQuit();
          if (canQuit) {
            app.quit();
          }
        }
      );

      // Log that app is running in background
      logger.info('App running in system tray (background mode)');

      // Initialize auto-updater (production only)
      if (process.env.NODE_ENV === 'production') {
        initAutoUpdater();
      }

      // Initialize tamper protection (auto-restart if killed from Task Manager)
      await tamperProtection.initialize();
      logger.info('Tamper protection initialized');

      // Initialize admin protection (require password to close/uninstall)
      await adminProtection.initialize();
      logger.info('Admin protection initialized');

      // Load child ID from settings
      const db = require('../services/database').getDatabase();
      const childIdResult = db
        .prepare("SELECT value FROM settings WHERE key = 'child_id'")
        .get() as { value: string } | undefined;

      if (childIdResult?.value) {
        supabaseSyncService.setChildId(childIdResult.value);
      } else {
        // No child_id set - clear any old sessions (they don't belong to any child)
        const sessionCount = db.prepare('SELECT COUNT(*) as count FROM gaming_sessions').get() as { count: number } | undefined;
        if (sessionCount && sessionCount.count > 0) {
          logger.info(`No child_id set but found ${sessionCount.count} old sessions. Clearing them.`);
          db.prepare('DELETE FROM gaming_sessions').run();
        }
      }

      // Start process monitoring
      processMonitor = new ProcessMonitor({
        onGameStart: async (game) => {
          logger.info(`Game started: ${game.name}`);

          // Save to database
          db.prepare(
            `INSERT INTO gaming_sessions (game_name, game_executable, category, started_at)
           VALUES (?, ?, ?, ?)`
          ).run(game.name, game.executable, game.category, game.startedAt.toISOString());

          // REAL-TIME: Sync active session immediately to cloud
          await supabaseSyncService.syncActiveSession({
            game_name: game.name,
            game_executable: game.executable,
            category: game.category,
            started_at: game.startedAt.toISOString(),
          });
          logger.info(`Active session synced to cloud: ${game.name}`);

          // Show notification
          showGameStartedNotification(game.name);

          // Start break reminder tracking for this session
          breakReminderService.startSession(game.pid, game.name);

          // Update tray icon
          updateTrayIcon('active');

          // Notify renderer
          if (mainWindow) {
            mainWindow.webContents.send('game-started', game);
          }
        },
        onGameEnd: async (game) => {
          logger.info(`Game ended: ${game.name}`);

          const endTime = new Date();
          const durationMinutes = Math.round(
            (endTime.getTime() - game.startedAt.getTime()) / 1000 / 60
          );

          // Update database
          db.prepare(
            `UPDATE gaming_sessions 
           SET ended_at = ?, duration_minutes = ?
           WHERE game_executable = ? AND ended_at IS NULL`
          ).run(endTime.toISOString(), durationMinutes, game.executable);

          // REAL-TIME: Complete the active session in cloud immediately
          await supabaseSyncService.completeActiveSession({
            game_name: game.name,
            game_executable: game.executable,
            category: game.category,
            started_at: game.startedAt.toISOString(),
            ended_at: endTime.toISOString(),
            duration_minutes: durationMinutes,
          });
          logger.info(`Session completed in cloud: ${game.name} (${durationMinutes} min)`);

          // Show notification
          showGameEndedNotification(game.name, durationMinutes);

          // Stop break reminder tracking for this session
          breakReminderService.endSession(game.pid);

          // Update tray icon
          updateTrayIcon('default');

          // Notify renderer
          if (mainWindow) {
            mainWindow.webContents.send('game-ended', {
              ...game,
              durationMinutes,
            });
          }

          // Also trigger regular sync to mark local session as synced
          supabaseSyncService.sync();
        },
      });

      await processMonitor.start(5000);
      logger.info('Process monitor started');

      // Sync games list from Supabase
      logger.info('Syncing games list from Supabase...');
      const gamesResult = await gamesSyncService.syncGames();
      if (gamesResult.success) {
        logger.info(`Synced ${gamesResult.count} games from Supabase`);
        // Reload games in process monitor
        processMonitor.reloadGames();
      } else {
        logger.warn('Failed to sync games, using local database');
      }

      // Start automatic games sync (every 6 hours)
      gamesSyncService.start(21600000);

      // Start sync service
      if (childIdResult?.value) {
        await supabaseSyncService.start(60000);
        logger.info('Sync service started');
      }

      // Start break reminder service
      breakReminderService.start();
      logger.info('Break reminder service started');

      logger.info('App ready');
    });

    // Quit when all windows are closed (except on macOS)
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      // On macOS, re-create window when dock icon is clicked
      if (BrowserWindow.getAllWindows().length === 0) {
        mainWindow = createMainWindow();
      } else {
        showMainWindow();
      }
    });

    // Cleanup on quit
    app.on('before-quit', () => {
      logger.info('App quitting...');

      // Stop process monitor
      if (processMonitor) {
        processMonitor.stop();
      }

      // Stop sync services
      supabaseSyncService.stop();
      gamesSyncService.stop();

      // Stop break reminder service
      breakReminderService.stop();

      // Close database
      closeDatabase();

      // Destroy tray
      destroyTray();

      // Destroy window
      destroyMainWindow();

      logger.info('Cleanup complete');
    });
  }
}
