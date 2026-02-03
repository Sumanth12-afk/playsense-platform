import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  try {
    const { childId, period } = await req.json();

    if (!childId) {
      return new Response(JSON.stringify({ error: 'childId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get child info
    const { data: child } = await supabase
      .from('children')
      .select('*')
      .eq('id', childId)
      .single();

    if (!child) {
      return new Response(JSON.stringify({ error: 'Child not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Determine date range
    let daysAgo = 7;
    if (period === 'month') daysAgo = 30;
    if (period === 'today') daysAgo = 0;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Get sessions
    const { data: sessions } = await supabase
      .from('gaming_sessions')
      .select('*')
      .eq('child_id', childId)
      .gte('start_time', startDate.toISOString())
      .order('start_time', { ascending: false });

    // Calculate stats
    const totalMinutes = sessions?.reduce((sum, s) => sum + s.duration_minutes, 0) || 0;
    const totalHours = (totalMinutes / 60).toFixed(1);
    const sessionCount = sessions?.length || 0;
    const uniqueGames = new Set(sessions?.map(s => s.game_name) || []).size;
    const lateNightSessions = sessions?.filter(s => s.is_late_night).length || 0;

    // In production, use a PDF generation library
    // For now, return structured data that could be used with jsPDF on the client
    const reportData = {
      child: {
        name: child.name,
        age_range: child.age_range,
      },
      period,
      summary: {
        totalHours,
        sessionCount,
        uniqueGames,
        lateNightSessions,
      },
      sessions: sessions || [],
      generatedAt: new Date().toISOString(),
    };

    return new Response(JSON.stringify(reportData), {
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

