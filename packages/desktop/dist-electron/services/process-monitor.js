"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// electron/services/process-monitor.ts
const child_process_1 = require("child_process");
const util_1 = require("util");
const database_1 = require("./database");
const logger_1 = require("../utils/logger");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class ProcessMonitor {
    constructor(callbacks) {
        this.activeGames = new Map();
        this.pollInterval = null;
        this.knownGames = [];
        this.onGameStart = callbacks.onGameStart;
        this.onGameEnd = callbacks.onGameEnd;
        this.loadKnownGames();
    }
    loadKnownGames() {
        try {
            const db = (0, database_1.getDatabase)();
            this.knownGames = db.prepare('SELECT * FROM known_games').all();
            logger_1.logger.info(`Loaded ${this.knownGames.length} known games`);
        }
        catch (error) {
            logger_1.logger.error('Failed to load known games:', error);
        }
    }
    /**
     * Reload games list from database (call this after syncing games)
     */
    reloadGames() {
        this.loadKnownGames();
    }
    async start(intervalMs = 5000) {
        logger_1.logger.info('Starting process monitor...');
        await this.poll();
        this.pollInterval = setInterval(() => this.poll(), intervalMs);
    }
    stop() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
            logger_1.logger.info('Process monitor stopped');
        }
    }
    async poll() {
        try {
            const processes = await this.getRunningProcesses();
            const currentPids = new Set();
            for (const proc of processes) {
                const game = this.matchGame(proc.name);
                if (game) {
                    currentPids.add(proc.pid);
                    if (!this.activeGames.has(proc.pid)) {
                        const runningGame = {
                            name: game.name,
                            executable: proc.name,
                            category: game.category,
                            pid: proc.pid,
                            startedAt: new Date(),
                        };
                        this.activeGames.set(proc.pid, runningGame);
                        this.onGameStart(runningGame);
                        logger_1.logger.info(`Game started: ${game.name} (PID: ${proc.pid})`);
                    }
                }
            }
            // Check for ended games
            for (const [pid, game] of this.activeGames) {
                if (!currentPids.has(pid)) {
                    this.activeGames.delete(pid);
                    this.onGameEnd(game);
                    logger_1.logger.info(`Game ended: ${game.name} (PID: ${pid})`);
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Error polling processes:', error);
        }
    }
    async getRunningProcesses() {
        const platform = process.platform;
        try {
            if (platform === 'win32') {
                const { stdout } = await execAsync('tasklist /FO CSV /NH');
                return stdout
                    .split('\n')
                    .filter((line) => line.trim())
                    .map((line) => {
                    const parts = line.split('","');
                    return {
                        name: parts[0]?.replace(/"/g, '') || '',
                        pid: parseInt(parts[1]?.replace(/"/g, '') || '0'),
                    };
                })
                    .filter((proc) => proc.name && proc.pid > 0);
            }
            else if (platform === 'darwin') {
                const { stdout } = await execAsync('ps -eo comm,pid');
                return stdout
                    .split('\n')
                    .slice(1)
                    .filter((line) => line.trim())
                    .map((line) => {
                    const parts = line.trim().split(/\s+/);
                    const pid = parseInt(parts.pop() || '0');
                    const name = parts.join(' ');
                    return { name, pid };
                })
                    .filter((proc) => proc.name && proc.pid > 0);
            }
            else if (platform === 'linux') {
                const { stdout } = await execAsync('ps -eo comm,pid');
                return stdout
                    .split('\n')
                    .slice(1)
                    .filter((line) => line.trim())
                    .map((line) => {
                    const parts = line.trim().split(/\s+/);
                    const pid = parseInt(parts[1] || '0');
                    const name = parts[0] || '';
                    return { name, pid };
                })
                    .filter((proc) => proc.name && proc.pid > 0);
            }
        }
        catch (error) {
            logger_1.logger.error('Error getting running processes:', error);
        }
        return [];
    }
    matchGame(processName) {
        const lowerName = processName.toLowerCase();
        return (this.knownGames.find((game) => {
            try {
                const executables = JSON.parse(game.executables);
                return executables.some((exe) => lowerName.includes(exe.toLowerCase()));
            }
            catch {
                return false;
            }
        }) || null);
    }
    getActiveGames() {
        return Array.from(this.activeGames.values());
    }
}
exports.default = ProcessMonitor;
