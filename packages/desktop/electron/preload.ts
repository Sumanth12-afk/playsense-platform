// electron/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Stats
  getTodayStats: () => ipcRenderer.invoke('get-today-stats'),
  getWeeklyStats: () => ipcRenderer.invoke('get-weekly-stats'),
  getGameStats: () => ipcRenderer.invoke('get-game-stats'),
  getHealthScore: () => ipcRenderer.invoke('get-health-score'),
  getCurrentSession: () => ipcRenderer.invoke('get-current-session'),

  // Settings
  getChildId: () => ipcRenderer.invoke('get-child-id'),
  setChildId: (childId: string) => ipcRenderer.invoke('set-child-id', childId),
  getSetting: (key: string) => ipcRenderer.invoke('get-setting', key),
  setSetting: (key: string, value: string) =>
    ipcRenderer.invoke('set-setting', key, value),

  // Sync
  triggerSync: () => ipcRenderer.invoke('trigger-sync'),
  getSyncStatus: () => ipcRenderer.invoke('get-sync-status'),
  testConnection: (childId?: string) => ipcRenderer.invoke('test-connection', childId),

  // Sessions
  getSessions: (limit?: number, offset?: number) =>
    ipcRenderer.invoke('get-sessions', limit, offset),

  // Window control
  hideToTray: () => ipcRenderer.invoke('hide-to-tray'),

  // Games management
  syncGames: () => ipcRenderer.invoke('sync-games'),
  getLocalGames: () => ipcRenderer.invoke('get-local-games'),

  // Rewards
  getPointsBalance: () => ipcRenderer.invoke('get-points-balance'),
  getAvailableRewards: () => ipcRenderer.invoke('get-available-rewards'),
  getRedemptionHistory: () => ipcRenderer.invoke('get-redemption-history'),
  requestReward: (rewardId: string) => ipcRenderer.invoke('request-reward', rewardId),

  // Break Reminders
  getBreakReminderSettings: () => ipcRenderer.invoke('get-break-reminder-settings'),
  setBreakReminderSettings: (settings: { enabled?: boolean; intervalMinutes?: number }) =>
    ipcRenderer.invoke('set-break-reminder-settings', settings),
  testBreakReminder: () => ipcRenderer.invoke('test-break-reminder'),

  // Admin Protection
  setAdminCredentials: (password: string) => ipcRenderer.invoke('set-admin-credentials', password),
  hasAdminCredentials: () => ipcRenderer.invoke('has-admin-credentials'),

  // Events
  onGameStarted: (callback: (game: any) => void) => {
    ipcRenderer.on('game-started', (_event, game) => callback(game));
  },
  onGameEnded: (callback: (game: any) => void) => {
    ipcRenderer.on('game-ended', (_event, game) => callback(game));
  },
  onRefreshStats: (callback: () => void) => {
    ipcRenderer.on('refresh-stats', () => callback());
  },
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  },
});

// Type definitions for the exposed API
export interface ElectronAPI {
  getTodayStats: () => Promise<any>;
  getWeeklyStats: () => Promise<any>;
  getGameStats: () => Promise<any>;
  getHealthScore: () => Promise<{ score: number; status: string }>;
  getCurrentSession: () => Promise<any>;
  getChildId: () => Promise<string | null>;
  setChildId: (childId: string) => Promise<{ success: boolean }>;
  getSetting: (key: string) => Promise<string | null>;
  setSetting: (key: string, value: string) => Promise<{ success: boolean }>;
  triggerSync: () => Promise<any>;
  getSyncStatus: () => Promise<any>;
  testConnection: (childId?: string) => Promise<{ connected: boolean; message?: string }>;
  getSessions: (limit?: number, offset?: number) => Promise<any[]>;
  hideToTray: () => Promise<{ success: boolean }>;
  syncGames: () => Promise<{ success: boolean; count: number; message?: string }>;
  getLocalGames: () => Promise<Array<{
    id: string;
    name: string;
    executables: string[];
    category: string;
    icon_url: string | null;
  }>>;
  // Rewards
  getPointsBalance: () => Promise<number | null>;
  getAvailableRewards: () => Promise<Array<{
    id: string;
    reward_name: string;
    reward_type: string;
    description: string;
    points_required: number;
    icon: string;
  }>>;
  getRedemptionHistory: () => Promise<Array<{
    id: string;
    reward_name: string;
    icon: string;
    points_spent: number;
    status: 'pending' | 'approved' | 'denied' | 'completed';
    requested_at: string;
  }>>;
  requestReward: (rewardId: string) => Promise<{ success: boolean; error?: string; redemptionId?: string }>;
  // Break Reminders
  getBreakReminderSettings: () => Promise<{ enabled: boolean; intervalMinutes: number; minSessionMinutes: number }>;
  setBreakReminderSettings: (settings: { enabled?: boolean; intervalMinutes?: number }) => Promise<{ success: boolean }>;
  testBreakReminder: () => Promise<{ success: boolean }>;
  // Admin Protection
  setAdminCredentials: (password: string) => Promise<{ success: boolean; error?: string }>;
  hasAdminCredentials: () => Promise<boolean>;
  onGameStarted: (callback: (game: any) => void) => void;
  onGameEnded: (callback: (game: any) => void) => void;
  onRefreshStats: (callback: () => void) => void;
  removeAllListeners: (channel: string) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

