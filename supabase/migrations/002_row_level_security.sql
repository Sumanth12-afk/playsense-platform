-- Enable Row Level Security on all tables
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

-- Games policies (public read, service write)
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

