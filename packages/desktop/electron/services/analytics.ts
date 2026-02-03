// electron/services/analytics.ts
import { getDatabase } from './database';

export interface DailyStats {
  date: string;
  totalMinutes: number;
  sessionCount: number;
  gamesByCategory: Record<string, number>;
}

export interface WeeklyStats {
  totalMinutes: number;
  dailyAverage: number;
  mostPlayedGame: string | null;
  categoriesBreakdown: Record<string, number>;
}

export interface GameStats {
  name: string;
  category: string;
  totalMinutes: number;
  sessionCount: number;
  lastPlayed: string;
}

export function getTodayStats(): DailyStats {
  const db = getDatabase();
  
  // Get start of today in local timezone
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStart = today.toISOString();
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStart = tomorrow.toISOString();

  console.log('Querying sessions from', todayStart, 'to', tomorrowStart);

  // Get both completed and active sessions
  const sessions = db
    .prepare(
      `SELECT game_name, category, duration_minutes, started_at, ended_at
       FROM gaming_sessions 
       WHERE started_at >= ? AND started_at < ?`
    )
    .all(todayStart, tomorrowStart) as { 
      game_name: string; 
      category: string; 
      duration_minutes: number | null;
      started_at: string;
      ended_at: string | null;
    }[];

  console.log('Found sessions:', sessions.length, sessions);

  let totalMinutes = 0;
  const gamesByCategory: Record<string, number> = {};

  sessions.forEach((s) => {
    // Calculate duration: use stored duration if ended, otherwise calculate from start time
    let minutes = 0;
    if (s.ended_at && s.duration_minutes !== null) {
      minutes = s.duration_minutes;
    } else if (!s.ended_at) {
      // Active session - calculate current duration
      const startTime = new Date(s.started_at).getTime();
      const currentTime = Date.now();
      minutes = Math.floor((currentTime - startTime) / 60000);
    }

    totalMinutes += minutes;
    gamesByCategory[s.category] = (gamesByCategory[s.category] || 0) + minutes;
  });

  console.log('Total minutes:', totalMinutes);

  return {
    date: today.toISOString().split('T')[0],
    totalMinutes,
    sessionCount: sessions.length,
    gamesByCategory,
  };
}

export function getWeeklyStats(): WeeklyStats {
  const db = getDatabase();
  
  // Get 7 days ago
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  weekAgo.setHours(0, 0, 0, 0);

  // Get both completed and active sessions
  const sessions = db
    .prepare(
      `SELECT game_name, category, duration_minutes, started_at, ended_at
       FROM gaming_sessions 
       WHERE started_at >= ?`
    )
    .all(weekAgo.toISOString()) as { 
      game_name: string; 
      category: string; 
      duration_minutes: number | null;
      started_at: string;
      ended_at: string | null;
    }[];

  let totalMinutes = 0;
  const gameCounts: Record<string, number> = {};
  const categoriesBreakdown: Record<string, number> = {};

  sessions.forEach((s) => {
    // Calculate duration: use stored duration if ended, otherwise calculate from start time
    let minutes = 0;
    if (s.ended_at && s.duration_minutes !== null) {
      minutes = s.duration_minutes;
    } else if (!s.ended_at) {
      // Active session - calculate current duration
      const startTime = new Date(s.started_at).getTime();
      const currentTime = Date.now();
      minutes = Math.floor((currentTime - startTime) / 60000);
    }

    totalMinutes += minutes;
    gameCounts[s.game_name] = (gameCounts[s.game_name] || 0) + minutes;
    categoriesBreakdown[s.category] = (categoriesBreakdown[s.category] || 0) + minutes;
  });

  const dailyAverage = Math.round(totalMinutes / 7);
  const mostPlayedGame = Object.entries(gameCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  return {
    totalMinutes,
    dailyAverage,
    mostPlayedGame,
    categoriesBreakdown,
  };
}

export function getGameStats(): GameStats[] {
  const db = getDatabase();

  // Get stats for completed sessions
  const completedStats = db
    .prepare(
      `SELECT 
        game_name as name,
        category,
        SUM(duration_minutes) as totalMinutes,
        COUNT(*) as sessionCount,
        MAX(started_at) as lastPlayed
       FROM gaming_sessions
       WHERE ended_at IS NOT NULL
       GROUP BY game_name, category`
    )
    .all() as GameStats[];

  // Get active sessions
  const activeSessions = db
    .prepare(
      `SELECT game_name, category, started_at
       FROM gaming_sessions
       WHERE ended_at IS NULL`
    )
    .all() as { game_name: string; category: string; started_at: string }[];

  // Add active session durations to stats
  const statsMap = new Map<string, GameStats>();
  
  completedStats.forEach(stat => {
    statsMap.set(stat.name, stat);
  });

  activeSessions.forEach(session => {
    const startTime = new Date(session.started_at).getTime();
    const currentTime = Date.now();
    const minutes = Math.floor((currentTime - startTime) / 60000);

    if (statsMap.has(session.game_name)) {
      const stat = statsMap.get(session.game_name)!;
      stat.totalMinutes += minutes;
      stat.sessionCount += 1;
      stat.lastPlayed = session.started_at;
    } else {
      statsMap.set(session.game_name, {
        name: session.game_name,
        category: session.category,
        totalMinutes: minutes,
        sessionCount: 1,
        lastPlayed: session.started_at,
      });
    }
  });

  // Convert back to array and sort by total minutes
  return Array.from(statsMap.values())
    .sort((a, b) => b.totalMinutes - a.totalMinutes)
    .slice(0, 20);
}

export function getHealthScore(): { score: number; status: 'healthy' | 'attention' | 'concern' } {
  const weeklyStats = getWeeklyStats();
  const dailyAverage = weeklyStats.dailyAverage;

  // Calculate score based on daily average
  // Healthy: < 2 hours/day
  // Attention: 2-4 hours/day
  // Concern: > 4 hours/day

  let score = 100;
  let status: 'healthy' | 'attention' | 'concern' = 'healthy';

  if (dailyAverage > 240) {
    // Over 4 hours
    score = Math.max(30, 100 - (dailyAverage - 240) / 2);
    status = 'concern';
  } else if (dailyAverage > 120) {
    // Over 2 hours
    score = Math.max(60, 100 - (dailyAverage - 120) / 1.5);
    status = 'attention';
  } else {
    score = Math.min(100, 95 - dailyAverage / 5);
    status = 'healthy';
  }

  return {
    score: Math.round(score),
    status,
  };
}

export function getCurrentSession() {
  const db = getDatabase();
  
  const session = db
    .prepare(
      `SELECT * FROM gaming_sessions 
       WHERE ended_at IS NULL 
       ORDER BY started_at DESC 
       LIMIT 1`
    )
    .get() as { id: string; game_name: string; started_at: string; category: string } | undefined;

  return session;
}

