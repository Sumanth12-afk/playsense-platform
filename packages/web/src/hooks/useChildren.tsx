import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface Child {
  id: string;
  parent_id: string;
  name: string;
  age_range: string;
  device_name: string | null;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useChildren = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['children', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];

      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', user.uid)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Child[];
    },
    enabled: !!user,
  });
};

export const useAddChild = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (child: { name: string; age_range: string; device_name?: string }) => {
      if (!user?.uid) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('children')
        .insert({
          ...child,
          parent_id: user.uid,
        })
        .select()
        .single();

      if (error) throw error;

      // Award 50 welcome bonus points to the new child
      try {
        await supabase.rpc('award_points', {
          p_child_id: data.id,
          p_points: 50,
          p_reason: 'welcome_bonus',
          p_reference_id: null,
        });
      } catch (pointsError) {
        console.error('Failed to award welcome points:', pointsError);
        // Don't throw - child was created successfully
      }

      return data;
    },
    onSuccess: (data) => {
      // Invalidate the children query with the correct key
      queryClient.invalidateQueries({ queryKey: ['children'] });
      // Also invalidate points balance
      queryClient.invalidateQueries({ queryKey: ['points_balance'] });
      // Also set the new child in the cache immediately
      queryClient.setQueryData(['children', user?.uid], (old: Child[] | undefined) => {
        return old ? [...old, data] : [data];
      });
    },
  });
};

export const useUpdateChild = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      name?: string;
      age_range?: string;
      device_name?: string;
    }) => {
      const { data, error } = await supabase
        .from('children')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
    },
  });
};

export const useDeleteChild = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('children').delete().eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
    },
  });
};
