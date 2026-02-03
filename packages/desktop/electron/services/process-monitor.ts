// electron/services/process-monitor.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import { getDatabase } from './database';
import { logger } from '../utils/logger';

const execAsync = promisify(exec);

export interface RunningGame {
  name: string;
  executable: string;
  category: string;
  pid: number;
  startedAt: Date;
}

interface KnownGame {
  id: string;
  name: string;
  executables: string;
  category: string;
}

class ProcessMonitor {
  private activeGames: Map<number, RunningGame> = new Map();
  private pollInterval: NodeJS.Timeout | null = null;
  private onGameStart: (game: RunningGame) => void;
  private onGameEnd: (game: RunningGame) => void;
  private knownGames: KnownGame[] = [];

  constructor(callbacks: {
    onGameStart: (game: RunningGame) => void;
    onGameEnd: (game: RunningGame) => void;
  }) {
    this.onGameStart = callbacks.onGameStart;
    this.onGameEnd = callbacks.onGameEnd;
    this.loadKnownGames();
  }

  private loadKnownGames() {
    try {
      const db = getDatabase();
      this.knownGames = db.prepare('SELECT * FROM known_games').all() as KnownGame[];
      logger.info(`Loaded ${this.knownGames.length} known games`);
    } catch (error) {
      logger.error('Failed to load known games:', error);
    }
  }

  /**
   * Reload games list from database (call this after syncing games)
   */
  reloadGames() {
    this.loadKnownGames();
  }

  async start(intervalMs = 5000) {
    logger.info('Starting process monitor...');
    await this.poll();
    this.pollInterval = setInterval(() => this.poll(), intervalMs);
  }

  stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
      logger.info('Process monitor stopped');
    }
  }

  private async poll() {
    try {
      const processes = await this.getRunningProcesses();
      const currentPids = new Set<number>();

      for (const proc of processes) {
        const game = this.matchGame(proc.name);
        if (game) {
          currentPids.add(proc.pid);
          if (!this.activeGames.has(proc.pid)) {
            const runningGame: RunningGame = {
              name: game.name,
              executable: proc.name,
              category: game.category,
              pid: proc.pid,
              startedAt: new Date(),
            };
            this.activeGames.set(proc.pid, runningGame);
            this.onGameStart(runningGame);
            logger.info(`Game started: ${game.name} (PID: ${proc.pid})`);
          }
        }
      }

      // Check for ended games
      for (const [pid, game] of this.activeGames) {
        if (!currentPids.has(pid)) {
          this.activeGames.delete(pid);
          this.onGameEnd(game);
          logger.info(`Game ended: ${game.name} (PID: ${pid})`);
        }
      }
    } catch (error) {
      logger.error('Error polling processes:', error);
    }
  }

  private async getRunningProcesses(): Promise<{ name: string; pid: number }[]> {
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
      } else if (platform === 'darwin') {
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
      } else if (platform === 'linux') {
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
    } catch (error) {
      logger.error('Error getting running processes:', error);
    }

    return [];
  }

  private matchGame(processName: string): KnownGame | null {
    const lowerName = processName.toLowerCase();
    return (
      this.knownGames.find((game) => {
        try {
          const executables = JSON.parse(game.executables) as string[];
          return executables.some((exe) =>
            lowerName.includes(exe.toLowerCase())
          );
        } catch {
          return false;
        }
      }) || null
    );
  }

  getActiveGames(): RunningGame[] {
    return Array.from(this.activeGames.values());
  }
}

export default ProcessMonitor;

