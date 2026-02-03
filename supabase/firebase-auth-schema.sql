-- ============================================================================
-- PlaySense Database Schema for FIREBASE AUTH
-- This schema is designed to work with Firebase Authentication
-- ============================================================================

-- Drop existing tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS parent_notes CASCADE;
DROP TABLE IF EXISTS tamper_events CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS email_preferences CASCADE;
DROP TABLE IF EXISTS gaming_sessions CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS devices CASCADE;
DROP TABLE IF EXISTS children CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLES (Firebase Auth Compatible)
-- ============================================================================

-- Users table (stores Firebase user data)
CREATE TABLE users (
  id TEXT PRIMARY KEY,  -- Firebase UID (string, not UUID)
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Children table
CREATE TABLE children (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age_range TEXT NOT NULL,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Devices table
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  os TEXT NOT NULL DEFAULT 'Windows',
  last_sync_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('active', 'offline')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Games table
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('competitive', 'creative', 'casual', 'social')),
  process_name TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gaming sessions table
CREATE TABLE gaming_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  game_id UUID REFERENCES games(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  is_late_night BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email preferences table
CREATE TABLE email_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  email TEXT NOT NULL,
  daily_enabled BOOLEAN DEFAULT TRUE,
  daily_time TEXT DEFAULT '20:00',
  weekly_enabled BOOLEAN DEFAULT FALSE,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
  event_type TEXT NOT NULL CHECK (event_type IN ('task_kill_attempt', 'uninstall_attempt', 'file_tampering', 'process_kill')),
  details TEXT,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parent notes table
CREATE TABLE parent_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_children_parent_id ON children(parent_id);
CREATE INDEX idx_devices_child_id ON devices(child_id);
CREATE INDEX idx_gaming_sessions_child_id ON gaming_sessions(child_id);
CREATE INDEX idx_gaming_sessions_game_id ON gaming_sessions(game_id);
CREATE INDEX idx_gaming_sessions_started_at ON gaming_sessions(started_at);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_email_preferences_user_id ON email_preferences(user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_children_updated_at BEFORE UPDATE ON children
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_preferences_updated_at BEFORE UPDATE ON email_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parent_notes_updated_at BEFORE UPDATE ON parent_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (DISABLED - Firebase handles auth)
-- ============================================================================

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE children DISABLE ROW LEVEL SECURITY;
ALTER TABLE devices DISABLE ROW LEVEL SECURITY;
ALTER TABLE games DISABLE ROW LEVEL SECURITY;
ALTER TABLE gaming_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE tamper_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE parent_notes DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SEED DATA - Popular Games
-- ============================================================================

INSERT INTO games (name, category, process_name) VALUES
  ('Minecraft', 'creative', ARRAY['Minecraft.exe', 'javaw.exe', 'MinecraftLauncher.exe']),
  ('Fortnite', 'competitive', ARRAY['FortniteClient-Win64-Shipping.exe', 'FortniteLauncher.exe']),
  ('Roblox', 'social', ARRAY['RobloxPlayerBeta.exe', 'RobloxStudioBeta.exe']),
  ('League of Legends', 'competitive', ARRAY['League of Legends.exe', 'LeagueClient.exe']),
  ('Valorant', 'competitive', ARRAY['VALORANT.exe', 'VALORANT-Win64-Shipping.exe']),
  ('Apex Legends', 'competitive', ARRAY['r5apex.exe']),
  ('Among Us', 'social', ARRAY['Among Us.exe']),
  ('Genshin Impact', 'casual', ARRAY['GenshinImpact.exe', 'YuanShen.exe']),
  ('Rocket League', 'competitive', ARRAY['RocketLeague.exe']),
  ('Overwatch', 'competitive', ARRAY['Overwatch.exe']),
  ('Call of Duty: Warzone', 'competitive', ARRAY['ModernWarfare.exe', 'cod.exe']),
  ('Call of Duty: Modern Warfare', 'competitive', ARRAY['ModernWarfare.exe']),
  ('Call of Duty: Black Ops', 'competitive', ARRAY['BlackOpsColdWar.exe', 'BlackOps3.exe']),
  ('Discord', 'social', ARRAY['Discord.exe']),
  ('Steam', 'casual', ARRAY['steam.exe', 'steamwebhelper.exe']),
  ('Counter-Strike 2', 'competitive', ARRAY['cs2.exe']),
  ('CS:GO', 'competitive', ARRAY['csgo.exe']),
  ('PUBG', 'competitive', ARRAY['TslGame.exe']),
  ('Grand Theft Auto V', 'casual', ARRAY['GTA5.exe', 'GTAV.exe']),
  ('Destiny 2', 'competitive', ARRAY['destiny2.exe']);

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Database schema created successfully for Firebase Auth!';
  RAISE NOTICE 'All tables created with RLS disabled.';
  RAISE NOTICE 'Popular games seeded.';
END $$;

