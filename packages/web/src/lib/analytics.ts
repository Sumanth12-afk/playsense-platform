import {
  HealthScore,
  BurnoutRisk,
  WeeklyOverview,
  CategoryBreakdown,
  GameDominance,
  LateNightGaming,
  GamingSession,
  GameCategory,
} from '@playsense/shared';
import { HEALTH_SCORE_THRESHOLDS, LATE_NIGHT_HOUR } from '@playsense/shared';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, subDays } from 'date-fns';

// Calculate Healthy Gaming Score
export function calculateHealthScore(sessions: GamingSession[]): HealthScore {
  if (sessions.length === 0) {
    return {
      overall: 100,
      session_length: 'good',
      break_frequency: 'good',
      late_night_usage: 'minimal',
      game_variety: 'good',
    };
  }

  let score = 100;
  const thresholds = HEALTH_SCORE_THRESHOLDS;

  // 1. Session Length (max 25 points deduction)
  const avgSessionLength =
    sessions.reduce((sum, s) => sum + s.duration_minutes, 0) / sessions.length;
  let sessionLengthScore: HealthScore['session_length'] = 'good';

  if (avgSessionLength > thresholds.session_length.watch_max) {
    score -= 25;
    sessionLengthScore = 'needs_attention';
  } else if (avgSessionLength > thresholds.session_length.good_max) {
    score -= 10;
    sessionLengthScore = 'watch';
  }

  // 2. Break Frequency (max 20 points deduction)
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  let totalBreakTime = 0;
  let breakCount = 0;

  for (let i = 1; i < sortedSessions.length; i++) {
    const prevEnd = new Date(sortedSessions[i - 1].end_time).getTime();
    const currentStart = new Date(sortedSessions[i].start_time).getTime();
    const breakMinutes = (currentStart - prevEnd) / 60000;

    if (breakMinutes > 0 && breakMinutes < 240) { // Less than 4 hours
      totalBreakTime += breakMinutes;
      breakCount++;
    }
  }

  const avgBreakTime = breakCount > 0 ? totalBreakTime / breakCount : 60;
  let breakFrequencyScore: HealthScore['break_frequency'] = 'good';

  if (avgBreakTime < thresholds.break_frequency.watch_min) {
    score -= 20;
    breakFrequencyScore = 'needs_attention';
  } else if (avgBreakTime < thresholds.break_frequency.good_min) {
    score -= 10;
    breakFrequencyScore = 'watch';
  }

  // 3. Late Night Usage (max 25 points deduction)
  const lateNightSessions = sessions.filter((s) => s.is_late_night).length;
  let lateNightScore: HealthScore['late_night_usage'] = 'minimal';

  if (lateNightSessions > thresholds.late_night.moderate_max) {
    score -= 25;
    lateNightScore = 'concerning';
  } else if (lateNightSessions > thresholds.late_night.minimal_max) {
    score -= 10;
    lateNightScore = 'moderate';
  }

  // 4. Game Variety (max 20 points deduction)
  const uniqueGames = new Set(sessions.map((s) => s.game_name)).size;
  let gameVarietyScore: HealthScore['game_variety'] = 'good';

  if (uniqueGames < thresholds.game_variety.low_min) {
    score -= 20;
    gameVarietyScore = 'very_low';
  } else if (uniqueGames < thresholds.game_variety.good_min) {
    score -= 10;
    gameVarietyScore = 'low';
  }

  return {
    overall: Math.max(0, Math.min(100, score)),
    session_length: sessionLengthScore,
    break_frequency: breakFrequencyScore,
    late_night_usage: lateNightScore,
    game_variety: gameVarietyScore,
  };
}

// Calculate Burnout Risk
export function calculateBurnoutRisk(sessions: GamingSession[]): BurnoutRisk {
  const factors: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' = 'low';

  if (sessions.length === 0) {
    return {
      level: 'low',
      factors: [],
      explanation: 'No gaming sessions recorded recently.',
    };
  }

  // Check daily hours
  const totalHours = sessions.reduce((sum, s) => sum + s.duration_minutes, 0) / 60;
  const daysCount = 7;
  const avgHoursPerDay = totalHours / daysCount;

  if (avgHoursPerDay > 6) {
    factors.push('Very high daily gaming hours (>6h)');
    riskLevel = 'high';
  } else if (avgHoursPerDay > 4) {
    factors.push('High daily gaming hours (>4h)');
    if (riskLevel === 'low') riskLevel = 'medium';
  }

  // Check session lengths
  const longSessions = sessions.filter((s) => s.duration_minutes > 180).length;
  if (longSessions > 3) {
    factors.push('Multiple marathon sessions (>3h)');
    riskLevel = riskLevel === 'low' ? 'medium' : 'high';
  }

  // Check late night
  const lateNightCount = sessions.filter((s) => s.is_late_night).length;
  if (lateNightCount > 4) {
    factors.push('Frequent late-night gaming');
    riskLevel = riskLevel === 'low' ? 'medium' : 'high';
  }

  // Check game dominance
  const gameDominance = calculateGameDominance(sessions);
  if (gameDominance && gameDominance.percentage > 80) {
    factors.push(`Heavy focus on one game (${gameDominance.game_name})`);
    riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
  }

  const explanations = {
    low: 'Gaming patterns look healthy and balanced.',
    medium: 'Some patterns suggest increased gaming intensity. Consider checking in.',
    high: 'Multiple risk factors present. A conversation might help ensure healthy balance.',
  };

  return {
    level: riskLevel,
    factors,
    explanation: explanations[riskLevel],
  };
}

