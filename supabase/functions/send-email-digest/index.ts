import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get users with email preferences enabled
    const { data: preferences } = await supabase
      .from('email_preferences')
      .select('*, users(email)')
      .eq('weekly_digest', true);

    if (!preferences) {
      return new Response(JSON.stringify({ message: 'No users to email' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const results = [];

    for (const pref of preferences) {
      const { data: children } = await supabase
        .from('children')
        .select('id, name')
        .eq('user_id', pref.user_id);

      if (!children || children.length === 0) continue;

      for (const child of children) {
        // Get last 7 days of sessions
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: sessions } = await supabase
          .from('gaming_sessions')
          .select('*')
          .eq('child_id', child.id)
          .gte('start_time', sevenDaysAgo.toISOString());

        if (!sessions || sessions.length === 0) continue;

        // Calculate summary stats
        const totalHours = sessions.reduce((sum, s) => sum + s.duration_minutes, 0) / 60;
        const lateNightSessions = sessions.filter(s => s.is_late_night).length;
        const uniqueGames = new Set(sessions.map(s => s.game_name)).size;

        // Generate email (in production, use a proper email service like SendGrid/Resend)
        const emailContent = generateWeeklyEmail(
          child.name,
          totalHours.toFixed(1),
          sessions.length,
          uniqueGames,
          lateNightSessions
        );

        // Here you would send the email using your email service
        // await sendEmail(pref.users.email, 'PlaySense Weekly Digest', emailContent);

        results.push({
          email: pref.users.email,
          child: child.name,
          status: 'generated',
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Email digests generated',
        count: results.length,
        results,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

function generateWeeklyEmail(
  childName: string,
  totalHours: string,
  sessionCount: number,
  uniqueGames: number,
  lateNightCount: number
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4f46e5; color: white; padding: 20px; border-radius: 8px; }
    .stat { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 10px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>PlaySense Weekly Digest</h1>
    <p>Here's how ${childName}'s gaming looked this week</p>
  </div>

  <div class="stat">
    <h3>Total Gaming Time</h3>
    <p style="font-size: 32px; margin: 0; color: #4f46e5;">${totalHours}h</p>
  </div>

  <div class="stat">
    <h3>Sessions</h3>
    <p>${sessionCount} gaming sessions recorded</p>
  </div>

  <div class="stat">
    <h3>Games Played</h3>
    <p>${uniqueGames} different games</p>
  </div>

  ${lateNightCount > 0 ? `
  <div class="stat" style="background: #fef3c7;">
    <h3>⚠ Late Night Gaming</h3>
    <p>${lateNightCount} session(s) after 10 PM</p>
  </div>
  ` : ''}

  <p style="margin-top: 20px;">
    <a href="https://playsense.app/dashboard" style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
      View Full Dashboard
    </a>
  </p>

  <div class="footer">
    <p>PlaySense - Insight, not intrusion</p>
    <p>We never record keystrokes, screenshots, or chats</p>
  </div>
</body>
</html>
  `;
}

