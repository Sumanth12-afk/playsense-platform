import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface ConversationTip {
  id: string;
  title: string;
  do_text: string;
  dont_text: string;
  context: string | null;
  is_active: boolean | null;
}

export const useConversationTips = () => {
  return useQuery({
    queryKey: ['conversation-tips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversation_tips')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ConversationTip[];
    },
  });
};

// Transform database tips to the format expected by ConversationGuidanceCard
export const transformTipsForCard = (tips: ConversationTip[] | undefined) => {
  if (!tips || tips.length === 0) {
    return [];
  }

  return tips.map((tip) => ({
    topic: tip.title,
    whatToSay: tip.do_text,
    whatNotToSay: tip.dont_text,
    context: tip.context || '',
  }));
};
