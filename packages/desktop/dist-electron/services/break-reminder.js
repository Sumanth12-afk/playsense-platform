"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.breakReminderService = void 0;
// electron/services/break-reminder.ts
const electron_1 = require("electron");
const database_1 = require("./database");
const logger_1 = require("../utils/logger");
const DEFAULT_SETTINGS = {
    enabled: true,
    intervalMinutes: 60,
    minSessionMinutes: 30,
};
class BreakReminderService {
    constructor() {
        this.sessionStartTimes = new Map(); // pid -> start time
        this.lastReminderTimes = new Map(); // pid -> last reminder
        this.checkInterval = null;
        this.settings = DEFAULT_SETTINGS;
        // Don't load settings here - DB may not be initialized yet (e.g. dev startup).
        // Settings are loaded on first use in getSettings() and in start().
    }
    /**
     * Load settings from database
     */
    loadSettings() {
        try {
            const db = (0, database_1.getDatabase)();
            const enabledSetting = db
                .prepare("SELECT value FROM settings WHERE key = 'break_reminder_enabled'")
                .get();
            const intervalSetting = db
                .prepare("SELECT value FROM settings WHERE key = 'break_reminder_interval'")
                .get();
            this.settings = {
                enabled: enabledSetting?.value !== 'false',
                intervalMinutes: parseInt(intervalSetting?.value || '60') || 60,
                minSessionMinutes: 30,
            };
            logger_1.logger.info('Break reminder settings loaded:', this.settings);
        }
        catch (error) {
            logger_1.logger.error('Failed to load break reminder settings:', error);
            this.settings = DEFAULT_SETTINGS;
        }
    }
    /**
     * Update settings
     */
    async updateSettings(newSettings) {
        try {
            const db = (0, database_1.getDatabase)();
            if (newSettings.enabled !== undefined) {
                db.prepare(`INSERT OR REPLACE INTO settings (key, value, updated_at) 
           VALUES ('break_reminder_enabled', ?, datetime('now'))`).run(String(newSettings.enabled));
            }
            if (newSettings.intervalMinutes !== undefined) {
                db.prepare(`INSERT OR REPLACE INTO settings (key, value, updated_at) 
           VALUES ('break_reminder_interval', ?, datetime('now'))`).run(String(newSettings.intervalMinutes));
            }
            this.settings = { ...this.settings, ...newSettings };
            logger_1.logger.info('Break reminder settings updated:', this.settings);
        }
        catch (error) {
            logger_1.logger.error('Failed to update break reminder settings:', error);
        }
    }
    /**
     * Get current settings
     */
    getSettings() {
        return { ...this.settings };
    }
    /**
     * Start tracking a game session
     */
    startSession(pid, gameName) {
        if (!this.settings.enabled)
            return;
        this.sessionStartTimes.set(pid, new Date());
        this.lastReminderTimes.delete(pid); // Reset reminder timer
        logger_1.logger.info(`Break reminder: Started tracking session for ${gameName} (PID: ${pid})`);
    }
    /**
     * Stop tracking a game session
     */
    endSession(pid) {
        this.sessionStartTimes.delete(pid);
        this.lastReminderTimes.delete(pid);
        logger_1.logger.info(`Break reminder: Stopped tracking session (PID: ${pid})`);
    }
    /**
     * Start the periodic check for break reminders
     */
    start() {
        this.loadSettings();
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        // Check every minute
        this.checkInterval = setInterval(() => {
            this.checkAndRemind();
        }, 60 * 1000);
        logger_1.logger.info('Break reminder service started');
    }
    /**
     * Stop the service
     */
    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        this.sessionStartTimes.clear();
        this.lastReminderTimes.clear();
        logger_1.logger.info('Break reminder service stopped');
    }
    /**
     * Check all active sessions and send reminders if needed
     */
    checkAndRemind() {
        if (!this.settings.enabled)
            return;
        const now = new Date();
        for (const [pid, startTime] of this.sessionStartTimes) {
            const sessionMinutes = (now.getTime() - startTime.getTime()) / (1000 * 60);
            // Only remind if session is long enough
            if (sessionMinutes < this.settings.minSessionMinutes) {
                continue;
            }
            const lastReminder = this.lastReminderTimes.get(pid);
            const minutesSinceLastReminder = lastReminder
                ? (now.getTime() - lastReminder.getTime()) / (1000 * 60)
                : sessionMinutes;
            // Check if it's time for a reminder
            if (minutesSinceLastReminder >= this.settings.intervalMinutes) {
                this.sendBreakReminder(sessionMinutes);
                this.lastReminderTimes.set(pid, now);
            }
        }
    }
    /**
     * Send a break reminder notification
     */
    sendBreakReminder(sessionMinutes) {
        try {
            if (!electron_1.Notification.isSupported()) {
                logger_1.logger.warn('Notifications not supported on this system');
                return;
            }
            const hours = Math.floor(sessionMinutes / 60);
            const mins = Math.round(sessionMinutes % 60);
            const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins} minutes`;
            const messages = [
                { title: 'Time for a Break!', body: `You've been playing for ${timeStr}. Stretch, hydrate, and rest your eyes!` },
                { title: 'Break Time Reminder', body: `${timeStr} of gaming! Take a 5-10 minute break to recharge.` },
                { title: 'Gaming Break', body: `Nice session! You've been at it for ${timeStr}. Consider taking a quick break.` },
                { title: 'Rest Your Eyes', body: `After ${timeStr} of gaming, your eyes deserve a break! Look away from the screen for a bit.` },
                { title: 'Hydration Check', body: `${timeStr} in! Remember to drink some water and take a short break.` },
            ];
            const randomMessage = messages[Math.floor(Math.random() * messages.length)];
            new electron_1.Notification({
                title: randomMessage.title,
                body: randomMessage.body,
                silent: false,
                urgency: 'normal',
            }).show();
            logger_1.logger.info(`Break reminder sent after ${timeStr}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to send break reminder:', error);
        }
    }
    /**
     * Force send a reminder (for testing). Always shows a dialog so user gets feedback.
     */
    forceReminder(sessionMinutes = 60) {
        logger_1.logger.info('Force reminder triggered');
        const { dialog } = require('electron');
        const showConfirmDialog = () => {
            dialog.showMessageBox({
                type: 'info',
                title: 'Break Reminder Test',
                message: 'Test notification sent',
                detail: 'You should have seen a system notification. During real gameplay, you\'ll get reminders after your chosen interval (e.g. every 60 min). If you didn\'t see a notification, check Windows Settings → System → Notifications and ensure PlaySense is allowed.',
            }).catch((err) => logger_1.logger.error('Dialog error:', err));
        };
        try {
            if (!electron_1.Notification.isSupported()) {
                logger_1.logger.warn('Notifications not supported, using dialog only');
                dialog.showMessageBox({
                    type: 'info',
                    title: 'Break Reminder Test',
                    message: 'Time for a Break!',
                    detail: `System notifications aren't supported here. In real gameplay, after ${sessionMinutes} minutes you'd get a reminder. Break reminders will still work via this app.`,
                }).catch((err) => logger_1.logger.error('Dialog error:', err));
                return;
            }
            const notification = new electron_1.Notification({
                title: '🎮 Break Reminder Test',
                body: `This is a test! After ${sessionMinutes} min of gaming you'd get this. Time to stretch and rest your eyes!`,
                silent: false,
                urgency: 'normal',
            });
            notification.show();
            logger_1.logger.info('Test notification sent');
            // Always show a confirmation dialog so user knows the test ran
            setTimeout(showConfirmDialog, 800);
        }
        catch (error) {
            logger_1.logger.error('Failed to send test notification:', error);
            dialog.showMessageBox({
                type: 'info',
                title: 'Break Reminder Test',
                message: 'Time for a Break!',
                detail: 'Break reminders are enabled. During long gaming sessions you\'ll get a reminder at your chosen interval.',
            }).catch((err) => logger_1.logger.error('Dialog error:', err));
        }
    }
}
// Export singleton instance
exports.breakReminderService = new BreakReminderService();
exports.default = exports.breakReminderService;