// Calculate Weekly Overview
export function calculateWeeklyOverview(sessions: GamingSession[]): WeeklyOverview {
  const now = new Date();
  const weekStart = subDays(now, 6);
  const days = eachDayOfInterval({ start: weekStart, end: now });

  const dayActivities = days.map((day) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const daySessions = sessions.filter(
      (s) => s.start_time.startsWith(dayStr)
    );

    const hours = daySessions.reduce((sum, s) => sum + s.duration_minutes, 0) / 60;

    return {
      date: dayStr,
      day_name: format(day, 'EEE'),
      hours: parseFloat(hours.toFixed(1)),
      sessions: daySessions.length,
    };
  });

  const totalHours = dayActivities.reduce((sum, d) => sum + d.hours, 0);
  const avgHoursPerDay = totalHours / 7;

  // Weekday vs Weekend
  const weekdayHours = dayActivities
    .filter((d) => !['Sat', 'Sun'].includes(d.day_name))
    .reduce((sum, d) => sum + d.hours, 0);
  const weekendHours = dayActivities
    .filter((d) => ['Sat', 'Sun'].includes(d.day_name))
    .reduce((sum, d) => sum + d.hours, 0);

  const weekdayAvg = weekdayHours / 5;
  const weekendAvg = weekendHours / 2;

  // Generate insight
  let insight = '';
  if (avgHoursPerDay < 2) {
    insight = 'Light gaming week with good balance.';
  } else if (avgHoursPerDay < 4) {
    insight = 'Moderate gaming activity, well-distributed across the week.';
  } else {
    insight = 'Higher than usual gaming activity this week.';
  }

  if (weekendAvg > weekdayAvg * 1.5) {
    insight += ' More active on weekends.';
  }

  return {
    days: dayActivities,
    average_hours_per_day: parseFloat(avgHoursPerDay.toFixed(1)),
    weekday_avg: parseFloat(weekdayAvg.toFixed(1)),
    weekend_avg: parseFloat(weekendAvg.toFixed(1)),
    insight,
  };
}

// Calculate Category Breakdown
export function calculateCategoryBreakdown(sessions: GamingSession[]): CategoryBreakdown[] {
  const totalMinutes = sessions.reduce((sum, s) => sum + s.duration_minutes, 0);

  if (totalMinutes === 0) return [];

  const categories: Record<GameCategory, number> = {
    competitive: 0,
    creative: 0,
    casual: 0,
    social: 0,
  };

  sessions.forEach((s) => {
    categories[s.category] += s.duration_minutes;
  });

  return Object.entries(categories)
    .map(([category, minutes]) => ({
      category: category as GameCategory,
      hours: parseFloat((minutes / 60).toFixed(1)),
      percentage: parseFloat(((minutes / totalMinutes) * 100).toFixed(1)),
    }))
    .filter((c) => c.hours > 0)
    .sort((a, b) => b.hours - a.hours);
}

// Calculate Game Dominance
export function calculateGameDominance(sessions: GamingSession[]): GameDominance | null {
  if (sessions.length === 0) return null;

  const gameTime: Record<string, number> = {};
  let totalMinutes = 0;

  sessions.forEach((s) => {
    gameTime[s.game_name] = (gameTime[s.game_name] || 0) + s.duration_minutes;
    totalMinutes += s.duration_minutes;
  });

  const topGame = Object.entries(gameTime).sort((a, b) => b[1] - a[1])[0];

  if (!topGame) return null;

  const [gameName, minutes] = topGame;
  const percentage = (minutes / totalMinutes) * 100;

  return {
    game_name: gameName,
    percentage: parseFloat(percentage.toFixed(1)),
    hours: parseFloat((minutes / 60).toFixed(1)),
    total_hours: parseFloat((totalMinutes / 60).toFixed(1)),
  };
}

// Calculate Late Night Gaming
export function calculateLateNightGaming(sessions: GamingSession[]): LateNightGaming {
  const lateNightSessions = sessions.filter((s) => s.is_late_night);
  const totalLateMinutes = lateNightSessions.reduce((sum, s) => sum + s.duration_minutes, 0);

  // Compare with previous week (would need historical data in real implementation)
  const trend: 'improving' | 'stable' | 'worsening' = 'stable';

  let explanation = '';
  if (lateNightSessions.length === 0) {
    explanation = 'No late-night gaming detected this week. Great sleep hygiene!';
  } else if (lateNightSessions.length <= 2) {
    explanation = 'Minimal late-night gaming. Generally good sleep patterns.';
  } else if (lateNightSessions.length <= 4) {
    explanation = 'Moderate late-night activity. Consider discussing bedtime routines.';
  } else {
    explanation = 'Frequent late-night gaming. This may impact sleep quality and daily energy.';
  }

  return {
    sessions_after_10pm: lateNightSessions.length,
    hours_after_10pm: parseFloat((totalLateMinutes / 60).toFixed(1)),
    trend,
    explanation,
  };
}

