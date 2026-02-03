// electron/services/games-sync.ts
import { net } from 'electron';
import { getDatabase } from './database';
import { logger } from '../utils/logger';

interface SupabaseGame {
  id: string;
  name: string;
  executables: string[];
  category: 'competitive' | 'creative' | 'casual' | 'social' | 'unknown';
  icon_url?: string;
}

class GamesSyncService {
  private readonly apiUrl = process.env.GAMES_DB_URL || process.env.SUPABASE_URL || 'https://ycwlwaolrzriydhkgrwr.supabase.co';
  private readonly apiKey = process.env.GAMES_DB_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  private syncInterval: NodeJS.Timeout | null = null;

  /**
   * Fetch games list from Supabase and update local database
   */
  async syncGames(): Promise<{ success: boolean; count: number; message?: string }> {
    try {
      logger.info('Fetching games list from Supabase...');

      return new Promise((resolve) => {
        const request = net.request({
          method: 'GET',
          url: `${this.apiUrl}/rest/v1/games?select=id,name,executables,category,icon_url`,
        });

        request.setHeader('apikey', this.apiKey);
        request.setHeader('Authorization', `Bearer ${this.apiKey}`);
        request.setHeader('Content-Type', 'application/json');

        let responseData = '';

        request.on('response', (response) => {
          response.on('data', (chunk) => {
            responseData += chunk.toString();
          });

          response.on('end', () => {
            try {
              if (response.statusCode === 200) {
                const games: SupabaseGame[] = JSON.parse(responseData);
                logger.info(`Received ${games.length} games from Supabase`);

                // Update local database
                const db = getDatabase();
                const upsert = db.prepare(`
                  INSERT OR REPLACE INTO known_games (id, name, executables, category, icon_url)
                  VALUES (?, ?, ?, ?, ?)
                `);

                let updatedCount = 0;
                for (const game of games) {
                  try {
                    // Ensure executables is an array
                    const executables = Array.isArray(game.executables)
                      ? game.executables
                      : JSON.parse(game.executables as any);

                    upsert.run(
                      game.id,
                      game.name,
                      JSON.stringify(executables),
                      game.category,
                      game.icon_url || null
                    );
                    updatedCount++;
                  } catch (error) {
                    logger.error(`Failed to insert game ${game.name}:`, error);
                  }
                }

                logger.info(`Successfully synced ${updatedCount} games to local database`);
                resolve({ success: true, count: updatedCount });
              } else {
                logger.error(`Failed to fetch games: HTTP ${response.statusCode}`);
                logger.error(`Response: ${responseData}`);
                resolve({ success: false, count: 0, message: `HTTP ${response.statusCode}` });
              }
            } catch (error) {
              logger.error('Error parsing games response:', error);
              resolve({ success: false, count: 0, message: 'Parse error' });
            }
          });
        });

        request.on('error', (error) => {
          logger.error('Network error fetching games:', error);
          resolve({ success: false, count: 0, message: error.message });
        });

        request.end();
      });
    } catch (error) {
      logger.error('Error in syncGames:', error);
      return { success: false, count: 0, message: String(error) };
    }
  }

  /**
   * Start automatic games sync (runs periodically)
   */
  start(intervalMs: number = 3600000) { // Default: 1 hour
    logger.info(`Starting games sync service (interval: ${intervalMs}ms)`);
    
    // Sync immediately on start
    this.syncGames();

    // Then sync periodically
    this.syncInterval = setInterval(() => {
      this.syncGames();
    }, intervalMs);
  }

  /**
   * Stop automatic sync
   */
  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      logger.info('Games sync service stopped');
    }
  }

  /**
   * Get all games from local database
   */
  getLocalGames(): Array<{
    id: string;
    name: string;
    executables: string[];
    category: string;
    icon_url: string | null;
  }> {
    try {
      const db = getDatabase();
      const games = db.prepare('SELECT * FROM known_games').all() as Array<{
        id: string;
        name: string;
        executables: string;
        category: string;
        icon_url: string | null;
      }>;

      return games.map(game => ({
        ...game,
        executables: JSON.parse(game.executables),
      }));
    } catch (error) {
      logger.error('Error getting local games:', error);
      return [];
    }
  }
}

export default new GamesSyncService();

