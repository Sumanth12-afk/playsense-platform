// Shared email utilities for Supabase Edge Functions
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

const sendEmail = async (to: string, subject: string, html: string) => {
    if (!RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY is not set. Add it in Supabase Dashboard → Edge Functions → Secrets.');
    }

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: 'PlaySense <noreply@playsense.co.in>',
            to: [to],
            subject,
            html,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        let errMsg = errorText;
        try {
            const errJson = JSON.parse(errorText);
            if (errJson.message) errMsg = errJson.message;
            if (errJson.name === 'validation_error' && errJson.message?.includes('domain')) {
                errMsg = 'Domain not verified. Resend free tier only delivers to your Resend account email. Verify playsense.co.in at resend.com/domains to send to other addresses.';
            }
        } catch {
            // use errorText as-is
        }
        throw new Error(`Resend: ${errMsg}`);
    }

    return await response.json();
};

export interface DailyReportData {
    parentName: string;
    childName: string;
    totalMinutes: number;
    sessionCount: number;
    topGames: Array<{ name: string; minutes: number; category: string }>;
    healthScore: number;
    date: string;
}

export interface WeeklyDigestData {
    parentName: string;
    childName: string;
    weeklyTotalMinutes: number;
    dailyAverage: number;
    topGames: Array<{ name: string; minutes: number; category: string }>;
    healthScore: number;
    weekStart: string;
    weekEnd: string;
}

export const sendTestEmail = async (to: string, parentName: string) => {
    const data = await sendEmail(to, '✅ PlaySense Email Test Successful', `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎮 PlaySense</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Gaming Insights for Parents</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="color: #667eea; margin-top: 0;">Test Email Successful! ✅</h2>
            <p>Hi ${parentName},</p>
            <p>Great news! Your PlaySense email notifications are working perfectly.</p>
            <p>You'll receive:</p>
            <ul style="color: #666;">
              <li><strong>Daily Summaries</strong> - Overview of gaming activity each day</li>
              <li><strong>Weekly Digests</strong> - Comprehensive weekly insights and trends</li>
            </ul>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #999; font-size: 14px;">
            <p>You're receiving this because you requested a test email from PlaySense.</p>
            <p style="margin: 10px 0;">
              <a href="https://playsense.app" style="color: #667eea; text-decoration: none;">Visit Dashboard</a>
            </p>
          </div>
        </body>
      </html>
    `);

    return data;
};

export const sendDailyReport = async (to: string, data: DailyReportData) => {
    const formatMinutes = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    const getHealthColor = (score: number) => {
        if (score >= 80) return '#10b981';
        if (score >= 60) return '#f59e0b';
        return '#ef4444';
    };

    const emailData = await sendEmail(to, `📊 ${data.childName}'s Gaming Report - ${data.date}`, `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎮 PlaySense</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Daily Gaming Report</p>
          </div>
          
          <div style="background: white; padding: 25px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0;">Hi ${data.parentName} 👋</h2>
            <p>Here's ${data.childName}'s gaming activity for ${data.date}:</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                <div>
                  <p style="margin: 0; color: #666; font-size: 14px;">Total Time</p>
                  <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #667eea;">${formatMinutes(data.totalMinutes)}</p>
                </div>
                <div>
                  <p style="margin: 0; color: #666; font-size: 14px;">Sessions</p>
                  <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #667eea;">${data.sessionCount}</p>
                </div>
                <div>
                  <p style="margin: 0; color: #666; font-size: 14px;">Health Score</p>
                  <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: ${getHealthColor(data.healthScore)};">${data.healthScore}/100</p>
                </div>
              </div>
            </div>
            
            ${data.topGames.length > 0 ? `
              <h3 style="color: #333; margin-top: 25px;">Top Games Played</h3>
              ${data.topGames.map(game => `
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #667eea;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <p style="margin: 0; font-weight: bold; color: #333;">${game.name}</p>
                      <p style="margin: 5px 0 0 0; color: #666; font-size: 14px; text-transform: capitalize;">${game.category}</p>
                    </div>
                    <p style="margin: 0; font-size: 18px; font-weight: bold; color: #667eea;">${formatMinutes(game.minutes)}</p>
                  </div>
                </div>
              `).join('')}
            ` : '<p style="color: #666; text-align: center; padding: 20px;">No gaming activity today</p>'}
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
              <a href="https://playsense.app/dashboard" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">View Full Dashboard</a>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #999; font-size: 14px;">
            <p>You're receiving this daily report from PlaySense.</p>
            <p style="margin: 10px 0;">
              <a href="https://playsense.app/dashboard/settings" style="color: #667eea; text-decoration: none;">Manage Email Preferences</a>
            </p>
          </div>
        </body>
      </html>
    `);

    return emailData;
};

export const sendWeeklyDigest = async (to: string, data: WeeklyDigestData) => {
    const formatMinutes = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    const getHealthColor = (score: number) => {
        if (score >= 80) return '#10b981';
        if (score >= 60) return '#f59e0b';
        return '#ef4444';
    };

    const emailData = await sendEmail(to, `📈 ${data.childName}'s Weekly Gaming Digest`, `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎮 PlaySense</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Weekly Gaming Digest</p>
          </div>
          
          <div style="background: white; padding: 25px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0;">Hi ${data.parentName} 👋</h2>
            <p>Here's ${data.childName}'s gaming summary for ${data.weekStart} - ${data.weekEnd}:</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                <div>
                  <p style="margin: 0; color: #666; font-size: 14px;">Weekly Total</p>
                  <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #667eea;">${formatMinutes(data.weeklyTotalMinutes)}</p>
                </div>
                <div>
                  <p style="margin: 0; color: #666; font-size: 14px;">Daily Average</p>
                  <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #667eea;">${formatMinutes(data.dailyAverage)}</p>
                </div>
                <div>
                  <p style="margin: 0; color: #666; font-size: 14px;">Health Score</p>
                  <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: ${getHealthColor(data.healthScore)};">${data.healthScore}/100</p>
                </div>
              </div>
            </div>
            
            <h3 style="color: #333; margin-top: 25px;">Top Games This Week</h3>
            ${data.topGames.map((game, index) => `
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid ${index === 0 ? '#667eea' : '#cbd5e1'};">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <p style="margin: 0; font-weight: bold; color: #333;">${index + 1}. ${game.name}</p>
                    <p style="margin: 5px 0 0 0; color: #666; font-size: 14px; text-transform: capitalize;">${game.category}</p>
                  </div>
                  <p style="margin: 0; font-size: 18px; font-weight: bold; color: #667eea;">${formatMinutes(game.minutes)}</p>
                </div>
              </div>
            `).join('')}
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
              <a href="https://playsense.app/dashboard" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">View Full Dashboard</a>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #999; font-size: 14px;">
            <p>You're receiving this weekly digest from PlaySense.</p>
            <p style="margin: 10px 0;">
              <a href="https://playsense.app/dashboard/settings" style="color: #667eea; text-decoration: none;">Manage Email Preferences</a>
            </p>
          </div>
        </body>
      </html>
    `);

    return emailData;
};
