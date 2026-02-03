"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// electron/preload.ts
const electron_1 = require("electron");
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // Stats
    getTodayStats: () => electron_1.ipcRenderer.invoke('get-today-stats'),
    getWeeklyStats: () => electron_1.ipcRenderer.invoke('get-weekly-stats'),
    getGameStats: () => electron_1.ipcRenderer.invoke('get-game-stats'),
    getHealthScore: () => electron_1.ipcRenderer.invoke('get-health-score'),
    getCurrentSession: () => electron_1.ipcRenderer.invoke('get-current-session'),
    // Settings
    getChildId: () => electron_1.ipcRenderer.invoke('get-child-id'),
    setChildId: (childId) => electron_1.ipcRenderer.invoke('set-child-id', childId),
    getSetting: (key) => electron_1.ipcRenderer.invoke('get-setting', key),
    setSetting: (key, value) => electron_1.ipcRenderer.invoke('set-setting', key, value),
    // Sync
    triggerSync: () => electron_1.ipcRenderer.invoke('trigger-sync'),
    getSyncStatus: () => electron_1.ipcRenderer.invoke('get-sync-status'),
    testConnection: (childId) => electron_1.ipcRenderer.invoke('test-connection', childId),
    // Sessions
    getSessions: (limit, offset) => electron_1.ipcRenderer.invoke('get-sessions', limit, offset),
    // Window control
    hideToTray: () => electron_1.ipcRenderer.invoke('hide-to-tray'),
    // Games management
    syncGames: () => electron_1.ipcRenderer.invoke('sync-games'),
    getLocalGames: () => electron_1.ipcRenderer.invoke('get-local-games'),
    // Rewards
    getPointsBalance: () => electron_1.ipcRenderer.invoke('get-points-balance'),
    getAvailableRewards: () => electron_1.ipcRenderer.invoke('get-available-rewards'),
    getRedemptionHistory: () => electron_1.ipcRenderer.invoke('get-redemption-history'),
    requestReward: (rewardId) => electron_1.ipcRenderer.invoke('request-reward', rewardId),
    // Break Reminders
    getBreakReminderSettings: () => electron_1.ipcRenderer.invoke('get-break-reminder-settings'),
    setBreakReminderSettings: (settings) => electron_1.ipcRenderer.invoke('set-break-reminder-settings', settings),
    testBreakReminder: () => electron_1.ipcRenderer.invoke('test-break-reminder'),
    // Admin Protection
    setAdminCredentials: (password) => electron_1.ipcRenderer.invoke('set-admin-credentials', password),
    hasAdminCredentials: () => electron_1.ipcRenderer.invoke('has-admin-credentials'),
    // Events
    onGameStarted: (callback) => {
        electron_1.ipcRenderer.on('game-started', (_event, game) => callback(game));
    },
    onGameEnded: (callback) => {
        electron_1.ipcRenderer.on('game-ended', (_event, game) => callback(game));
    },
    onRefreshStats: (callback) => {
        electron_1.ipcRenderer.on('refresh-stats', () => callback());
    },
    removeAllListeners: (channel) => {
        electron_1.ipcRenderer.removeAllListeners(channel);
    },
});
