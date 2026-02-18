-- ============================================================================
-- Enable Row Level Security (RLS) on All Tables - V2 (Fixed Type Issues)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS children ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS games ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gaming_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tamper_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS parent_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reward_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS email_send_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS achievement_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS achievement_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS child_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS age_group_stats ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- REWARDS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Parents can view own rewards" ON rewards;
DROP POLICY IF EXISTS "Parents can create own rewards" ON rewards;
DROP POLICY IF EXISTS "Parents can update own rewards" ON rewards;
DROP POLICY IF EXISTS "Parents can delete own rewards" ON rewards;
DROP POLICY IF EXISTS "Children can view active rewards" ON rewards;

CREATE POLICY "Parents can view own rewards" ON rewards
  FOR SELECT
  USING (auth.uid() = parent_id);

CREATE POLICY "Parents can create own rewards" ON rewards
  FOR INSERT
  WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Parents can update own rewards" ON rewards
  FOR UPDATE
  USING (auth.uid() = parent_id);

CREATE POLICY "Parents can delete own rewards" ON rewards
  FOR DELETE
  USING (auth.uid() = parent_id);

CREATE POLICY "Children can view active rewards" ON rewards
  FOR SELECT
  USING (is_active = TRUE);

-- ============================================================================
-- REWARD_REDEMPTIONS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Parents can view children redemptions" ON reward_redemptions;
DROP POLICY IF EXISTS "Parents can update children redemptions" ON reward_redemptions;
DROP POLICY IF EXISTS "Children can create redemptions" ON reward_redemptions;

CREATE POLICY "Parents can view children redemptions" ON reward_redemptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM children 
      WHERE children.id = reward_redemptions.child_id 
      AND children.user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can update children redemptions" ON reward_redemptions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM children 
      WHERE children.id = reward_redemptions.child_id 
      AND children.user_id = auth.uid()
    )
  );

CREATE POLICY "Children can create redemptions" ON reward_redemptions
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- EMAIL_SEND_LOG TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own email logs" ON email_send_log;
DROP POLICY IF EXISTS "Service can insert email logs" ON email_send_log;

-- Note: email_send_log.user_id is TEXT, so cast auth.uid() to TEXT
CREATE POLICY "Users can view own email logs" ON email_send_log
  FOR SELECT
  USING (user_id = auth.uid()::TEXT);

CREATE POLICY "Service can insert email logs" ON email_send_log
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- ACHIEVEMENT_DEFINITIONS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view achievement definitions" ON achievement_definitions;

CREATE POLICY "Anyone can view achievement definitions" ON achievement_definitions
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- ACHIEVEMENT_PROGRESS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Parents can view children achievement progress" ON achievement_progress;
DROP POLICY IF EXISTS "Service can update achievement progress" ON achievement_progress;

CREATE POLICY "Parents can view children achievement progress" ON achievement_progress
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM children 
      WHERE children.id = achievement_progress.child_id 
      AND children.user_id = auth.uid()
    )
  );

CREATE POLICY "Service can update achievement progress" ON achievement_progress
  FOR ALL
  USING (true);

-- ============================================================================
-- CHILD_ACHIEVEMENTS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Parents can view children achievements" ON child_achievements;
DROP POLICY IF EXISTS "Service can insert child achievements" ON child_achievements;

CREATE POLICY "Parents can view children achievements" ON child_achievements
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM children 
      WHERE children.id = child_achievements.child_id 
      AND children.user_id = auth.uid()
    )
  );

CREATE POLICY "Service can insert child achievements" ON child_achievements
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- AGE_GROUP_STATS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view age group stats" ON age_group_stats;
DROP POLICY IF EXISTS "Service can update age group stats" ON age_group_stats;

CREATE POLICY "Anyone can view age group stats" ON age_group_stats
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service can update age group stats" ON age_group_stats
  FOR ALL
  USING (true);
