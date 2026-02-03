import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendDailyReport, DailyReportData } from '../_shared/email.ts';

serve(async (req) => {
    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Get all users with daily emails enabled
        const { data: preferences, error: prefsError } = await supabaseClient
            .from('email_preferences')
            .select('*')
            .eq('daily_enabled', true);

        if (prefsError) throw prefsError;

        console.log(`Found ${preferences?.length || 0} users with daily emails enabled`);

        const results = [];

        for (const pref of preferences || []) {
            try {
                // Get user's children
                const { data: children } = await supabaseClient
                    .from('children')
                    .select('*')
                    .eq('parent_id', pref.user_id);

                if (!children || children.length === 0) continue;

                // For each child, get today's gaming data
                for (const child of children) {
                    const today = new Date().toISOString().split('T')[0];

                    // Get today's sessions
                    const { data: sessions } = await supabaseClient
                        .from('gaming_sessions')
                        .select('*, game:games(*)')
                        .eq('child_id', child.id)
                        .gte('started_at', `${today}T00:00:00`)
                        .lte('started_at', `${today}T23:59:59`);

                    if (!sessions || sessions.length === 0) continue;

                    // Calculate stats
                    const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

                    // Group by game
                    const gameStats = sessions.reduce((acc: any, session: any) => {
                        const gameName = session.game?.name || 'Unknown';
                        const category = session.game?.category || 'casual';
                        if (!acc[gameName]) {
                            acc[gameName] = { name: gameName, minutes: 0, category };
                        }
                        acc[gameName].minutes += session.duration_minutes || 0;
                        return acc;
                    }, {});

                    const topGames = Object.values(gameStats)
                        .sort((a: any, b: any) => b.minutes - a.minutes)
                        .slice(0, 5);

                    // Calculate simple health score
                    const avgSessionLength = totalMinutes / sessions.length;
                    let healthScore = 100;
                    if (totalMinutes > 180) healthScore -= 20; // More than 3 hours
                    if (avgSessionLength > 90) healthScore -= 15; // Long sessions
                    if (sessions.length > 10) healthScore -= 10; // Too many sessions
                    healthScore = Math.max(0, Math.min(100, healthScore));

                    const reportData: DailyReportData = {
                        parentName: pref.email.split('@')[0],
                        childName: child.name,
                        totalMinutes,
                        sessionCount: sessions.length,
                        topGames: topGames as any,
                        healthScore: Math.round(healthScore),
                        date: new Date().toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        }),
                    };

                    await sendDailyReport(pref.email, reportData);
                    results.push({ email: pref.email, child: child.name, success: true });
                    console.log(`Sent daily report to ${pref.email} for ${child.name}`);
                }
            } catch (error) {
                console.error(`Error processing user ${pref.email}:`, error);
                results.push({ email: pref.email, success: false, error: error.message });
            }
        }

        return new Response(
            JSON.stringify({ success: true, results }),
            {
                headers: { 'Content-Type': 'application/json' },
                status: 200,
            }
        );
    } catch (error) {
        console.error('Error in daily report function:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { 'Content-Type': 'application/json' },
                status: 500,
            }
        );
    }
});
