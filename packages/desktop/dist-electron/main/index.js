"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// electron/main/index.ts
try {
    require('dotenv').config();
}
catch {
    // dotenv optional (e.g. when not in node_modules or in packaged app)
}
const electron_1 = require("electron");
const database_1 = require("../services/database");
const process_monitor_1 = __importDefault(require("../services/process-monitor"));
const supabase_sync_1 = __importDefault(require("../services/supabase-sync"));
const games_sync_1 = __importDefault(require("../services/games-sync"));
const tamper_protection_1 = __importDefault(require("../services/tamper-protection"));
const admin_protection_1 = __importDefault(require("../services/admin-protection"));
const break_reminder_1 = __importDefault(require("../services/break-reminder"));
const logger_1 = require("../utils/logger");
const ipc_handlers_1 = require("./ipc-handlers");
const windows_1 = require("./windows");
const tray_1 = require("./tray");
const auto_updater_1 = require("./auto-updater");
const crash_reporter_1 = require("./crash-reporter");
const notification_1 = require("../services/notification");
let processMonitor = null;
let mainWindow = null;
// Handle --verify-uninstall command line argument
// This is called by the uninstaller to verify admin password before allowing uninstall
if (process.argv.includes('--verify-uninstall')) {
    electron_1.app.whenReady().then(async () => {
        const { dialog } = require('electron');
        // Check if admin password is set
        const storedPassword = await admin_protection_1.default.getStoredPassword();
        if (!storedPassword) {
            // No password set, allow uninstall
            electron_1.app.exit(0);
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
            electron_1.app.exit(1);
            return;
        }
        // Show password input dialog
        const verified = await admin_protection_1.default.verifyAdmin('uninstall');
        if (verified) {
            electron_1.app.exit(0); // Allow uninstall
        }
        else {
            electron_1.app.exit(1); // Block uninstall
        }
    });
}
else {
    // Normal app startup
    // Prevent multiple instances
    const gotTheLock = electron_1.app.requestSingleInstanceLock();
    if (!gotTheLock) {
        electron_1.app.quit();
    }
    else {
        electron_1.app.on('second-instance', () => {
            // Someone tried to run a second instance, focus our window
            (0, windows_1.showMainWindow)();
        });
        // App ready
        electron_1.app.whenReady().then(async () => {
            logger_1.logger.info('App starting...');
            // Initialize crash reporter
            (0, crash_reporter_1.initCrashReporter)();
            // Initialize database
            (0, database_1.initDatabase)();
            // Register IPC handlers
            (0, ipc_handlers_1.registerIpcHandlers)();
            // Create main window (but don't show it)
            mainWindow = (0, windows_1.createMainWindow)();
            // Create system tray
            (0, tray_1.createTray)(() => (0, windows_1.showMainWindow)(), async () => {
                // Require admin password before quitting
                const canQuit = await admin_protection_1.default.canQuit();
                if (canQuit) {
                    electron_1.app.quit();
                }
            });
            // Log that app is running in background
            logger_1.logger.info('App running in system tray (background mode)');
            // Initialize auto-updater (production only)
            if (process.env.NODE_ENV === 'production') {
                (0, auto_updater_1.initAutoUpdater)();
            }
            // Initialize tamper protection (auto-restart if killed from Task Manager)
            await tamper_protection_1.default.initialize();
            logger_1.logger.info('Tamper protection initialized');
            // Initialize admin protection (require password to close/uninstall)
            await admin_protection_1.default.initialize();
            logger_1.logger.info('Admin protection initialized');
            // Load child ID from settings
            const db = require('../services/database').getDatabase();
            const childIdResult = db
                .prepare("SELECT value FROM settings WHERE key = 'child_id'")
                .get();
            if (childIdResult?.value) {
                supabase_sync_1.default.setChildId(childIdResult.value);
            }
            else {
                // No child_id set - clear any old sessions (they don't belong to any child)
                const sessionCount = db.prepare('SELECT COUNT(*) as count FROM gaming_sessions').get();
                if (sessionCount && sessionCount.count > 0) {
                    logger_1.logger.info(`No child_id set but found ${sessionCount.count} old sessions. Clearing them.`);
                    db.prepare('DELETE FROM gaming_sessions').run();
                }
            }
            // Start process monitoring
            processMonitor = new process_monitor_1.default({
                onGameStart: async (game) => {
                    logger_1.logger.info(`Game started: ${game.name}`);
                    // Save to database
                    db.prepare(`INSERT INTO gaming_sessions (game_name, game_executable, category, started_at)
           VALUES (?, ?, ?, ?)`).run(game.name, game.executable, game.category, game.startedAt.toISOString());
                    // REAL-TIME: Sync active session immediately to cloud
                    await supabase_sync_1.default.syncActiveSession({
                        game_name: game.name,
                        game_executable: game.executable,
                        category: game.category,
                        started_at: game.startedAt.toISOString(),
                    });
                    logger_1.logger.info(`Active session synced to cloud: ${game.name}`);
                    // Show notification
                    (0, notification_1.showGameStartedNotification)(game.name);
                    // Start break reminder tracking for this session
                    break_reminder_1.default.startSession(game.pid, game.name);
                    // Update tray icon
                    (0, tray_1.updateTrayIcon)('active');
                    // Notify renderer
                    if (mainWindow) {
                        mainWindow.webContents.send('game-started', game);
                    }
                },
                onGameEnd: async (game) => {
                    logger_1.logger.info(`Game ended: ${game.name}`);
                    const endTime = new Date();
                    const durationMinutes = Math.round((endTime.getTime() - game.startedAt.getTime()) / 1000 / 60);
                    // Update database
                    db.prepare(`UPDATE gaming_sessions 
           SET ended_at = ?, duration_minutes = ?
           WHERE game_executable = ? AND ended_at IS NULL`).run(endTime.toISOString(), durationMinutes, game.executable);
                    // REAL-TIME: Complete the active session in cloud immediately
                    await supabase_sync_1.default.completeActiveSession({
                        game_name: game.name,
                        game_executable: game.executable,
                        category: game.category,
                        started_at: game.startedAt.toISOString(),
                        ended_at: endTime.toISOString(),
                        duration_minutes: durationMinutes,
                    });
                    logger_1.logger.info(`Session completed in cloud: ${game.name} (${durationMinutes} min)`);
                    // Show notification
                    (0, notification_1.showGameEndedNotification)(game.name, durationMinutes);
                    // Stop break reminder tracking for this session
                    break_reminder_1.default.endSession(game.pid);
                    // Update tray icon
                    (0, tray_1.updateTrayIcon)('default');
                    // Notify renderer
                    if (mainWindow) {
                        mainWindow.webContents.send('game-ended', {
                            ...game,
                            durationMinutes,
                        });
                    }
                    // Also trigger regular sync to mark local session as synced
                    supabase_sync_1.default.sync();
                },
            });
            await processMonitor.start(5000);
            logger_1.logger.info('Process monitor started');
            // Sync games list from Supabase
            logger_1.logger.info('Syncing games list from Supabase...');
            const gamesResult = await games_sync_1.default.syncGames();
            if (gamesResult.success) {
                logger_1.logger.info(`Synced ${gamesResult.count} games from Supabase`);
                // Reload games in process monitor
                processMonitor.reloadGames();
            }
            else {
                logger_1.logger.warn('Failed to sync games, using local database');
            }
            // Start automatic games sync (every 6 hours)
            games_sync_1.default.start(21600000);
            // Start sync service
            if (childIdResult?.value) {
                await supabase_sync_1.default.start(60000);
                logger_1.logger.info('Sync service started');
            }
            // Start break reminder service
            break_reminder_1.default.start();
            logger_1.logger.info('Break reminder service started');
            logger_1.logger.info('App ready');
        });
        // Quit when all windows are closed (except on macOS)
        electron_1.app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                electron_1.app.quit();
            }
        });
        electron_1.app.on('activate', () => {
            // On macOS, re-create window when dock icon is clicked
            if (electron_1.BrowserWindow.getAllWindows().length === 0) {
                mainWindow = (0, windows_1.createMainWindow)();
            }
            else {
                (0, windows_1.showMainWindow)();
            }
        });
        // Cleanup on quit
        electron_1.app.on('before-quit', () => {
            logger_1.logger.info('App quitting...');
            // Stop process monitor
            if (processMonitor) {
                processMonitor.stop();
            }
            // Stop sync services
            supabase_sync_1.default.stop();
            games_sync_1.default.stop();
            // Stop break reminder service
            break_reminder_1.default.stop();
            // Close database
            (0, database_1.closeDatabase)();
            // Destroy tray
            (0, tray_1.destroyTray)();
            // Destroy window
            (0, windows_1.destroyMainWindow)();
            logger_1.logger.info('Cleanup complete');
        });
    }
}
