// electron/services/supabase-sync.ts
import { getDatabase } from './database';
import { logger } from '../utils/logger';
import { randomUUID } from 'crypto';
import { net } from 'electron';

const API_BASE_URL = 'https://ycwlwaolrzriydhkgrwr.supabase.co/functions/v1';
const API_ENDPOINT = `${API_BASE_URL}/gaming-sessions`;

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
    this.childId = childId;
    logger.info(`Child ID set: ${childId}`);
  }

  getChildId(): string | null {
    return this.childId;
  }

  async start(intervalMs = 60000) {
    logger.info('Starting sync service...');
    
    // Initialize device ID
    this.initialize();
    
    // Initial sync
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

    if (response.success) {
      logger.info(`Session synced: ${session.game_name} (${session.duration_minutes} min)`);
      this.isOnline = true;
    } else {
      throw new Error(response.error || 'Unknown sync error');
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

      request.setHeader('Content-Type', 'application/json');

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

  async testConnection(): Promise<boolean> {
    if (!this.childId) {
      logger.warn('Cannot test connection: no child ID configured');
      return false;
    }

    try {
      await this.sendHeartbeat();
      logger.info('Connection test successful');
      return true;
    } catch (error) {
      logger.error('Connection test failed:', error);
      this.isOnline = false;
      return false;
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
    
    return {
      isOnline: this.isOnline,
      childId: this.childId,
      deviceId: this.deviceId,
    };
  }
}

export default new SupabaseSyncService();

