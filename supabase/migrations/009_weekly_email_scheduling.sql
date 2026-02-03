-- ============================================================================
-- Weekly Email Scheduling Enhancement
-- Adds support for timezone-aware weekly email scheduling
-- ============================================================================

-- Add weekly_send_day and weekly_send_time columns to email_preferences
-- weekly_send_day: 0 = Sunday, 1 = Monday, etc.
ALTER TABLE email_preferences 
ADD COLUMN IF NOT EXISTS weekly_send_day INTEGER DEFAULT 0 CHECK (weekly_send_day >= 0 AND weekly_send_day <= 6);

ALTER TABLE email_preferences 
ADD COLUMN IF NOT EXISTS weekly_send_time TEXT DEFAULT '09:00';

-- Create a table to track email send history (prevents duplicate sends)
CREATE TABLE IF NOT EXISTS email_send_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL CHECK (email_type IN ('daily', 'weekly')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  week_key TEXT, -- Format: 'YYYY-WW' for weekly, 'YYYY-MM-DD' for daily
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_email_send_log_lookup 
ON email_send_log(user_id, child_id, email_type, week_key);

-- ============================================================================
-- CRON JOB SETUP (Requires pg_cron extension enabled in Supabase)
-- Note: pg_cron must be enabled in your Supabase project dashboard first
-- Go to Database -> Extensions -> Enable pg_cron
-- ============================================================================

-- This creates a function that can be called by pg_cron or external scheduler
CREATE OR REPLACE FUNCTION trigger_weekly_digest()
RETURNS void AS $$
BEGIN
  -- This function is a placeholder that gets called by pg_cron
  -- The actual email sending is done by the Edge Function
  -- You can use pg_net extension to call the Edge Function
  RAISE NOTICE 'Weekly digest trigger executed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Success Message
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Weekly email scheduling tables created successfully!';
  RAISE NOTICE 'To enable automatic weekly emails:';
  RAISE NOTICE '1. Enable pg_cron extension in Supabase Dashboard';
  RAISE NOTICE '2. Enable pg_net extension in Supabase Dashboard';
  RAISE NOTICE '3. Run the cron setup query from the documentation';
END $$;
