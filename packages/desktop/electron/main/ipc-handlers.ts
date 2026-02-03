// electron/main/ipc-handlers.ts
import { ipcMain } from 'electron';
import { getDatabase } from '../services/database';
import supabaseSyncService from '../services/supabase-sync';
import gamesSyncService from '../services/games-sync';
import breakReminderService from '../services/break-reminder';
import {
  getTodayStats,
  getWeeklyStats,
  getGameStats,
  getHealthScore,
  getCurrentSession,
} from '../services/analytics';
import { logger } from '../utils/logger';
import { getMainWindow, hideMainWindow } from './windows';

export function registerIpcHandlers() {
  // Get today's stats
  ipcMain.handle('get-today-stats', async () => {
    try {
      return getTodayStats();
    } catch (error) {
      logger.error('Error getting today stats:', error);
      throw error;
    }
  });

  // Get weekly stats
  ipcMain.handle('get-weekly-stats', async () => {
    try {
      return getWeeklyStats();
    } catch (error) {
      logger.error('Error getting weekly stats:', error);
      throw error;
    }
  });

  // Get game stats
  ipcMain.handle('get-game-stats', async () => {
    try {
      return getGameStats();
    } catch (error) {
      logger.error('Error getting game stats:', error);
      throw error;
    }
  });

  // Get health score
  ipcMain.handle('get-health-score', async () => {
    try {
      return getHealthScore();
    } catch (error) {
      logger.error('Error getting health score:', error);
      throw error;
    }
  });

  // Get current session
  ipcMain.handle('get-current-session', async () => {
    try {
      return getCurrentSession();
    } catch (error) {
      logger.error('Error getting current session:', error);
      throw error;
    }
  });

  // Set child ID
  ipcMain.handle('set-child-id', async (_event, childId: string) => {
    try {
      const trimmedChildId = (childId || '').trim();
      if (!trimmedChildId) {
        return { success: false, error: 'Child ID is required' };
      }

      const db = getDatabase();

      // Get the current child_id before changing
      const currentChildId = db
        .prepare("SELECT value FROM settings WHERE key = 'child_id'")
        .get() as { value: string } | undefined;

      // If switching to a different child, clear old sessions
      // (old sessions belong to the previous child)
      if (currentChildId && currentChildId.value !== trimmedChildId) {
        logger.info(`Switching child ID from ${currentChildId.value} to ${trimmedChildId}. Clearing old sessions.`);

        // Delete all old gaming sessions
        const deleted = db.prepare('DELETE FROM gaming_sessions').run();
        logger.info(`Cleared ${deleted.changes} old gaming sessions`);
      }

      // Update the child ID
      supabaseSyncService.setChildId(trimmedChildId);

      // Save to settings
      db.prepare(
        `INSERT OR REPLACE INTO settings (key, value, updated_at) 
         VALUES ('child_id', ?, datetime('now'))`
      ).run(trimmedChildId);

      logger.info(`Child ID configured: ${trimmedChildId}`);

      // Award welcome bonus points if child doesn't have any yet
      // This handles both first setup AND switching to a new child
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.VITE_SUPABASE_URL || 'https://ycwlwaolrzriydhkgrwr.supabase.co',
          process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inljd2x3YW9scnpyaXlkaGtncndyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzY5NDc4OSwiZXhwIjoyMDgzMjcwNzg5fQ.rQlBQ1UAm-QKCOSUilyWZKi4HLO8HC5cnSdXvws8tCM'
        );

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
            logger.info(`Awarded 50 welcome bonus points to child ${trimmedChildId}`);
          } else {
            logger.error('Failed to award welcome points:', awardError);
          }
        } else {
          logger.info(`Child ${trimmedChildId} already has welcome bonus`);
        }
      } catch (pointsError) {
        logger.error('Failed to check/award welcome points:', pointsError);
        // Don't fail - this is not critical
      }

      // Pull existing cloud sessions so dashboard shows history (e.g. after reinstall with same child ID)
      try {
        const { pulled } = await supabaseSyncService.pullCloudSessions();
        if (pulled > 0) {
          logger.info(`Pulled ${pulled} sessions from cloud for dashboard`);
        }
        // Notify renderer so dashboard refreshes and shows history immediately (after reinstall or child switch)
        getMainWindow()?.webContents?.send('refresh-stats');
      } catch (pullError) {
        logger.error('Failed to pull cloud sessions:', pullError);
      }

      // Ensure sync service is running (e.g. after reinstall when no child_id at app launch)
      try {
        await supabaseSyncService.start(60000);
        logger.info('Sync service started after child ID set');
      } catch (startError) {
        logger.error('Failed to start sync service:', startError);
      }

      // If this is initial setup, prompt for admin credentials (MANDATORY)
      if (!currentChildId) {
        logger.info('Initial setup - prompting for admin credentials');
        const { default: adminProtection } = await import('../services/admin-protection');
        const credentialsSet = await adminProtection.promptSetCredentials();

        if (!credentialsSet) {
          // User cancelled or app exited - this shouldn't happen as it's mandatory
          return { success: false, error: 'Admin credentials required' };
        }
      }

      return { success: true };
    } catch (error) {
      logger.error('Error setting child ID:', error);
      throw error;
    }
  });

  // Get child ID
  ipcMain.handle('get-child-id', async () => {
    try {
      const db = getDatabase();
      const result = db
        .prepare("SELECT value FROM settings WHERE key = 'child_id'")
        .get() as { value: string } | undefined;

      return result?.value || null;
    } catch (error) {
      logger.error('Error getting child ID:', error);
      throw error;
    }
  });

  // Trigger sync
  ipcMain.handle('trigger-sync', async () => {
    try {
      const result = await supabaseSyncService.sync();
      return result;
    } catch (error) {
      logger.error('Error triggering sync:', error);
      throw error;
    }
  });

  // Get sync status
  ipcMain.handle('get-sync-status', async () => {
    try {
      return supabaseSyncService.getStatus();
    } catch (error) {
      logger.error('Error getting sync status:', error);
      throw error;
    }
  });

  // Test connection
  ipcMain.handle('test-connection', async (_event, childId?: string) => {
    try {
      const result = await supabaseSyncService.testConnection(childId);
      return result;
    } catch (error) {
      logger.error('Error testing connection:', error);
      return { connected: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Get settings
  ipcMain.handle('get-setting', async (_event, key: string) => {
    try {
      const db = getDatabase();
      const result = db
        .prepare('SELECT value FROM settings WHERE key = ?')
        .get(key) as { value: string } | undefined;

      return result?.value || null;
    } catch (error) {
      logger.error(`Error getting setting ${key}:`, error);
      throw error;
    }
  });

  // Set setting
  ipcMain.handle('set-setting', async (_event, key: string, value: string) => {
    try {
      const db = getDatabase();
      db.prepare(
        `INSERT OR REPLACE INTO settings (key, value, updated_at) 
         VALUES (?, ?, datetime('now'))`
      ).run(key, value);

      logger.info(`Setting updated: ${key}`);
      return { success: true };
    } catch (error) {
      logger.error(`Error setting ${key}:`, error);
      throw error;
    }
  });

  // Get all sessions (paginated)
  ipcMain.handle('get-sessions', async (_event, limit = 50, offset = 0) => {
    try {
      const db = getDatabase();
      const sessions = db
        .prepare(
          `SELECT * FROM gaming_sessions 
           WHERE ended_at IS NOT NULL
           ORDER BY started_at DESC 
           LIMIT ? OFFSET ?`
        )
        .all(limit, offset);

      return sessions;
    } catch (error) {
      logger.error('Error getting sessions:', error);
      throw error;
    }
  });

  // Hide window to tray
  ipcMain.handle('hide-to-tray', async () => {
    try {
      hideMainWindow();
      logger.info('Window hidden to tray via IPC');
      return { success: true };
    } catch (error) {
      logger.error('Error hiding to tray:', error);
      throw error;
    }
  });

  // Sync games from Supabase
  ipcMain.handle('sync-games', async () => {
    try {
      const result = await gamesSyncService.syncGames();
      return result;
    } catch (error) {
      logger.error('Error syncing games:', error);
      throw error;
    }
  });

  // Get local games
  ipcMain.handle('get-local-games', async () => {
    try {
      const games = gamesSyncService.getLocalGames();
      return games;
    } catch (error) {
      logger.error('Error getting local games:', error);
      throw error;
    }
  });

  // === REWARDS IPC HANDLERS ===

  // Get points balance for the child (return null on error so UI doesn't overwrite with 0)
  ipcMain.handle('get-points-balance', async () => {
    try {
      const childId = await getChildId();
      logger.info(`[get-points-balance] Child ID: ${childId || '(none)'}`);
      if (!childId) {
        logger.warn('[get-points-balance] No child ID configured');
        return null;
      }

      const supabase = await getSupabaseForRewards();
      logger.info(`[get-points-balance] Calling Supabase RPC get_points_balance...`);
      const { data, error } = await supabase.rpc('get_points_balance', { p_child_id: childId });

      if (error) {
        logger.error('[get-points-balance] Supabase error:', error);
        throw error;
      }

      const balance = typeof data === 'number' ? data : (data ?? 0);
      logger.info(`[get-points-balance] Points received: ${balance}`);
      return balance;
    } catch (error) {
      logger.error('Error getting points balance:', error);
      return null;
    }
  });

  // Get available rewards (use service-role client so we can read children + rewards without auth)
  ipcMain.handle('get-available-rewards', async () => {
    try {
      const childId = await getChildId();
      logger.info(`[get-available-rewards] Child ID: ${childId || '(none)'}`);
      if (!childId) return [];

      const supabase = await getSupabaseForRewards();

      // Get parent ID from child (column is parent_id in Supabase; do not query user_id or RLS may error)
      const { data: child, error: childError } = await supabase
        .from('children')
        .select('parent_id')
        .eq('id', childId)
        .single();

      if (childError) {
        logger.warn('[get-available-rewards] Could not get parent from child:', childError);
        return [];
      }
      const parentId = child?.parent_id;
      logger.info(`[get-available-rewards] Parent ID: ${parentId || '(none)'}`);
      if (!parentId) {
        logger.warn('[get-available-rewards] parent_id is null/empty for this child');
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
        logger.error('[get-available-rewards] Error fetching rewards:', rewardsError);
        throw rewardsError;
      }
      logger.info(`[get-available-rewards] Found ${rewards?.length || 0} rewards for parent`);
      return rewards || [];
    } catch (error) {
      logger.error('Error getting available rewards:', error);
      return [];
    }
  });

  // Get redemption history (use service-role so we can read from desktop)
  ipcMain.handle('get-redemption-history', async () => {
    try {
      const childId = await getChildId();
      if (!childId) return [];

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

      if (error) throw error;

      return (data || []).map(r => ({
        id: r.id,
        reward_name: (r.rewards as any)?.reward_name || 'Unknown',
        icon: (r.rewards as any)?.icon || '🎁',
        points_spent: r.points_spent,
        status: r.status,
        requested_at: r.requested_at,
      }));
    } catch (error) {
      logger.error('Error getting redemption history:', error);
      return [];
    }
  });

  // Request a reward (creates pending redemption; use service-role so RPC works from desktop)
  ipcMain.handle('request-reward', async (_event, rewardId: string) => {
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
        logger.error('Error requesting reward:', error);
        return { success: false, error: error.message };
      }

      logger.info(`Reward requested: ${rewardId} for child ${childId}`);
      return { success: true, redemptionId: data };
    } catch (error) {
      logger.error('Error requesting reward:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // === ADMIN PROTECTION IPC HANDLERS ===

  // Set admin credentials (from React onboarding wizard)
  ipcMain.handle('set-admin-credentials', async (_event, password: string) => {
    try {
      const { default: adminProtection } = await import('../services/admin-protection');
      
      // Use a default username 'admin' since the new UI only asks for password
      await adminProtection.setCredentialsFromUI('admin', password);
      
      logger.info('Admin credentials set from onboarding wizard');
      return { success: true };
    } catch (error) {
      logger.error('Error setting admin credentials:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Check if admin credentials are already set
  ipcMain.handle('has-admin-credentials', async () => {
    try {
      const { default: adminProtection } = await import('../services/admin-protection');
      const password = await adminProtection.getStoredPassword();
      return password !== null;
    } catch (error) {
      logger.error('Error checking admin credentials:', error);
      return false;
    }
  });

  // === BREAK REMINDER IPC HANDLERS ===

  // Get break reminder settings
  ipcMain.handle('get-break-reminder-settings', async () => {
    try {
      return breakReminderService.getSettings();
    } catch (error) {
      logger.error('Error getting break reminder settings:', error);
      return { enabled: true, intervalMinutes: 60, minSessionMinutes: 30 };
    }
  });

  // Update break reminder settings
  ipcMain.handle('set-break-reminder-settings', async (_event, settings: { enabled?: boolean; intervalMinutes?: number }) => {
    try {
      await breakReminderService.updateSettings(settings);
      return { success: true };
    } catch (error) {
      logger.error('Error updating break reminder settings:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Test break reminder notification
  ipcMain.handle('test-break-reminder', async () => {
    try {
      breakReminderService.forceReminder(60);
      return { success: true };
    } catch (error) {
      logger.error('Error testing break reminder:', error);
      return { success: false };
    }
  });

  logger.info('IPC handlers registered');
}

// Helper function to get child ID (trimmed for RPC)
async function getChildId(): Promise<string | null> {
  try {
    const db = getDatabase();
    const result = db
      .prepare("SELECT value FROM settings WHERE key = 'child_id'")
      .get() as { value: string } | undefined;
    const id = (result?.value || '').trim();
    return id || null;
  } catch {
    return null;
  }
}

// Supabase client for rewards (prefer service role so RPC works from desktop)
async function getSupabaseForRewards() {
  const { createClient } = await import('@supabase/supabase-js');
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://ycwlwaolrzriydhkgrwr.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inljd2x3YW9scnpyaXlkaGtncndyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzY5NDc4OSwiZXhwIjoyMDgzMjcwNzg5fQ.rQlBQ1UAm-QKCOSUilyWZKi4HLO8HC5cnSdXvws8tCM';
  return createClient(url, key);
}

