// electron/main/auto-updater.ts
import { autoUpdater } from 'electron-updater';
import { Notification, dialog } from 'electron';
import { logger } from '../utils/logger';

let updateDownloaded = false;

export function initAutoUpdater() {
  // Configure auto-updater
  autoUpdater.logger = logger;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    logger.info('Checking for updates...');
  });

  autoUpdater.on('update-available', (info) => {
    logger.info('Update available:', info.version);
    // Show notification that update is downloading
    if (Notification.isSupported()) {
      new Notification({
        title: 'PlaySense Update Available',
        body: `Version ${info.version} is downloading in the background...`,
        silent: true,
      }).show();
    }
  });

  autoUpdater.on('update-not-available', (info) => {
    logger.info('Update not available, current version:', info.version);
  });

  autoUpdater.on('error', (error) => {
    logger.error('Auto-update error:', error);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    logger.info(
      `Download progress: ${Math.round(progressObj.percent)}% (${Math.round(progressObj.bytesPerSecond / 1024)} KB/s)`
    );
  });

  autoUpdater.on('update-downloaded', (info) => {
    logger.info('Update downloaded:', info.version);
    updateDownloaded = true;

    // Show notification that update is ready
    if (Notification.isSupported()) {
      const notification = new Notification({
        title: 'PlaySense Update Ready',
        body: `Version ${info.version} has been downloaded. Click to restart and install.`,
        silent: false,
      });

      notification.on('click', () => {
        // Ask user to confirm restart
        promptRestartToUpdate();
      });

      notification.show();
    }
  });

  // Check for updates every 4 hours
  setInterval(
    () => {
      if (process.env.NODE_ENV === 'production') {
        autoUpdater.checkForUpdates().catch((err) => {
          logger.error('Failed to check for updates:', err);
        });
      }
    },
    4 * 60 * 60 * 1000
  );

  // Initial check after 10 seconds
  if (process.env.NODE_ENV === 'production') {
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch((err) => {
        logger.error('Failed to check for updates:', err);
      });
    }, 10000);
  }

  logger.info('Auto-updater initialized');
}

// Prompt user to restart and install update
async function promptRestartToUpdate() {
  const result = await dialog.showMessageBox({
    type: 'info',
    title: 'Update Ready',
    message: 'A new version of PlaySense has been downloaded.',
    detail: 'Restart now to install the update? Your session data will be preserved.',
    buttons: ['Restart Now', 'Later'],
    defaultId: 0,
    cancelId: 1,
  });

  if (result.response === 0) {
    autoUpdater.quitAndInstall(false, true);
  }
}

// Export function to check if update is available
export function isUpdateDownloaded(): boolean {
  return updateDownloaded;
}

// Export function to manually trigger update install
export function installUpdate() {
  if (updateDownloaded) {
    autoUpdater.quitAndInstall(false, true);
  }
}
