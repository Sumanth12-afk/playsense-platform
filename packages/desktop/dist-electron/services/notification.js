"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showNotification = showNotification;
exports.showGameStartedNotification = showGameStartedNotification;
exports.showGameEndedNotification = showGameEndedNotification;
exports.showSyncNotification = showSyncNotification;
exports.showSyncErrorNotification = showSyncErrorNotification;
// electron/services/notification.ts
const electron_1 = require("electron");
const logger_1 = require("../utils/logger");
function showNotification(title, body) {
    try {
        if (electron_1.Notification.isSupported()) {
            new electron_1.Notification({
                title,
                body,
                silent: false,
            }).show();
        }
    }
    catch (error) {
        logger_1.logger.error('Failed to show notification:', error);
    }
}
function showGameStartedNotification(gameName) {
    showNotification('Game Session Started', `Now tracking: ${gameName}`);
}
function showGameEndedNotification(gameName, durationMinutes) {
    showNotification('Game Session Ended', `${gameName} - Played for ${durationMinutes} minutes`);
}
function showSyncNotification(sessionCount) {
    showNotification('Sessions Synced', `Successfully synced ${sessionCount} gaming session${sessionCount !== 1 ? 's' : ''}`);
}
function showSyncErrorNotification() {
    showNotification('Sync Failed', 'Unable to sync sessions. Will retry later.');
}
