// Database Types
export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Child {
  id: string;
  user_id: string;
  name: string;
  age_range: string;
  created_at: string;
  updated_at: string;
}

export interface Device {
  id: string;
  child_id: string;
  name: string;
  os: string;
  last_sync: string;
  status: 'connected' | 'offline';
  created_at: string;
}

export interface Game {
  id: string;
  name: string;
  category: GameCategory;
  process_name: string;
  created_at: string;
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

export interface EmailPreferences {
  id: string;
  user_id: string;
  daily_summary: boolean;
  daily_summary_time: string;
  weekly_digest: boolean;
  alerts_enabled: boolean;
  timezone: string;
}

export interface Notification {
  id: string;
  user_id: string;
  child_id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export type NotificationType = 'burnout_risk' | 'late_night' | 'game_dominance' | 'positive_trend';

// Analytics Types
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

export interface TodayActivity {
  game_name: string;
  duration_minutes: number;
  category: GameCategory;
  start_time: string;
}

export interface LateNightGaming {
  sessions_after_10pm: number;
  hours_after_10pm: number;
  trend: 'improving' | 'stable' | 'worsening';
  explanation: string;
}

export interface ConversationStarter {
  context: 'starting' | 'time_limits' | 'late_night' | 'one_game_focus';
  try_saying: string;
  avoid_saying: string;
}

// Desktop App Types
export interface SyncPayload {
  device_id: string;
  child_id: string;
  sessions: GamingSession[];
  timestamp: string;
}

export interface TamperEvent {
  id: string;
  device_id: string;
  event_type: 'task_kill_attempt' | 'uninstall_attempt' | 'file_tampering';
  timestamp: string;
  details: string;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface DashboardData {
  child: Child;
  device: Device;
  health_score: HealthScore;
  today_activity: TodayActivity[];
  weekly_overview: WeeklyOverview;
  category_breakdown: CategoryBreakdown[];
  game_dominance: GameDominance | null;
  late_night_gaming: LateNightGaming;
  burnout_risk: BurnoutRisk;
}

