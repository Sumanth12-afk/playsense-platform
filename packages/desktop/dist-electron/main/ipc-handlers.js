"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerIpcHandlers = registerIpcHandlers;
// electron/main/ipc-handlers.ts
const electron_1 = require("electron");
const database_1 = require("../services/database");
const supabase_sync_1 = __importDefault(require("../services/supabase-sync"));
const games_sync_1 = __importDefault(require("../services/games-sync"));
const break_reminder_1 = __importDefault(require("../services/break-reminder"));
const analytics_1 = require("../services/analytics");
const logger_1 = require("../utils/logger");
const windows_1 = require("./windows");
function registerIpcHandlers() {
    // Get today's stats
    electron_1.ipcMain.handle('get-today-stats', async () => {
        try {
            return (0, analytics_1.getTodayStats)();
        }
        catch (error) {
            logger_1.logger.error('Error getting today stats:', error);
            throw error;
        }
    });
    // Get weekly stats
    electron_1.ipcMain.handle('get-weekly-stats', async () => {
        try {
            return (0, analytics_1.getWeeklyStats)();
        }
        catch (error) {
            logger_1.logger.error('Error getting weekly stats:', error);
            throw error;
        }
    });
    // Get game stats
    electron_1.ipcMain.handle('get-game-stats', async () => {
        try {
            return (0, analytics_1.getGameStats)();
        }
        catch (error) {
            logger_1.logger.error('Error getting game stats:', error);
            throw error;
        }
    });
    // Get health score
    electron_1.ipcMain.handle('get-health-score', async () => {
        try {
            return (0, analytics_1.getHealthScore)();
        }
        catch (error) {
            logger_1.logger.error('Error getting health score:', error);
            throw error;
        }
    });
    // Get current session
    electron_1.ipcMain.handle('get-current-session', async () => {
        try {
            return (0, analytics_1.getCurrentSession)();
        }
        catch (error) {
            logger_1.logger.error('Error getting current session:', error);
            throw error;
        }
    });
    // Set child ID
    electron_1.ipcMain.handle('set-child-id', async (_event, childId) => {
        try {
            const trimmedChildId = (childId || '').trim();
            if (!trimmedChildId) {
                return { success: false, error: 'Child ID is required' };
            }
            const db = (0, database_1.getDatabase)();
            // Get the current child_id before changing
            const currentChildId = db
                .prepare("SELECT value FROM settings WHERE key = 'child_id'")
                .get();
            // If switching to a different child, clear old sessions
            // (old sessions belong to the previous child)
            if (currentChildId && currentChildId.value !== trimmedChildId) {
                logger_1.logger.info(`Switching child ID from ${currentChildId.value} to ${trimmedChildId}. Clearing old sessions.`);
                // Delete all old gaming sessions
                const deleted = db.prepare('DELETE FROM gaming_sessions').run();
                logger_1.logger.info(`Cleared ${deleted.changes} old gaming sessions`);
            }
            // Update the child ID
            supabase_sync_1.default.setChildId(trimmedChildId);
            // Save to settings
            db.prepare(`INSERT OR REPLACE INTO settings (key, value, updated_at) 
         VALUES ('child_id', ?, datetime('now'))`).run(trimmedChildId);
            logger_1.logger.info(`Child ID configured: ${trimmedChildId}`);
            // Award welcome bonus points if child doesn't have any yet
            // This handles both first setup AND switching to a new child
            try {
                const { createClient } = await Promise.resolve().then(() => __importStar(require('@supabase/supabase-js')));
                const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
                const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
                if (!supabaseUrl || !supabaseKey) {
                    logger_1.logger.warn('Supabase not configured, skipping welcome bonus check');
                    return true;
                }
                const supabase = createClient(supabaseUrl, supabaseKey);
                // Check if this child already has any points transactions
                const { data: existingPoints, error: checkError } = await supabase
                    .from('reward_points')
                    .select('id')
                    .eq('child_id', trimmedChildId)
                    .eq('reason', 'welcome_bonus')
                    .limit(1);
                // If no welcome bonus yet, award 50 points
                if (!checkError && (!existingPoints || existingPoints.length === 0)) {
                    const { error: awardError } = await supabase.rpc('award_points', {
                        p_child_id: trimmedChildId,
                        p_points: 50,
                        p_reason: 'welcome_bonus',
                        p_reference_id: null
                    });
                    if (!awardError) {
                        logger_1.logger.info(`Awarded 50 welcome bonus points to child ${trimmedChildId}`);
                    }
                    else {
                        logger_1.logger.error('Failed to award welcome points:', awardError);
                    }
                }
                else {
                    logger_1.logger.info(`Child ${trimmedChildId} already has welcome bonus`);
                }
            }
            catch (pointsError) {
                logger_1.logger.error('Failed to check/award welcome points:', pointsError);
                // Don't fail - this is not critical
            }
            // Pull existing cloud sessions so dashboard shows history (e.g. after reinstall with same child ID)
            try {
                const { pulled } = await supabase_sync_1.default.pullCloudSessions();
                if (pulled > 0) {
                    logger_1.logger.info(`Pulled ${pulled} sessions from cloud for dashboard`);
                }
                // Notify renderer so dashboard refreshes and shows history immediately (after reinstall or child switch)
                (0, windows_1.getMainWindow)()?.webContents?.send('refresh-stats');
            }
            catch (pullError) {
                logger_1.logger.error('Failed to pull cloud sessions:', pullError);
            }
            // Ensure sync service is running (e.g. after reinstall when no child_id at app launch)
            try {
                await supabase_sync_1.default.start(60000);
                logger_1.logger.info('Sync service started after child ID set');
            }
            catch (startError) {
                logger_1.logger.error('Failed to start sync service:', startError);
            }
            // If this is initial setup, prompt for admin credentials (MANDATORY)
            if (!currentChildId) {
                logger_1.logger.info('Initial setup - prompting for admin credentials');
                const { default: adminProtection } = await Promise.resolve().then(() => __importStar(require('../services/admin-protection')));
                const credentialsSet = await adminProtection.promptSetCredentials();
                if (!credentialsSet) {
                    // User cancelled or app exited - this shouldn't happen as it's mandatory
                    return { success: false, error: 'Admin credentials required' };
                }
            }
            return { success: true };
        }
        catch (error) {
            logger_1.logger.error('Error setting child ID:', error);
            throw error;
        }
    });
    // Get child ID
    electron_1.ipcMain.handle('get-child-id', async () => {
        try {
            const db = (0, database_1.getDatabase)();
            const result = db
                .prepare("SELECT value FROM settings WHERE key = 'child_id'")
                .get();
            return result?.value || null;
        }
        catch (error) {
            logger_1.logger.error('Error getting child ID:', error);
            throw error;
        }
    });
    // Trigger sync
    electron_1.ipcMain.handle('trigger-sync', async () => {
        try {
            const result = await supabase_sync_1.default.sync();
            return result;
        }
        catch (error) {
            logger_1.logger.error('Error triggering sync:', error);
            throw error;
        }
    });
    // Get sync status
    electron_1.ipcMain.handle('get-sync-status', async () => {
        try {
            return supabase_sync_1.default.getStatus();
        }
        catch (error) {
            logger_1.logger.error('Error getting sync status:', error);
            throw error;
        }
    });
    // Test connection
    electron_1.ipcMain.handle('test-connection', async (_event, childId) => {
        try {
            const result = await supabase_sync_1.default.testConnection(childId);
            return result;
        }
        catch (error) {
            logger_1.logger.error('Error testing connection:', error);
            return { connected: false, message: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    // Get settings
    electron_1.ipcMain.handle('get-setting', async (_event, key) => {
        try {
            const db = (0, database_1.getDatabase)();
            const result = db
                .prepare('SELECT value FROM settings WHERE key = ?')
                .get(key);
            return result?.value || null;
        }
        catch (error) {
            logger_1.logger.error(`Error getting setting ${key}:`, error);
            throw error;
        }
    });
    // Set setting
    electron_1.ipcMain.handle('set-setting', async (_event, key, value) => {
        try {
            const db = (0, database_1.getDatabase)();
            db.prepare(`INSERT OR REPLACE INTO settings (key, value, updated_at) 
         VALUES (?, ?, datetime('now'))`).run(key, value);
            logger_1.logger.info(`Setting updated: ${key}`);
            return { success: true };
        }
        catch (error) {
            logger_1.logger.error(`Error setting ${key}:`, error);
            throw error;
        }
    });
    // Get all sessions (paginated)
    electron_1.ipcMain.handle('get-sessions', async (_event, limit = 50, offset = 0) => {
        try {
            const db = (0, database_1.getDatabase)();
            const sessions = db
                .prepare(`SELECT * FROM gaming_sessions 
           WHERE ended_at IS NOT NULL
           ORDER BY started_at DESC 
           LIMIT ? OFFSET ?`)
                .all(limit, offset);
            return sessions;
        }
        catch (error) {
            logger_1.logger.error('Error getting sessions:', error);
            throw error;
        }
    });
    // Hide window to tray
    electron_1.ipcMain.handle('hide-to-tray', async () => {
        try {
            (0, windows_1.hideMainWindow)();
            logger_1.logger.info('Window hidden to tray via IPC');
            return { success: true };
        }
        catch (error) {
            logger_1.logger.error('Error hiding to tray:', error);
            throw error;
        }
    });
    // Sync games from Supabase
    electron_1.ipcMain.handle('sync-games', async () => {
        try {
            const result = await games_sync_1.default.syncGames();
            return result;
        }
        catch (error) {
            logger_1.logger.error('Error syncing games:', error);
            throw error;
        }
    });
    // Get local games
    electron_1.ipcMain.handle('get-local-games', async () => {
        try {
            const games = games_sync_1.default.getLocalGames();
            return games;
        }
        catch (error) {
            logger_1.logger.error('Error getting local games:', error);
            throw error;
        }
    });
    // === REWARDS IPC HANDLERS ===
    // Get points balance for the child (return null on error so UI doesn't overwrite with 0)
    electron_1.ipcMain.handle('get-points-balance', async () => {
        try {
            const childId = await getChildId();
            logger_1.logger.info(`[get-points-balance] Child ID: ${childId || '(none)'}`);
            if (!childId) {
                logger_1.logger.warn('[get-points-balance] No child ID configured');
                return null;
            }
            const supabase = await getSupabaseForRewards();
            logger_1.logger.info(`[get-points-balance] Calling Supabase RPC get_points_balance...`);
            const { data, error } = await supabase.rpc('get_points_balance', { p_child_id: childId });
            if (error) {
                logger_1.logger.error('[get-points-balance] Supabase error:', error);
                throw error;
            }
            const balance = typeof data === 'number' ? data : (data ?? 0);
            logger_1.logger.info(`[get-points-balance] Points received: ${balance}`);
            return balance;
        }
        catch (error) {
            logger_1.logger.error('Error getting points balance:', error);
            return null;
        }
    });
    // Get available rewards (use service-role client so we can read children + rewards without auth)
    electron_1.ipcMain.handle('get-available-rewards', async () => {
        try {
            const childId = await getChildId();
            logger_1.logger.info(`[get-available-rewards] Child ID: ${childId || '(none)'}`);
            if (!childId)
                return [];
            const supabase = await getSupabaseForRewards();
            // Get parent ID from child (column is parent_id in Supabase; do not query user_id or RLS may error)
            const { data: child, error: childError } = await supabase
                .from('children')
                .select('parent_id')
                .eq('id', childId)
                .single();
            if (childError) {
                logger_1.logger.warn('[get-available-rewards] Could not get parent from child:', childError);
                return [];
            }
            const parentId = child?.parent_id;
            logger_1.logger.info(`[get-available-rewards] Parent ID: ${parentId || '(none)'}`);
            if (!parentId) {
                logger_1.logger.warn('[get-available-rewards] parent_id is null/empty for this child');
                return [];
            }
            // Get rewards from parent (rewards.parent_id = auth user id)
            const { data: rewards, error: rewardsError } = await supabase
                .from('rewards')
                .select('*')
                .eq('parent_id', parentId)
                .eq('is_active', true)
                .order('points_required', { ascending: true });
            if (rewardsError) {
                logger_1.logger.error('[get-available-rewards] Error fetching rewards:', rewardsError);
                throw rewardsError;
            }
            logger_1.logger.info(`[get-available-rewards] Found ${rewards?.length || 0} rewards for parent`);
            return rewards || [];
        }
        catch (error) {
            logger_1.logger.error('Error getting available rewards:', error);
            return [];
        }
    });
    // Get redemption history (use service-role so we can read from desktop)
    electron_1.ipcMain.handle('get-redemption-history', async () => {
        try {
            const childId = await getChildId();
            if (!childId)
                return [];
            const supabase = await getSupabaseForRewards();
            const { data, error } = await supabase
                .from('reward_redemptions')
                .select(`
          id,
          points_spent,
          status,
          requested_at,
          rewards (
            reward_name,
            icon
          )
        `)
                .eq('child_id', childId)
                .order('requested_at', { ascending: false })
                .limit(10);
            if (error)
                throw error;
            return (data || []).map(r => ({
                id: r.id,
                reward_name: r.rewards?.reward_name || 'Unknown',
                icon: r.rewards?.icon || '🎁',
                points_spent: r.points_spent,
                status: r.status,
                requested_at: r.requested_at,
            }));
        }
        catch (error) {
            logger_1.logger.error('Error getting redemption history:', error);
            return [];
        }
    });
    // Request a reward (creates pending redemption; use service-role so RPC works from desktop)
    electron_1.ipcMain.handle('request-reward', async (_event, rewardId) => {
        try {
            const childId = await getChildId();
            if (!childId) {
                return { success: false, error: 'Not configured' };
            }
            const supabase = await getSupabaseForRewards();
            // Use the redeem_reward function which handles validation
            const { data, error } = await supabase.rpc('redeem_reward', {
                p_child_id: childId,
                p_reward_id: rewardId,
            });
            if (error) {
                logger_1.logger.error('Error requesting reward:', error);
                return { success: false, error: error.message };
            }
            logger_1.logger.info(`Reward requested: ${rewardId} for child ${childId}`);
            return { success: true, redemptionId: data };
        }
        catch (error) {
            logger_1.logger.error('Error requesting reward:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    // === ADMIN PROTECTION IPC HANDLERS ===
    // Set admin credentials (from React onboarding wizard)
    electron_1.ipcMain.handle('set-admin-credentials', async (_event, password) => {
        try {
            const { default: adminProtection } = await Promise.resolve().then(() => __importStar(require('../services/admin-protection')));
            // Use a default username 'admin' since the new UI only asks for password
            await adminProtection.setCredentialsFromUI('admin', password);
            logger_1.logger.info('Admin credentials set from onboarding wizard');
            return { success: true };
        }
        catch (error) {
            logger_1.logger.error('Error setting admin credentials:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    // Check if admin credentials are already set
    electron_1.ipcMain.handle('has-admin-credentials', async () => {
        try {
            const { default: adminProtection } = await Promise.resolve().then(() => __importStar(require('../services/admin-protection')));
            const password = await adminProtection.getStoredPassword();
            return password !== null;
        }
        catch (error) {
            logger_1.logger.error('Error checking admin credentials:', error);
            return false;
        }
    });
    // === BREAK REMINDER IPC HANDLERS ===
    // Get break reminder settings
    electron_1.ipcMain.handle('get-break-reminder-settings', async () => {
        try {
            return break_reminder_1.default.getSettings();
        }
        catch (error) {
            logger_1.logger.error('Error getting break reminder settings:', error);
            return { enabled: true, intervalMinutes: 60, minSessionMinutes: 30 };
        }
    });
    // Update break reminder settings
    electron_1.ipcMain.handle('set-break-reminder-settings', async (_event, settings) => {
        try {
            await break_reminder_1.default.updateSettings(settings);
            return { success: true };
        }
        catch (error) {
            logger_1.logger.error('Error updating break reminder settings:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    // Test break reminder notification
    electron_1.ipcMain.handle('test-break-reminder', async () => {
        try {
            break_reminder_1.default.forceReminder(60);
            return { success: true };
        }
        catch (error) {
            logger_1.logger.error('Error testing break reminder:', error);
            return { success: false };
        }
    });
    logger_1.logger.info('IPC handlers registered');
}
// Helper function to get child ID (trimmed for RPC)
async function getChildId() {
    try {
        const db = (0, database_1.getDatabase)();
        const result = db
            .prepare("SELECT value FROM settings WHERE key = 'child_id'")
            .get();
        const id = (result?.value || '').trim();
        return id || null;
    }
    catch {
        return null;
    }
}
// Supabase client for rewards (prefer service role so RPC works from desktop)
async function getSupabaseForRewards() {
    const { createClient } = await Promise.resolve().then(() => __importStar(require('@supabase/supabase-js')));
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://ycwlwaolrzriydhkgrwr.supabase.co';
    // Use service role key from env, fall back to anon key from env
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    if (!key) {
        logger_1.logger.error('No Supabase key configured - set SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY');
        throw new Error('Supabase key not configured');
    }
    return createClient(url, key);
}
