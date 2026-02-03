import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Reward {
    id: string;
    parent_id: string;
    reward_name: string;
    reward_type: 'extra_time' | 'new_game' | 'special_privilege' | 'custom';
    description: string;
    points_required: number;
    icon: string;
    is_active: boolean;
    created_at: string;
}

export interface PointsTransaction {
    id: string;
    child_id: string;
    points_change: number;
    reason: string;
    reference_id?: string;
    created_at: string;
}

export interface Redemption {
    id: string;
    child_id: string;
    reward_id: string;
    points_spent: number;
    status: 'pending' | 'approved' | 'denied' | 'completed';
    requested_at: string;
    reviewed_at?: string;
    reviewed_by?: string;
    parent_notes?: string;
    completed_at?: string;
    reward?: Reward;
}

// Get all available rewards
export const useRewards = () => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['rewards', user?.uid],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('rewards')
                .select('*')
                .eq('parent_id', user?.uid)
                .eq('is_active', true)
                .order('points_required', { ascending: true });

            if (error) throw error;
            return data as Reward[];
        },
        enabled: !!user,
    });
};

// Get points balance for a child
export const usePointsBalance = (childId?: string) => {
    return useQuery({
        queryKey: ['points_balance', childId],
        queryFn: async () => {
            if (!childId) return 0;

            const { data, error } = await supabase.rpc('get_points_balance', {
                p_child_id: childId,
            });

            if (error) throw error;
            return data as number;
        },
        enabled: !!childId,
    });
};

// Get points transaction history
export const usePointsHistory = (childId?: string) => {
    return useQuery({
        queryKey: ['points_history', childId],
        queryFn: async () => {
            if (!childId) return [];

            const { data, error } = await supabase
                .from('reward_points')
                .select('*')
                .eq('child_id', childId)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            return data as PointsTransaction[];
        },
        enabled: !!childId,
    });
};

// Get redemption history
export const useRedemptions = (childId?: string, status?: string) => {
    return useQuery({
        queryKey: ['redemptions', childId, status],
        queryFn: async () => {
            if (!childId) return [];

            let query = supabase
                .from('reward_redemptions')
                .select('*, reward:rewards(*)')
                .eq('child_id', childId);

            if (status) {
                query = query.eq('status', status);
            }

            const { data, error } = await query.order('requested_at', { ascending: false });

            if (error) throw error;
            return data as Redemption[];
        },
        enabled: !!childId,
    });
};

// Get pending redemptions (for parent approval)
export const usePendingRedemptions = () => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['pending_redemptions', user?.uid],
        queryFn: async () => {
            if (!user) return [];

            // Get all children for this parent
            const { data: children, error: childrenError } = await supabase
                .from('children')
                .select('id')
                .eq('parent_id', user.uid);

            if (childrenError) throw childrenError;

            const childIds = children?.map(c => c.id) || [];

            if (childIds.length === 0) return [];

            const { data, error } = await supabase
                .from('reward_redemptions')
                .select('*, reward:rewards(*), child:children(name)')
                .in('child_id', childIds)
                .eq('status', 'pending')
                .order('requested_at', { ascending: false });

            if (error) throw error;
            return data as (Redemption & { child: { name: string } })[];
        },
        enabled: !!user,
    });
};

// Redeem a reward
export const useRedeemReward = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ childId, rewardId }: { childId: string; rewardId: string }) => {
            const { data, error } = await supabase.rpc('redeem_reward', {
                p_child_id: childId,
                p_reward_id: rewardId,
            });

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['points_balance', variables.childId] });
            queryClient.invalidateQueries({ queryKey: ['redemptions', variables.childId] });
            queryClient.invalidateQueries({ queryKey: ['pending_redemptions'] });
            toast.success('Reward requested! Waiting for parent approval.');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to redeem reward');
        },
    });
};

// Approve/deny redemption (parent only)
export const useReviewRedemption = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async ({
            redemptionId,
            approved,
            notes,
        }: {
            redemptionId: string;
            approved: boolean;
            notes?: string;
        }) => {
            // Get redemption details first
            const { data: redemption, error: fetchError } = await supabase
                .from('reward_redemptions')
                .select('*, child:children(id)')
                .eq('id', redemptionId)
                .single();

            if (fetchError) throw fetchError;

            // Update redemption status
            const { error: updateError } = await supabase
                .from('reward_redemptions')
                .update({
                    status: approved ? 'approved' : 'denied',
                    reviewed_at: new Date().toISOString(),
                    reviewed_by: user?.uid,
                    parent_notes: notes,
                })
                .eq('id', redemptionId);

            if (updateError) throw updateError;

            // If denied, refund the points
            if (!approved && redemption) {
                await supabase.rpc('award_points', {
                    p_child_id: redemption.child_id,
                    p_points: redemption.points_spent,
                    p_reason: 'redemption_refund',
                    p_reference_id: redemptionId,
                });
            }

            return redemption;
        },
        onSuccess: (redemption, variables) => {
            queryClient.invalidateQueries({ queryKey: ['pending_redemptions'] });
            queryClient.invalidateQueries({ queryKey: ['redemptions'] });
            queryClient.invalidateQueries({ queryKey: ['points_balance', redemption?.child_id] });
            toast.success(variables.approved ? 'Reward approved!' : 'Reward denied and points refunded');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to review redemption');
        },
    });
};

