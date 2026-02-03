"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initAutoUpdater = initAutoUpdater;
exports.isUpdateDownloaded = isUpdateDownloaded;
exports.installUpdate = installUpdate;
// electron/main/auto-updater.ts
const electron_updater_1 = require("electron-updater");
const electron_1 = require("electron");
const logger_1 = require("../utils/logger");
let updateDownloaded = false;
function initAutoUpdater() {
    // Configure auto-updater
    electron_updater_1.autoUpdater.logger = logger_1.logger;
    electron_updater_1.autoUpdater.autoDownload = true;
    electron_updater_1.autoUpdater.autoInstallOnAppQuit = true;
    electron_updater_1.autoUpdater.on('checking-for-update', () => {
        logger_1.logger.info('Checking for updates...');
    });
    electron_updater_1.autoUpdater.on('update-available', (info) => {
        logger_1.logger.info('Update available:', info.version);
        // Show notification that update is downloading
        if (electron_1.Notification.isSupported()) {
            new electron_1.Notification({
                title: 'PlaySense Update Available',
                body: `Version ${info.version} is downloading in the background...`,
                silent: true,
            }).show();
        }
    });
    electron_updater_1.autoUpdater.on('update-not-available', (info) => {
        logger_1.logger.info('Update not available, current version:', info.version);
    });
    electron_updater_1.autoUpdater.on('error', (error) => {
        logger_1.logger.error('Auto-update error:', error);
    });
    electron_updater_1.autoUpdater.on('download-progress', (progressObj) => {
        logger_1.logger.info(`Download progress: ${Math.round(progressObj.percent)}% (${Math.round(progressObj.bytesPerSecond / 1024)} KB/s)`);
    });
    electron_updater_1.autoUpdater.on('update-downloaded', (info) => {
        logger_1.logger.info('Update downloaded:', info.version);
        updateDownloaded = true;
        // Show notification that update is ready
        if (electron_1.Notification.isSupported()) {
            const notification = new electron_1.Notification({
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
    setInterval(() => {
        if (process.env.NODE_ENV === 'production') {
            electron_updater_1.autoUpdater.checkForUpdates().catch((err) => {
                logger_1.logger.error('Failed to check for updates:', err);
            });
        }
    }, 4 * 60 * 60 * 1000);
    // Initial check after 10 seconds
    if (process.env.NODE_ENV === 'production') {
        setTimeout(() => {
            electron_updater_1.autoUpdater.checkForUpdates().catch((err) => {
                logger_1.logger.error('Failed to check for updates:', err);
            });
        }, 10000);
    }
    logger_1.logger.info('Auto-updater initialized');
}
// Prompt user to restart and install update
async function promptRestartToUpdate() {
    const result = await electron_1.dialog.showMessageBox({
        type: 'info',
        title: 'Update Ready',
        message: 'A new version of PlaySense has been downloaded.',
        detail: 'Restart now to install the update? Your session data will be preserved.',
        buttons: ['Restart Now', 'Later'],
        defaultId: 0,
        cancelId: 1,
    });
    if (result.response === 0) {
        electron_updater_1.autoUpdater.quitAndInstall(false, true);
    }
}
// Export function to check if update is available
function isUpdateDownloaded() {
    return updateDownloaded;
}
// Export function to manually trigger update install
function installUpdate() {
    if (updateDownloaded) {
        electron_updater_1.autoUpdater.quitAndInstall(false, true);
    }
}
