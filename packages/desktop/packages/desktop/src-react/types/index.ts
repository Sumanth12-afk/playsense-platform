// src/types/index.ts
export interface GameSession {
  id: string;
  game_name: string;
  game_executable: string;
  category: 'competitive' | 'creative' | 'casual' | 'social' | 'unknown';
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  is_synced: boolean;
  synced_at: string | null;
  created_at: string;
}

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

export interface HealthScore {
  score: number;
  status: 'healthy' | 'attention' | 'concern';
}

export interface CurrentSession {
  id: string;
  game_name: string;
  started_at: string;
  category: string;
}

export interface SyncStatus {
  isOnline: boolean;
  childId: string | null;
  deviceId: string;
}

