// src/hooks/useStats.ts
import { useState, useEffect } from 'react';
import {
  DailyStats,
  WeeklyStats,
  GameStats,
  HealthScore,
  CurrentSession,
} from '@/types';

export function useStats() {
  const [todayStats, setTodayStats] = useState<DailyStats | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [gameStats, setGameStats] = useState<GameStats[]>([]);
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  const [currentSession, setCurrentSession] = useState<CurrentSession | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [today, weekly, games, health, session] = await Promise.all([
        window.electronAPI.getTodayStats(),
        window.electronAPI.getWeeklyStats(),
        window.electronAPI.getGameStats(),
        window.electronAPI.getHealthScore(),
        window.electronAPI.getCurrentSession(),
      ]);

      setTodayStats(today);
      setWeeklyStats(weekly);
      setGameStats(games);
      setHealthScore(health as HealthScore);
      setCurrentSession(session);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();

    // Refresh stats every 30 seconds
    const interval = setInterval(loadStats, 30000);

    // Listen for game events
    window.electronAPI.onGameStarted((game) => {
      console.log('Game started:', game);
      loadStats();
    });

    window.electronAPI.onGameEnded((game) => {
      console.log('Game ended:', game);
      loadStats();
    });

    return () => {
      clearInterval(interval);
      window.electronAPI.removeAllListeners('game-started');
      window.electronAPI.removeAllListeners('game-ended');
    };
  }, []);

  return {
    todayStats,
    weeklyStats,
    gameStats,
    healthScore,
    currentSession,
    loading,
    refresh: loadStats,
  };
}

