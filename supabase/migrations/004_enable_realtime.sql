-- Enable Supabase Realtime for gaming_sessions table
-- This allows the web dashboard to receive instant updates when sessions change

-- Add the gaming_sessions table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE gaming_sessions;

-- Also add is_active column if it doesn't exist (for active session tracking)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'gaming_sessions' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE gaming_sessions ADD COLUMN is_active BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Create index for faster active session queries
CREATE INDEX IF NOT EXISTS idx_gaming_sessions_active 
ON gaming_sessions (child_id, is_active) 
WHERE ended_at IS NULL;
