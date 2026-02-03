import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface Game {
  id: string;
  name: string;
  category: 'competitive' | 'creative' | 'casual' | 'social';
  icon_url: string | null;
}

export interface GamingSession {
  id: string;
  child_id: string;
  game_id: string;
  started_at: string;
  ended_at: string | null; // Can be null for active sessions
  duration_minutes: number;
  is_active?: boolean; // True if session is currently in progress
  game?: Game;
}

export const useGames = () => {
  return useQuery({
    queryKey: ['games'],
    queryFn: async () => {
      const { data, error } = await supabase.from('games').select('*').order('name');

      if (error) throw error;
      return data as Game[];
    },
  });
};

/**
 * REAL-TIME: Hook to get active (currently playing) sessions
 * These are sessions that have started but not ended yet
 */
export const useActiveSession = (childId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Set up Supabase Realtime subscription for live updates
  useEffect(() => {
    if (!childId) return;

    const channel = supabase
      .channel(`gaming_sessions_${childId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gaming_sessions',
          filter: `child_id=eq.${childId}`,
        },
        (payload) => {
          console.log('Realtime update received:', payload);
          // Invalidate queries to refetch data
          queryClient.invalidateQueries({ queryKey: ['active_session', childId] });
          queryClient.invalidateQueries({ queryKey: ['today_activity', childId] });
          queryClient.invalidateQueries({ queryKey: ['gaming_sessions', childId] });
          queryClient.invalidateQueries({ queryKey: ['weekly_stats', childId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [childId, queryClient]);

  return useQuery({
    queryKey: ['active_session', childId],
    queryFn: async () => {
      if (!childId) {
        return null;
      }

      // Query for sessions without ended_at (active sessions)
      const { data, error } = await supabase
        .from('gaming_sessions')
        .select(
          `
          *,
          game:games(*)
        `
        )
        .eq('child_id', childId)
        .is('ended_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as (GamingSession & { game: Game }) | null;
    },
    enabled: !!user && !!childId,
    refetchInterval: 5000, // Refetch every 5 seconds for active sessions
    refetchOnWindowFocus: true,
  });
};

export const useGamingSessions = (childId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['gaming_sessions', childId],
    queryFn: async () => {
      if (!childId) {
        return [];
      }

      const { data, error } = await supabase
        .from('gaming_sessions')
        .select(
          `
          *,
          game:games(*),
          child:children(*)
        `
        )
        .eq('child_id', childId)
        .order('started_at', { ascending: false });

      if (error) throw error;
      return (data || []) as (GamingSession & { game: Game })[];
    },
    enabled: !!user && !!childId, // Only run when user and childId are available
    refetchInterval: 10000, // Refetch every 10 seconds
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });
};

export const useTodayActivity = (childId?: string) => {
  const { user } = useAuth();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return useQuery({
    queryKey: ['today_activity', childId],
    queryFn: async () => {
      if (!childId) {
        return [];
      }

      const { data, error } = await supabase
        .from('gaming_sessions')
        .select(
          `
          *,
          game:games(*)
        `
        )
        .eq('child_id', childId)
        .gte('started_at', today.toISOString())
        .order('started_at', { ascending: false });

      if (error) throw error;
      return (data || []) as (GamingSession & { game: Game })[];
    },
    enabled: !!user && !!childId, // Only run when user and childId are available
    refetchInterval: 10000, // Refetch every 10 seconds
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });
};

export const useWeeklyStats = (childId?: string) => {
  const { user } = useAuth();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  weekAgo.setHours(0, 0, 0, 0);

  return useQuery({
    queryKey: ['weekly_stats', childId],
    queryFn: async () => {
      if (!childId) {
        // Return empty stats for all days
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days.map((day) => ({ day, hours: 0 }));
      }

      const { data, error } = await supabase
        .from('gaming_sessions')
        .select(
          `
          *,
          game:games(*)
        `
        )
        .eq('child_id', childId)
        .gte('started_at', weekAgo.toISOString())
        .order('started_at', { ascending: true });

      if (error) throw error;

      // Group by day
      const dailyStats: Record<string, number> = {};
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      // Initialize all days
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayName = days[date.getDay()];
        dailyStats[dayName] = 0;
      }

      // Sum up hours
      (data || ([] as GamingSession[])).forEach((session) => {
        const date = new Date(session.started_at);
        const dayName = days[date.getDay()];
        dailyStats[dayName] = (dailyStats[dayName] || 0) + session.duration_minutes / 60;
      });

      return Object.entries(dailyStats).map(([day, hours]) => ({
        day,
        hours: Math.round(hours * 10) / 10,
      }));
    },
    enabled: !!user && !!childId, // Only run when user and childId are available
    refetchInterval: 15000, // Refetch every 15 seconds
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });
};

export const useCategoryBreakdown = (childId?: string) => {
  const { user } = useAuth();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  return useQuery({
    queryKey: ['category_breakdown', childId],
    queryFn: async () => {
      if (!childId) {
        // Return empty breakdown
        return [
          { category: 'competitive', percentage: 0, hours: 0 },
          { category: 'creative', percentage: 0, hours: 0 },
          { category: 'casual', percentage: 0, hours: 0 },
          { category: 'social', percentage: 0, hours: 0 },
        ];
      }

      const { data, error } = await supabase
        .from('gaming_sessions')
        .select(
          `
          duration_minutes,
          game:games(category)
        `
        )
        .eq('child_id', childId)
        .gte('started_at', weekAgo.toISOString());

      if (error) throw error;

      const breakdown: Record<string, number> = {
        competitive: 0,
        creative: 0,
        casual: 0,
        social: 0,
      };

      (data || []).forEach((session: any) => {
        if (session.game?.category) {
          breakdown[session.game.category] += session.duration_minutes;
        }
      });

      const total = Object.values(breakdown).reduce((a, b) => a + b, 0) || 1;

      return Object.entries(breakdown).map(([category, minutes]) => ({
        category,
        percentage: Math.round((minutes / total) * 100),
        hours: Math.round((minutes / 60) * 10) / 10,
      }));
    },
    enabled: !!user && !!childId, // Only run when user and childId are available
    refetchInterval: 15000, // Refetch every 15 seconds
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });
};

export const useLateNightSessions = (childId?: string) => {
  const { user } = useAuth();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  return useQuery({
    queryKey: ['late_night_sessions', childId],
    queryFn: async () => {
      if (!childId) {
        return {
          count: 0,
          totalHours: 0,
          sessions: [],
        };
      }

      const { data, error } = await supabase
        .from('gaming_sessions')
        .select(
          `
          *,
          game:games(*)
        `
        )
        .eq('child_id', childId)
        .gte('started_at', weekAgo.toISOString());

      if (error) throw error;

      // Filter for sessions that ended after 10 PM or started after 10 PM
      const lateNight = ((data || []) as (GamingSession & { game: Game })[]).filter((session) => {
        // Skip active sessions (no ended_at)
        if (!session.ended_at) return false;
        const endHour = new Date(session.ended_at).getHours();
        const startHour = new Date(session.started_at).getHours();
        return endHour >= 22 || startHour >= 22 || endHour < 6;
      });

      const totalLateMinutes = lateNight.reduce((sum, s) => sum + s.duration_minutes, 0);

      return {
        count: lateNight.length,
        totalHours: Math.round((totalLateMinutes / 60) * 10) / 10,
        sessions: lateNight,
      };
    },
    enabled: !!user && !!childId, // Only run when user and childId are available
    refetchInterval: 15000, // Refetch every 15 seconds
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });
};

export const useGameDominance = (childId?: string) => {
  const { user } = useAuth();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  return useQuery({
    queryKey: ['game_dominance', childId],
    queryFn: async () => {
      if (!childId) {
        return {
          topGame: null,
          percentage: 0,
          isDominant: false,
          allGames: [],
        };
      }

      const { data, error } = await supabase
        .from('gaming_sessions')
        .select(
          `
          duration_minutes,
          game:games(id, name)
        `
        )
        .eq('child_id', childId)
        .gte('started_at', weekAgo.toISOString());

      if (error) throw error;

      const gameTime: Record<string, { name: string; minutes: number }> = {};

      (data || []).forEach((session: any) => {
        if (session.game) {
          if (!gameTime[session.game.id]) {
            gameTime[session.game.id] = { name: session.game.name, minutes: 0 };
          }
          gameTime[session.game.id].minutes += session.duration_minutes;
        }
      });

      const total = Object.values(gameTime).reduce((sum, g) => sum + g.minutes, 0) || 1;
      const sorted = Object.values(gameTime).sort((a, b) => b.minutes - a.minutes);
      const topGame = sorted[0];

      return {
        topGame: topGame?.name || null,
        percentage: topGame ? Math.round((topGame.minutes / total) * 100) : 0,
        isDominant: topGame ? topGame.minutes / total >= 0.7 : false,
        allGames: sorted.map((g) => ({
          name: g.name,
          hours: Math.round((g.minutes / 60) * 10) / 10,
          percentage: Math.round((g.minutes / total) * 100),
        })),
      };
    },
    enabled: !!user && !!childId, // Only run when user and childId are available
    refetchInterval: 15000, // Refetch every 15 seconds
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });
};
