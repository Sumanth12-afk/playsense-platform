import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'health' | 'variety' | 'balance' | 'social' | 'milestone';
  points: number;
  earned_at: string | null;
  times_earned: number;
  current_progress: number;
  requirement_value: number;
  is_earned: boolean;
}

export const useAchievements = (childId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['achievements', childId],
    queryFn: async () => {
      if (!childId) return [];

      const { data, error } = await supabase.rpc('get_child_achievements', {
        p_child_id: childId,
      });

      if (error) {
        console.error('Error fetching achievements:', error);
        // Return fallback empty achievements if function doesn't exist
        return [];
      }

      return (data || []) as Achievement[];
    },
    enabled: !!user && !!childId,
    refetchInterval: 60000, // Refetch every minute
  });
};

export const useCheckAchievements = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (childId: string) => {
      const { data, error } = await supabase.rpc('check_achievements', {
        p_child_id: childId,
      });

      if (error) {
        console.error('Error checking achievements:', error);
        throw error;
      }

      return data as { achievement_name: string; newly_earned: boolean }[];
    },
    onSuccess: (_, childId) => {
      // Invalidate achievements query to refetch
      queryClient.invalidateQueries({ queryKey: ['achievements', childId] });
    },
  });
};

// Helper to group achievements by category
export const groupAchievementsByCategory = (achievements: Achievement[]) => {
  return achievements.reduce(
    (acc, achievement) => {
      if (!acc[achievement.category]) {
        acc[achievement.category] = [];
      }
      acc[achievement.category].push(achievement);
      return acc;
    },
    {} as Record<string, Achievement[]>
  );
};

// Helper to calculate total points earned
export const calculateTotalPoints = (achievements: Achievement[]) => {
  return achievements
    .filter((a) => a.is_earned)
    .reduce((sum, a) => sum + a.points * a.times_earned, 0);
};

// Helper to get achievement progress percentage
export const getProgressPercentage = (achievement: Achievement) => {
  if (achievement.is_earned) return 100;
  if (achievement.requirement_value === 0) return 0;
  return Math.min(
    100,
    Math.round((achievement.current_progress / achievement.requirement_value) * 100)
  );
};
