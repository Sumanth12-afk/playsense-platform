import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  try {
    const { childId } = await req.json();

    if (!childId) {
      return new Response(JSON.stringify({ error: 'childId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get last 7 days of sessions
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: sessions } = await supabase
      .from('gaming_sessions')
      .select('*')
      .eq('child_id', childId)
      .gte('start_time', sevenDaysAgo.toISOString());

    if (!sessions || sessions.length === 0) {
      return new Response(
        JSON.stringify({
          overall: 100,
          session_length: 'good',
          break_frequency: 'good',
          late_night_usage: 'minimal',
          game_variety: 'good',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Calculate health score (simplified version)
    let score = 100;

    // Session length check
    const avgSessionLength =
      sessions.reduce((sum, s) => sum + s.duration_minutes, 0) / sessions.length;
    if (avgSessionLength > 180) score -= 25;
    else if (avgSessionLength > 120) score -= 10;

    // Late night check
    const lateNightCount = sessions.filter(s => s.is_late_night).length;
    if (lateNightCount > 5) score -= 25;
    else if (lateNightCount > 2) score -= 10;

    // Game variety check
    const uniqueGames = new Set(sessions.map(s => s.game_name)).size;
    if (uniqueGames < 2) score -= 20;
    else if (uniqueGames < 3) score -= 10;

    const healthScore = {
      overall: Math.max(0, Math.min(100, score)),
      session_length: avgSessionLength > 180 ? 'needs_attention' : avgSessionLength > 120 ? 'watch' : 'good',
      break_frequency: 'good', // Would need more complex calculation
      late_night_usage: lateNightCount > 5 ? 'concerning' : lateNightCount > 2 ? 'moderate' : 'minimal',
      game_variety: uniqueGames < 2 ? 'very_low' : uniqueGames < 3 ? 'low' : 'good',
    };

    return new Response(JSON.stringify(healthScore), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

