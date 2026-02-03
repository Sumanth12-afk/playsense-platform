import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface SessionWithNote {
  id: string;
  game_name: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number;
  parent_note: string | null;
  note_added_at: string | null;
}

export const useSessionsWithNotes = (childId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['sessions_with_notes', childId],
    queryFn: async () => {
      if (!childId) return [];

      // Try the RPC function first
      try {
        const { data, error } = await supabase.rpc('get_sessions_with_notes', {
          p_child_id: childId,
          p_limit: 20,
        });

        if (!error && data) {
          return data as SessionWithNote[];
        }
      } catch (e) {
        console.log('RPC not available, falling back to direct query');
      }

      // Fallback to direct query
      const { data, error } = await supabase
        .from('gaming_sessions')
        .select(`
          id,
          started_at,
          ended_at,
          duration_minutes,
          parent_note,
          note_added_at,
          game:games(name)
        `)
        .eq('child_id', childId)
        .not('parent_note', 'is', null)
        .order('note_added_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching sessions with notes:', error);
        return [];
      }

      return (data || []).map((s: any) => ({
        id: s.id,
        game_name: s.game?.name || 'Unknown Game',
        started_at: s.started_at,
        ended_at: s.ended_at,
        duration_minutes: s.duration_minutes,
        parent_note: s.parent_note,
        note_added_at: s.note_added_at,
      })) as SessionWithNote[];
    },
    enabled: !!user && !!childId,
  });
};

export const useAddSessionNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, note }: { sessionId: string; note: string }) => {
      // Try the RPC function first
      try {
        const { data, error } = await supabase.rpc('add_session_note', {
          p_session_id: sessionId,
          p_note: note,
        });

        if (!error) {
          return true;
        }
      } catch (e) {
        console.log('RPC not available, falling back to direct update');
      }

      // Fallback to direct update
      const { error } = await supabase
        .from('gaming_sessions')
        .update({
          parent_note: note,
          note_added_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (error) {
        throw error;
      }

      return true;
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['sessions_with_notes'] });
      queryClient.invalidateQueries({ queryKey: ['today_activity'] });
      queryClient.invalidateQueries({ queryKey: ['gaming_sessions'] });
    },
  });
};

export const useDeleteSessionNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('gaming_sessions')
        .update({
          parent_note: null,
          note_added_at: null,
        })
        .eq('id', sessionId);

      if (error) {
        throw error;
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions_with_notes'] });
      queryClient.invalidateQueries({ queryKey: ['today_activity'] });
      queryClient.invalidateQueries({ queryKey: ['gaming_sessions'] });
    },
  });
};
