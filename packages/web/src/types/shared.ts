// Local type definitions (mirrors @playsense/shared for build independence)

export interface Child {
  id: string;
  user_id: string;
  name: string;
  age_range: string;
  created_at: string;
  updated_at: string;
}

export type GameCategory = 'competitive' | 'creative' | 'casual' | 'social';

export interface GamingSession {
  id: string;
  device_id: string;
  child_id: string;
  game_id: string;
  game_name: string;
  category: GameCategory;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  is_late_night: boolean;
  created_at: string;
}

export interface HealthScore {
  overall: number;
  session_length: 'good' | 'watch' | 'needs_attention';
  break_frequency: 'good' | 'watch' | 'needs_attention';
  late_night_usage: 'minimal' | 'moderate' | 'concerning';
  game_variety: 'good' | 'low' | 'very_low';
}

export interface BurnoutRisk {
  level: 'low' | 'medium' | 'high';
  factors: string[];
  explanation: string;
}

export interface GameDominance {
  game_name: string;
  percentage: number;
  hours: number;
  total_hours: number;
}

export interface WeeklyOverview {
  days: DayActivity[];
  average_hours_per_day: number;
  weekday_avg: number;
  weekend_avg: number;
  insight: string;
}

export interface DayActivity {
  date: string;
  day_name: string;
  hours: number;
  sessions: number;
}

export interface CategoryBreakdown {
  category: GameCategory;
  hours: number;
  percentage: number;
}

export interface LateNightGaming {
  sessions_after_10pm: number;
  hours_after_10pm: number;
  trend: 'improving' | 'stable' | 'worsening';
  explanation: string;
}

// Constants
export const LATE_NIGHT_HOUR = 22; // 10 PM

export const HEALTH_SCORE_THRESHOLDS = {
  session_length: {
    good_max: 120,
    watch_max: 180,
  },
  break_frequency: {
    good_min: 30,
    watch_min: 15,
  },
  late_night: {
    minimal_max: 2,
    moderate_max: 5,
  },
  game_variety: {
    good_min: 3,
    low_min: 2,
  },
  dominance: {
    watch_threshold: 0.7,
    alert_threshold: 0.85,
  },
};