// Award bonus points (parent only)
export const useAwardBonusPoints = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            childId,
            points,
            reason,
        }: {
            childId: string;
            points: number;
            reason: string;
        }) => {
            const { data, error } = await supabase.rpc('award_points', {
                p_child_id: childId,
                p_points: points,
                p_reason: reason,
            });

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['points_balance', variables.childId] });
            queryClient.invalidateQueries({ queryKey: ['points_history', variables.childId] });
            toast.success(`Awarded ${variables.points} points!`);
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to award points');
        },
    });
};

// Create a new reward (parent only)
export const useCreateReward = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async ({
            rewardName,
            rewardType,
            description,
            pointsRequired,
            icon,
        }: {
            rewardName: string;
            rewardType: 'extra_time' | 'new_game' | 'special_privilege' | 'custom';
            description: string;
            pointsRequired: number;
            icon: string;
        }) => {
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('rewards')
                .insert({
                    parent_id: user.uid,
                    reward_name: rewardName,
                    reward_type: rewardType,
                    description: description,
                    points_required: pointsRequired,
                    icon: icon,
                    is_active: true,
                })
                .select()
                .single();

            if (error) throw error;
            return data as Reward;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rewards', user?.uid] });
            toast.success('Reward created successfully!');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to create reward');
        },
    });
};

// Delete a reward (parent only)
export const useDeleteReward = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async (rewardId: string) => {
            const { error } = await supabase
                .from('rewards')
                .update({ is_active: false })
                .eq('id', rewardId)
                .eq('parent_id', user?.uid);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rewards', user?.uid] });
            toast.success('Reward deleted');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete reward');
        },
    });
};

// Seed default rewards for new users
export const useSeedDefaultRewards = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async () => {
            if (!user) throw new Error('Not authenticated');

            const defaultRewards = [
                {
                    parent_id: user.uid,
                    reward_name: '30 Minutes Extra Screen Time',
                    reward_type: 'extra_time' as const,
                    description: 'Earn 30 extra minutes of gaming or screen time',
                    points_required: 100,
                    icon: '⏰',
                    is_active: true,
                },
                {
                    parent_id: user.uid,
                    reward_name: '1 Hour Extra Screen Time',
                    reward_type: 'extra_time' as const,
                    description: 'Earn 1 extra hour of gaming or screen time',
                    points_required: 200,
                    icon: '🕐',
                    is_active: true,
                },
                {
                    parent_id: user.uid,
                    reward_name: 'Stay Up 30 Min Late',
                    reward_type: 'special_privilege' as const,
                    description: 'Get to stay up 30 minutes past bedtime',
                    points_required: 150,
                    icon: '🌙',
                    is_active: true,
                },
                {
                    parent_id: user.uid,
                    reward_name: 'Pick Dinner',
                    reward_type: 'special_privilege' as const,
                    description: 'Choose what the family has for dinner',
                    points_required: 250,
                    icon: '🍕',
                    is_active: true,
                },
                {
                    parent_id: user.uid,
                    reward_name: 'Movie Night Pick',
                    reward_type: 'special_privilege' as const,
                    description: 'Choose the movie for family movie night',
                    points_required: 200,
                    icon: '🎬',
                    is_active: true,
                },
                {
                    parent_id: user.uid,
                    reward_name: 'New Game (under $10)',
                    reward_type: 'new_game' as const,
                    description: 'Get a new game under $10',
                    points_required: 500,
                    icon: '🎮',
                    is_active: true,
                },
                {
                    parent_id: user.uid,
                    reward_name: 'New Game (under $20)',
                    reward_type: 'new_game' as const,
                    description: 'Get a new game under $20',
                    points_required: 1000,
                    icon: '🎯',
                    is_active: true,
                },
            ];

            const { data, error } = await supabase
                .from('rewards')
                .insert(defaultRewards)
                .select();

            if (error) throw error;
            return data as Reward[];
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rewards', user?.uid] });
            toast.success('Default rewards added! You can customize them anytime.');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to add default rewards');
        },
    });
};
