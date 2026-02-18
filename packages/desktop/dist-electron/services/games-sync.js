"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// electron/services/games-sync.ts
const electron_1 = require("electron");
const database_1 = require("./database");
const logger_1 = require("../utils/logger");
class GamesSyncService {
    constructor() {
        this.apiUrl = process.env.GAMES_DB_URL || process.env.SUPABASE_URL || 'https://ycwlwaolrzriydhkgrwr.supabase.co';
        this.apiKey = process.env.GAMES_DB_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
        this.syncInterval = null;
    }
    /**
     * Fetch games list from Supabase and update local database
     */
    async syncGames() {
        try {
            logger_1.logger.info('Fetching games list from Supabase...');
            return new Promise((resolve) => {
                const request = electron_1.net.request({
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
                                const games = JSON.parse(responseData);
                                logger_1.logger.info(`Received ${games.length} games from Supabase`);
                                // Update local database
                                const db = (0, database_1.getDatabase)();
                                const upsert = db.prepare(`
                  INSERT OR REPLACE INTO known_games (id, name, executables, category, icon_url)
                  VALUES (?, ?, ?, ?, ?)
                `);
                                let updatedCount = 0;
                                for (const game of games) {
                                    try {
                                        // Supabase has process_name (single); local schema uses executables (array)
                                        const executables = [game.process_name || ''];
                                        upsert.run(game.id, game.name, JSON.stringify(executables), game.category, game.icon_url || null);
                                        updatedCount++;
                                    }
                                    catch (error) {
                                        logger_1.logger.error(`Failed to insert game ${game.name}:`, error);
                                    }
                                }
                                logger_1.logger.info(`Successfully synced ${updatedCount} games to local database`);
                                resolve({ success: true, count: updatedCount });
                            }
                            else {
                                logger_1.logger.error(`Failed to fetch games: HTTP ${response.statusCode}`);
                                logger_1.logger.error(`Response: ${responseData}`);
                                resolve({ success: false, count: 0, message: `HTTP ${response.statusCode}` });
                            }
                        }
                        catch (error) {
                            logger_1.logger.error('Error parsing games response:', error);
                            resolve({ success: false, count: 0, message: 'Parse error' });
                        }
                    });
                });
                request.on('error', (error) => {
                    logger_1.logger.error('Network error fetching games:', error);
                    resolve({ success: false, count: 0, message: error.message });
                });
                request.end();
            });
        }
        catch (error) {
            logger_1.logger.error('Error in syncGames:', error);
            return { success: false, count: 0, message: String(error) };
        }
    }
    /**
     * Start automatic games sync (runs periodically)
     */
    start(intervalMs = 3600000) {
        logger_1.logger.info(`Starting games sync service (interval: ${intervalMs}ms)`);
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
            logger_1.logger.info('Games sync service stopped');
        }
    }
    /**
     * Get all games from local database
     */
    getLocalGames() {
        try {
            const db = (0, database_1.getDatabase)();
            const games = db.prepare('SELECT * FROM known_games').all();
            return games.map(game => ({
                ...game,
                executables: JSON.parse(game.executables),
            }));
        }
        catch (error) {
            logger_1.logger.error('Error getting local games:', error);
            return [];
        }
    }
}
exports.default = new GamesSyncService();
