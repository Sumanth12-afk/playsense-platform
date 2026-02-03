import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { sendTestEmail } from '../_shared/email.ts';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { email, parentName } = await req.json();

        if (!email) {
            throw new Error('Email is required');
        }

        console.log(`Sending test email to ${email}`);

        await sendTestEmail(email, parentName || email.split('@')[0]);

        return new Response(
            JSON.stringify({ success: true, message: 'Test email sent successfully' }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        );
    } catch (error: any) {
        console.error('Error sending test email:', error);

        // Extract Resend error message if available
        let errorMessage = error.message;
        if (errorMessage.includes('validation_error')) {
            errorMessage = 'Resend free tier: You can only send emails to the email address you signed up with (nallandhigalsumanth@gmail.com). Please verify a domain at resend.com/domains to send to other addresses.';
        }

        return new Response(
            JSON.stringify({ error: errorMessage }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        );
    }
});
