// electron/services/supabase-sync.ts
import { getDatabase } from './database';
import { logger } from '../utils/logger';
import { randomUUID } from 'crypto';
import { net } from 'electron';

const API_BASE_URL = process.env.SUPABASE_URL || 'https://ycwlwaolrzriydhkgrwr.supabase.co';
const API_FUNCTIONS_URL = `${API_BASE_URL}/functions/v1`;
const API_ENDPOINT = `${API_FUNCTIONS_URL}/super-responder`;

// Service role key MUST be set via environment variable - never hardcode!
const getServiceRoleKey = () => {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    logger.error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set!');
  }
  return key || '';
};

interface LocalSession {
  id: string;
  game_name: string;
  game_executable: string;
  category: string;
  started_at: string;
  ended_at: string;
  duration_minutes: number;
}

class SupabaseSyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private childId: string | null = null;
  private deviceId: string = '';
  private deviceName: string = 'Desktop';
  private isOnline: boolean = true;

  constructor() {
    // Device ID will be initialized when database is ready
  }

  initialize() {
    if (!this.deviceId) {
      this.deviceId = this.getOrCreateDeviceId();
      this.deviceName = this.getOrCreateDeviceName();
    }
  }

  setChildId(childId: string) {
    this.childId = childId ? String(childId).trim() : childId;
    logger.info(`Child ID set: ${this.childId}`);
  }

  getChildId(): string | null {
    return this.childId;
  }

  /**
   * Pull existing gaming sessions from cloud for this child into local DB.
   * Call this when app starts or when child ID is set so history shows after reinstall.
   */
  async pullCloudSessions(): Promise<{ pulled: number }> {
    if (!this.childId) {
      logger.warn('Pull skipped: no child ID configured');
      return { pulled: 0 };
    }

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || API_BASE_URL;
      const key = getServiceRoleKey();
      if (!key) {
        logger.error('Cannot pull cloud sessions: service role key not configured');
        return { pulled: 0 };
      }
      const supabase = createClient(url, key);

      const childIdTrimmed = (this.childId || '').trim();
      if (!childIdTrimmed) {
        logger.warn('Pull skipped: child ID empty after trim');
        return { pulled: 0 };
      }

      // Select only columns that exist; game name/category come from games join (schema may not have game_name/category on gaming_sessions)
      const { data: rows, error } = await supabase
        .from('gaming_sessions')
        .select('id, started_at, ended_at, duration_minutes, game:games(name, category)')
        .eq('child_id', childIdTrimmed)
        .not('ended_at', 'is', null)
        .order('started_at', { ascending: false })
        .limit(500);

      if (error) {
        logger.error('Pull cloud sessions error:', error);
        return { pulled: 0 };
      }

      if (!rows || rows.length === 0) {
        logger.info('No cloud sessions to pull');
        return { pulled: 0 };
      }

      const db = getDatabase();
      const existing = db.prepare('SELECT 1 FROM gaming_sessions WHERE cloud_session_id = ?').pluck();
      const insert = db.prepare(`
        INSERT OR IGNORE INTO gaming_sessions (id, game_name, game_executable, category, started_at, ended_at, duration_minutes, is_synced, synced_at, cloud_session_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), ?)
      `);

      const allowedCategories = ['competitive', 'creative', 'casual', 'social', 'unknown'];
      let pulled = 0;

      for (const row of rows as any[]) {
        const cloudId = row.id;
        if (!cloudId || !row.started_at || !row.ended_at) continue;
        const already = existing.get(cloudId);
        if (already) continue;

        const game = row.game;
        const gameName = game?.name || 'Unknown';
        const rawCategory = (game?.category || 'unknown').toLowerCase();
        const category = allowedCategories.includes(rawCategory) ? rawCategory : 'unknown';
        const duration = row.duration_minutes != null ? row.duration_minutes : Math.round((new Date(row.ended_at).getTime() - new Date(row.started_at).getTime()) / 60000);
        const localId = randomUUID().replace(/-/g, '').slice(0, 32);

        try {
          insert.run(localId, gameName, '', category, row.started_at, row.ended_at, duration, cloudId);
          pulled++;
        } catch (e) {
          logger.debug('Skip insert duplicate or invalid:', e);
        }
      }

      if (pulled > 0) {
        logger.info(`Pulled ${pulled} cloud sessions into local DB`);
      }
      return { pulled };
    } catch (error) {
      logger.error('pullCloudSessions failed:', error);
      return { pulled: 0 };
    }
  }

  async start(intervalMs = 60000) {
    // Idempotent: stop existing intervals so we don't double up
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.stopHeartbeat();

    logger.info('Starting sync service...');

    // Initialize device ID
    this.initialize();

    // Pull existing cloud history first so dashboard shows data after reinstall
    await this.pullCloudSessions();

    // Initial sync (upload any local unsynced)
    await this.sync();

    // Set up periodic sync
    this.syncInterval = setInterval(() => this.sync(), intervalMs);

    // Start heartbeat (keeps device "online")
    if (this.childId) {
      this.startHeartbeat();
    }
  }

  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.stopHeartbeat();
    logger.info('Sync service stopped');
  }

  private startHeartbeat() {
    if (!this.childId) return;

    // Send immediately
    this.sendHeartbeat();

    // Then every 60 seconds
    this.heartbeatInterval = setInterval(() => this.sendHeartbeat(), 60000);
    logger.info('Heartbeat started');
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      logger.info('Heartbeat stopped');
    }
  }

  private async sendHeartbeat() {
    if (!this.childId) return;

    try {
      const url = `${API_ENDPOINT}?child_id=${this.childId}`;

      await this.fetch(url, {
        method: 'GET',
      });

      logger.debug('Heartbeat sent successfully');
      this.isOnline = true;
    } catch (error) {
      logger.error('Heartbeat failed:', error);
      this.isOnline = false;
    }
  }

  async sync() {
    if (!this.childId) {
      logger.warn('Sync skipped: no child ID configured');
      return { success: false, message: 'No child ID configured' };
    }

    try {
      const db = getDatabase();
      const unsyncedSessions = db
        .prepare(
          `SELECT * FROM gaming_sessions 
           WHERE is_synced = 0 AND ended_at IS NOT NULL
           ORDER BY started_at ASC
           LIMIT 50`
        )
        .all() as LocalSession[];

      if (unsyncedSessions.length === 0) {
        logger.debug('No sessions to sync');
        return { success: true, synced: 0 };
      }

      logger.info(`Found ${unsyncedSessions.length} sessions to sync`);

      let successCount = 0;

      for (const session of unsyncedSessions) {
        try {
          await this.syncSession(session);

          // Mark as synced
          db.prepare(
            `UPDATE gaming_sessions 
             SET is_synced = 1, synced_at = datetime('now')
             WHERE id = ?`
          ).run(session.id);

          successCount++;
        } catch (error) {
          logger.error(`Failed to sync session ${session.id}:`, error);
          // Continue with next session
        }
      }

      logger.info(`Successfully synced ${successCount}/${unsyncedSessions.length} sessions`);

      return { success: true, synced: successCount };
    } catch (error) {
      logger.error('Sync failed:', error);
      this.isOnline = false;
      return { success: false, error };
    }
  }

  /**
   * REAL-TIME: Sync an active session immediately when game starts
   * This creates a session in the cloud without an end time
   */
  async syncActiveSession(session: {
    game_name: string;
    game_executable: string;
    category: string;
    started_at: string;
  }): Promise<{ success: boolean; session_id?: string }> {
    if (!this.childId) {
      logger.warn('Cannot sync active session: no child ID configured');
      return { success: false };
    }

    try {
      const payload = {
        action: 'start_session',
        child_id: this.childId,
        game_name: session.game_name,
        category: session.category,
        started_at: session.started_at,
        device_id: this.deviceName,
        // No ended_at - this is an active session
      };

      const response = await this.fetch(API_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (response && (response.success === true || response.session_id)) {
        // Store the cloud session ID for later update
        const db = getDatabase();
        db.prepare(
          `UPDATE gaming_sessions 
           SET cloud_session_id = ?
           WHERE game_name = ? AND started_at = ? AND ended_at IS NULL`
        ).run(response.session_id, session.game_name, session.started_at);

        logger.info(`Active session synced: ${session.game_name} (cloud ID: ${response.session_id})`);
        this.isOnline = true;
        return { success: true, session_id: response.session_id };
      } else {
        logger.error(`Failed to sync active session: ${response?.error || 'Unknown error'}`);
        return { success: false };
      }
    } catch (error) {
      logger.error('Failed to sync active session:', error);
      return { success: false };
    }
  }

  /**
   * REAL-TIME: Complete an active session when game ends
   * This updates the session in the cloud with end time and duration
   */
  async completeActiveSession(session: {
    game_name: string;
    game_executable: string;
    category: string;
    started_at: string;
    ended_at: string;
    duration_minutes: number;
  }): Promise<{ success: boolean }> {
    if (!this.childId) {
      logger.warn('Cannot complete session: no child ID configured');
      return { success: false };
    }

    try {
      const payload = {
        action: 'end_session',
        child_id: this.childId,
        game_name: session.game_name,
        category: session.category,
        started_at: session.started_at,
        ended_at: session.ended_at,
        duration_minutes: session.duration_minutes,
        device_id: this.deviceName,
      };

      const response = await this.fetch(API_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (response && (response.success === true || response.session_id)) {
        logger.info(`Session completed: ${session.game_name} (${session.duration_minutes} min)`);
        this.isOnline = true;
        return { success: true };
      } else {
        logger.error(`Failed to complete session: ${response?.error || 'Unknown error'}`);
        return { success: false };
      }
    } catch (error) {
      logger.error('Failed to complete session:', error);
      return { success: false };
    }
  }


  private async syncSession(session: LocalSession) {
    if (!this.childId) {
      throw new Error('Child ID not configured');
    }

    const payload = {
      child_id: this.childId,
      game_name: session.game_name,
      category: session.category,
      started_at: session.started_at,
      ended_at: session.ended_at,
      // Don't send duration_minutes - it's auto-calculated in the database
      device_id: this.deviceName,
    };

    const response = await this.fetch(API_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    // Edge Function returns { success: true, session_id: ..., game_id: ... } on success
    if (response && (response.success === true || response.session_id)) {
      logger.info(`Session synced: ${session.game_name} (${session.duration_minutes} min)`);
      this.isOnline = true;
      return response;
    } else {
      const errorMsg = response?.error || response?.message || 'Unknown sync error';
      logger.error(`Sync failed for ${session.game_name}:`, errorMsg);
      throw new Error(errorMsg);
    }
  }

  private async fetch(url: string, options: { method: string; body?: string }): Promise<any> {
    return new Promise((resolve, reject) => {
      logger.info(`Fetching: ${options.method} ${url}`);
      if (options.body) {
        logger.debug(`Request body: ${options.body}`);
      }

      const request = net.request({
        method: options.method,
        url: url,
      });

      // Add authorization header with Supabase service role key
      const serviceKey = getServiceRoleKey();
      request.setHeader('Content-Type', 'application/json');
      request.setHeader('Authorization', `Bearer ${serviceKey}`);
      request.setHeader('apikey', serviceKey);

      let responseData = '';

      request.on('response', (response) => {
        logger.info(`Response status: ${response.statusCode}`);

        response.on('data', (chunk) => {
          responseData += chunk.toString();
        });

        response.on('end', () => {
          logger.info(`Response body: ${responseData}`);

          try {
            const json = JSON.parse(responseData);
            if (response.statusCode >= 200 && response.statusCode < 300) {
              resolve(json);
            } else {
              logger.error(`API Error (${response.statusCode}):`, json);
              reject(new Error(json.error || json.message || 'API request failed'));
            }
          } catch (parseError) {
            logger.error('Failed to parse JSON response:', responseData);
            reject(new Error(`Invalid JSON response: ${responseData}`));
          }
        });
      });

      request.on('error', (error) => {
        logger.error('Network error:', error);
        reject(error);
      });

      if (options.body) {
        request.write(options.body);
      }

      request.end();
    });
  }

  private getOrCreateDeviceId(): string {
    const db = getDatabase();
    const result = db
      .prepare("SELECT value FROM settings WHERE key = 'device_id'")
      .get() as { value: string } | undefined;

    if (result?.value) {
      return result.value;
    }

    // Create new device ID
    const deviceId = randomUUID();
    db.prepare("INSERT INTO settings (key, value) VALUES ('device_id', ?)")
      .run(deviceId);

    logger.info(`Created new device ID: ${deviceId}`);
    return deviceId;
  }

  private getOrCreateDeviceName(): string {
    const db = getDatabase();
    const result = db
      .prepare("SELECT value FROM settings WHERE key = 'device_name'")
      .get() as { value: string } | undefined;

    if (result?.value) {
      return result.value;
    }

    // Use hostname or default name
    const os = require('os');
    const deviceName = os.hostname() || 'Desktop';

    db.prepare("INSERT INTO settings (key, value) VALUES ('device_name', ?)")
      .run(deviceName);

    logger.info(`Created device name: ${deviceName}`);
    return deviceName;
  }

  async testConnection(childId?: string): Promise<{ connected: boolean; message?: string }> {
    const testChildId = childId || this.childId;

    if (!testChildId) {
      return { connected: false, message: 'Child ID not set. Please enter a Child ID first.' };
    }

    try {
      // Test connection by sending a heartbeat with the child ID
      const serviceKey = getServiceRoleKey();
      const response = await fetch(`${API_ENDPOINT}?child_id=${encodeURIComponent(testChildId)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' })) as { error?: string; message?: string };
        const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}`;

        if (response.status === 404) {
          return {
            connected: false,
            message: `Child ID not found. Please check the Child ID and ensure it exists in your account. Error: ${errorMessage}`
          };
        }

        return {
          connected: false,
          message: `Connection failed: ${errorMessage}`
        };
      }

      const data = await response.json();
      logger.info('Connection test successful:', data);
      return { connected: true, message: 'Connection successful! Child ID is valid.' };
    } catch (error) {
      logger.error('Connection test failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        connected: false,
        message: `Connection test failed: ${errorMessage}. Check your internet connection and Child ID.`
      };
    }
  }

  getStatus() {
    // Initialize device ID if not done yet
    if (!this.deviceId) {
      try {
        this.initialize();
      } catch (error) {
        logger.error('Failed to initialize device ID:', error);
      }
    }

    // Get sync statistics
    const db = getDatabase();
    const totalSessions = db.prepare('SELECT COUNT(*) as count FROM gaming_sessions WHERE ended_at IS NOT NULL').get() as { count: number } | undefined;
    const syncedSessions = db.prepare('SELECT COUNT(*) as count FROM gaming_sessions WHERE is_synced = 1 AND ended_at IS NOT NULL').get() as { count: number } | undefined;
    const pendingSessions = db.prepare('SELECT COUNT(*) as count FROM gaming_sessions WHERE is_synced = 0 AND ended_at IS NOT NULL').get() as { count: number } | undefined;

    return {
      isOnline: this.isOnline,
      childId: this.childId,
      deviceId: this.deviceId,
      totalSessions: totalSessions?.count || 0,
      syncedSessions: syncedSessions?.count || 0,
      pendingSessions: pendingSessions?.count || 0,
    };
  }
}

export default new SupabaseSyncService();

