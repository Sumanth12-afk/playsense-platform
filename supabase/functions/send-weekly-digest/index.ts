import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendWeeklyDigest, WeeklyDigestData } from '../_shared/email.ts';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to get current week key (YYYY-WW format)
function getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
}

// Helper to check if it's the right time to send based on user's timezone
function isTimeToSend(timezone: string, sendDay: number, sendTime: string): boolean {
    try {
        // Get current time in user's timezone
        const now = new Date();
        const userTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
        
        const currentDay = userTime.getDay(); // 0 = Sunday
        const currentHour = userTime.getHours();
        const currentMinute = userTime.getMinutes();
        
        const [sendHour, sendMinute] = sendTime.split(':').map(Number);
        
        // Check if it's the right day and within the send window (within 1 hour)
        if (currentDay !== sendDay) return false;
        
        const currentMinutes = currentHour * 60 + currentMinute;
        const targetMinutes = sendHour * 60 + sendMinute;
        
        // Send if within 60-minute window after the target time
        return currentMinutes >= targetMinutes && currentMinutes < targetMinutes + 60;
    } catch (e) {
        console.error(`Error checking timezone ${timezone}:`, e);
        // Default to UTC check
        return true;
    }
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Check for force flag and optional testEmail (for manual testing / demo digest)
        let forceSend = false;
        let testEmail: string | undefined;
        try {
            const body = await req.json();
            forceSend = body?.force === true;
            testEmail = typeof body?.testEmail === 'string' ? body.testEmail : undefined;
        } catch {
            // No body or invalid JSON, continue without force
        }

        // Get all users with weekly emails enabled
        const { data: preferences, error: prefsError } = await supabaseClient
            .from('email_preferences')
            .select('*')
            .eq('weekly_enabled', true);

        if (prefsError) throw prefsError;

        console.log(`Found ${preferences?.length || 0} users with weekly emails enabled`);

        const results = [];
        const weekKey = getWeekKey(new Date());

        for (const pref of preferences || []) {
            try {
                // Check if it's the right time to send for this user (unless forced)
                const sendDay = pref.weekly_send_day ?? 0; // Default: Sunday
                const sendTime = pref.weekly_send_time ?? '09:00'; // Default: 9 AM
                const timezone = pref.timezone ?? 'UTC';
                
                if (!forceSend && !isTimeToSend(timezone, sendDay, sendTime)) {
                    console.log(`Skipping ${pref.email}: not yet time to send (${timezone}, day ${sendDay}, ${sendTime})`);
                    continue;
                }

                // Get user's children
                const { data: children } = await supabaseClient
                    .from('children')
                    .select('*')
                    .eq('parent_id', pref.user_id);

                if (!children || children.length === 0) continue;

                // For each child, get this week's gaming data
                for (const child of children) {
                    // Check if we already sent this week's digest for this child
                    const { data: existingLog } = await supabaseClient
                        .from('email_send_log')
                        .select('id')
                        .eq('user_id', pref.user_id)
                        .eq('child_id', child.id)
                        .eq('email_type', 'weekly')
                        .eq('week_key', weekKey)
                        .maybeSingle();

                    if (existingLog && !forceSend) {
                        console.log(`Skipping ${pref.email}/${child.name}: already sent for week ${weekKey}`);
                        continue;
                    }

                    const now = new Date();
                    const weekStart = new Date(now);
                    weekStart.setDate(now.getDate() - now.getDay()); // Sunday
                    weekStart.setHours(0, 0, 0, 0);

                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6); // Saturday
                    weekEnd.setHours(23, 59, 59, 999);

                    // Get this week's sessions
                    const { data: sessions } = await supabaseClient
                        .from('gaming_sessions')
                        .select('*, game:games(*)')
                        .eq('child_id', child.id)
                        .gte('started_at', weekStart.toISOString())
                        .lte('started_at', weekEnd.toISOString());

                    if (!sessions || sessions.length === 0) {
                        console.log(`Skipping ${pref.email}/${child.name}: no gaming sessions this week`);
                        continue;
                    }

                    // Calculate stats
                    const weeklyTotalMinutes = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
                    const dailyAverage = Math.round(weeklyTotalMinutes / 7);

                    // Group by game
                    const gameStats = sessions.reduce((acc: any, session: any) => {
                        const gameName = session.game?.name || session.game_name || 'Unknown';
                        const category = session.game?.category || session.category || 'casual';
                        if (!acc[gameName]) {
                            acc[gameName] = { name: gameName, minutes: 0, category };
                        }
                        acc[gameName].minutes += session.duration_minutes || 0;
                        return acc;
                    }, {});

                    const topGames = Object.values(gameStats)
                        .sort((a: any, b: any) => b.minutes - a.minutes)
                        .slice(0, 5);

                    // Calculate health score
                    const avgSessionLength = weeklyTotalMinutes / sessions.length;
                    let healthScore = 100;
                    if (weeklyTotalMinutes > 1260) healthScore -= 20; // More than 21 hours/week
                    if (avgSessionLength > 90) healthScore -= 15; // Long sessions
                    if (dailyAverage > 180) healthScore -= 15; // More than 3 hours/day average
                    healthScore = Math.max(0, Math.min(100, healthScore));

                    const digestData: WeeklyDigestData = {
                        parentName: pref.email.split('@')[0],
                        childName: child.name,
                        weeklyTotalMinutes,
                        dailyAverage,
                        topGames: topGames as any,
                        healthScore: Math.round(healthScore),
                        weekStart: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        weekEnd: weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    };

                    await sendWeeklyDigest(pref.email, digestData);

                    // Log the send to prevent duplicates
                    await supabaseClient
                        .from('email_send_log')
                        .insert({
                            user_id: pref.user_id,
                            child_id: child.id,
                            email_type: 'weekly',
                            week_key: weekKey,
                        });

                    results.push({ email: pref.email, child: child.name, success: true });
                    console.log(`Sent weekly digest to ${pref.email} for ${child.name}`);
                }
            } catch (error) {
                console.error(`Error processing user ${pref.email}:`, error);
                results.push({ email: pref.email, success: false, error: error.message });
            }
        }

        let emailsSent = results.filter((r: any) => r.success).length;

        // When force + testEmail and no real digest was sent, send a demo digest so user can see the format
        if (forceSend && testEmail && emailsSent === 0) {
            const now = new Date();
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            weekStart.setHours(0, 0, 0, 0);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);
            const demoData: WeeklyDigestData = {
                parentName: testEmail.split('@')[0],
                childName: 'Your Child',
                weeklyTotalMinutes: 0,
                dailyAverage: 0,
                topGames: [],
                healthScore: 100,
                weekStart: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                weekEnd: weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            };
            await sendWeeklyDigest(testEmail, demoData);
            results.push({ email: testEmail, child: 'demo', success: true });
            emailsSent = 1;
        }

        const message = emailsSent === 0
            ? 'No digest was sent. Turn on Weekly Digest in Settings, save preferences, and ensure your child has gaming sessions this week.'
            : undefined;

        return new Response(
            JSON.stringify({ 
                success: true, 
                results,
                emailsSent,
                message,
                weekKey,
                timestamp: new Date().toISOString(),
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        );
    } catch (error) {
        console.error('Error in weekly digest function:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            }
        );
    }
});
