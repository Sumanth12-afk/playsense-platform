-- ============================================================================
-- PlaySense Complete Database Setup
-- Copy and paste this ENTIRE file into Supabase SQL Editor
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLES
-- ============================================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Children table
CREATE TABLE children (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age_range TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Devices table
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  os TEXT NOT NULL DEFAULT 'Windows',
  last_sync TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('connected', 'offline')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Games table
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('competitive', 'creative', 'casual', 'social')),
  process_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gaming sessions table
CREATE TABLE gaming_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  game_id UUID REFERENCES games(id) ON DELETE SET NULL,
  game_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('competitive', 'creative', 'casual', 'social')),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  is_late_night BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email preferences table
CREATE TABLE email_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  daily_summary BOOLEAN DEFAULT FALSE,
  daily_summary_time TIME DEFAULT '08:00:00',
  weekly_digest BOOLEAN DEFAULT TRUE,
  alerts_enabled BOOLEAN DEFAULT TRUE,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('burnout_risk', 'late_night', 'game_dominance', 'positive_trend')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tamper events table
CREATE TABLE tamper_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('task_kill_attempt', 'uninstall_attempt', 'file_tampering')),
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parent notes table
CREATE TABLE parent_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_children_user_id ON children(user_id);
CREATE INDEX idx_devices_child_id ON devices(child_id);
CREATE INDEX idx_gaming_sessions_child_id ON gaming_sessions(child_id);
CREATE INDEX idx_gaming_sessions_device_id ON gaming_sessions(device_id);
CREATE INDEX idx_gaming_sessions_start_time ON gaming_sessions(start_time);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_children_updated_at BEFORE UPDATE ON children
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_preferences_updated_at BEFORE UPDATE ON email_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE gaming_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tamper_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_notes ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Children policies
CREATE POLICY "Parents can view own children"
  ON children FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Parents can insert own children"
  ON children FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Parents can update own children"
  ON children FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Parents can delete own children"
  ON children FOR DELETE
  USING (auth.uid() = user_id);

-- Devices policies
CREATE POLICY "Parents can view children's devices"
  ON devices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = devices.child_id
      AND children.user_id = auth.uid()
    )
  );

CREATE POLICY "Desktop app can insert devices"
  ON devices FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Desktop app can update devices"
  ON devices FOR UPDATE
  USING (true);

-- Games policies
CREATE POLICY "Anyone can view games"
  ON games FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service can manage games"
  ON games FOR ALL
  USING (true);

-- Gaming sessions policies
CREATE POLICY "Parents can view children's sessions"
  ON gaming_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = gaming_sessions.child_id
      AND children.user_id = auth.uid()
    )
  );

CREATE POLICY "Desktop app can insert sessions"
  ON gaming_sessions FOR INSERT
  WITH CHECK (true);

-- Email preferences policies
CREATE POLICY "Users can view own email preferences"
  ON email_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email preferences"
  ON email_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email preferences"
  ON email_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Tamper events policies
CREATE POLICY "Parents can view tamper events"
  ON tamper_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM devices
      JOIN children ON children.id = devices.child_id
      WHERE devices.id = tamper_events.device_id
      AND children.user_id = auth.uid()
    )
  );

CREATE POLICY "Desktop app can insert tamper events"
  ON tamper_events FOR INSERT
  WITH CHECK (true);

-- Parent notes policies
CREATE POLICY "Parents can view own notes"
  ON parent_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Parents can insert own notes"
  ON parent_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Parents can update own notes"
  ON parent_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Parents can delete own notes"
  ON parent_notes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- SEED DATA
-- ============================================================================

INSERT INTO games (name, category, process_name) VALUES
  ('Fortnite', 'competitive', 'FortniteClient-Win64-Shipping.exe'),
  ('Valorant', 'competitive', 'VALORANT-Win64-Shipping.exe'),
  ('Roblox', 'creative', 'RobloxPlayerBeta.exe'),
  ('Minecraft', 'creative', 'Minecraft.Windows.exe'),
  ('Minecraft Java', 'creative', 'javaw.exe'),
  ('League of Legends', 'competitive', 'League of Legends.exe'),
  ('Counter-Strike 2', 'competitive', 'cs2.exe'),
  ('Grand Theft Auto V', 'casual', 'GTA5.exe'),
  ('Discord', 'social', 'Discord.exe'),
  ('Overwatch 2', 'competitive', 'Overwatch.exe'),
  ('Apex Legends', 'competitive', 'r5apex.exe'),
  ('Call of Duty', 'competitive', 'cod.exe'),
  ('Among Us', 'social', 'Among Us.exe'),
  ('Fall Guys', 'casual', 'FallGuys_client.exe'),
  ('Rocket League', 'competitive', 'RocketLeague.exe'),
  ('Steam', 'social', 'steam.exe'),
  ('Epic Games', 'social', 'EpicGamesLauncher.exe')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- COMPLETE! You should see "Success" message
-- ============================================================================

