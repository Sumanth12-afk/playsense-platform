import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface AgeGroupStats {
  age_range: string;
  avg_weekly_minutes: number;
  avg_daily_minutes: number;
  avg_health_score: number;
  avg_session_count: number;
  avg_sessions_per_day: number;
  top_categories: string[];
  total_children: number;
}

export interface ChildComparison {
  child_weekly_minutes: number;
  child_daily_minutes: number;
  child_health_score: number;
  child_session_count: number;
  avg_weekly_minutes: number;
  avg_daily_minutes: number;
  avg_health_score: number;
  avg_session_count: number;
  percentile_time: number; // 0-100
  percentile_health: number; // 0-100
  comparison_insights: string[];
}

// Get age group statistics
export const useAgeGroupStats = (ageRange?: string) => {
  return useQuery({
    queryKey: ['age_group_stats', ageRange],
    queryFn: async () => {
      let query = supabase.from('age_group_stats').select('*');

      if (ageRange) {
        query = query.eq('age_range', ageRange);
      }

      const { data, error } = await query;

      if (error) throw error;
      return ageRange ? (data?.[0] as AgeGroupStats) : (data as AgeGroupStats[]);
    },
    enabled: true,
  });
};

// Get child comparison with age group
export const useChildComparison = (childId?: string) => {
  return useQuery({
    queryKey: ['child_comparison', childId],
    queryFn: async () => {
      if (!childId) return null;

      // Get child info
      const { data: child, error: childError } = await supabase
        .from('children')
        .select('age_range')
        .eq('id', childId)
        .single();

      if (childError) throw childError;

      // Get child's gaming stats (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: sessions, error: sessionsError } = await supabase
        .from('gaming_sessions')
        .select('duration_minutes, started_at')
        .eq('child_id', childId)
        .gte('started_at', sevenDaysAgo.toISOString());

      if (sessionsError) throw sessionsError;

      // Calculate child's stats
      const totalMinutes = sessions?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0;
      const sessionCount = sessions?.length || 0;
      const dailyMinutes = Math.round(totalMinutes / 7);

      // Calculate simple health score
      const avgSessionLength = sessionCount > 0 ? totalMinutes / sessionCount : 0;
      let healthScore = 100;
      if (totalMinutes > 1260) healthScore -= 20;
      if (totalMinutes > 840) healthScore -= 10;
      if (avgSessionLength > 120) healthScore -= 15;
      if (avgSessionLength > 90) healthScore -= 10;
      if (sessionCount > 20) healthScore -= 10;
      healthScore = Math.max(0, Math.min(100, healthScore));

      // Get age group stats
      const { data: ageGroupData, error: ageGroupError } = await supabase
        .from('age_group_stats')
        .select('*')
        .eq('age_range', child.age_range)
        .single();

      if (ageGroupError) throw ageGroupError;

      // Calculate percentiles (simplified)
      const percentileTime = totalMinutes < ageGroupData.avg_weekly_minutes ? 40 : 60;
      const percentileHealth = healthScore > ageGroupData.avg_health_score ? 60 : 40;

      // Generate insights
      const insights: string[] = [];

      if (totalMinutes < ageGroupData.avg_weekly_minutes) {
        insights.push(
          `Your child plays ${Math.round((1 - totalMinutes / ageGroupData.avg_weekly_minutes) * 100)}% less than average for their age group`
        );
      } else {
        insights.push(
          `Your child plays ${Math.round((totalMinutes / ageGroupData.avg_weekly_minutes - 1) * 100)}% more than average for their age group`
        );
      }

      if (healthScore > ageGroupData.avg_health_score) {
        insights.push('Health score is above average - great balance!');
      } else {
        insights.push('Health score is below average - consider more balanced gaming');
      }

      if (sessionCount < ageGroupData.avg_session_count) {
        insights.push('Fewer but longer gaming sessions than average');
      }

      const comparison: ChildComparison = {
        child_weekly_minutes: totalMinutes,
        child_daily_minutes: dailyMinutes,
        child_health_score: Math.round(healthScore),
        child_session_count: sessionCount,
        avg_weekly_minutes: ageGroupData.avg_weekly_minutes,
        avg_daily_minutes: ageGroupData.avg_daily_minutes,
        avg_health_score: ageGroupData.avg_health_score,
        avg_session_count: ageGroupData.avg_session_count,
        percentile_time: percentileTime,
        percentile_health: percentileHealth,
        comparison_insights: insights,
      };

      return comparison;
    },
    enabled: !!childId,
  });
};
