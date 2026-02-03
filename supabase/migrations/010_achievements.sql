-- ============================================================================
-- Achievement System for PlaySense
-- Tracks healthy gaming milestones and rewards positive behavior
-- ============================================================================

-- Achievement definitions table
CREATE TABLE IF NOT EXISTS achievement_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🏆',
  category TEXT NOT NULL CHECK (category IN ('health', 'variety', 'balance', 'social', 'milestone')),
  points INTEGER DEFAULT 10,
  requirement_type TEXT NOT NULL, -- e.g., 'streak_days', 'no_late_night', 'game_variety', etc.
  requirement_value INTEGER NOT NULL, -- the threshold value
  is_repeatable BOOLEAN DEFAULT FALSE, -- can earn multiple times?
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Child achievements (earned badges)
CREATE TABLE IF NOT EXISTS child_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievement_definitions(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  times_earned INTEGER DEFAULT 1,
  UNIQUE(child_id, achievement_id)
);

-- Achievement progress tracking (for in-progress achievements)
CREATE TABLE IF NOT EXISTS achievement_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievement_definitions(id) ON DELETE CASCADE,
  current_progress INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(child_id, achievement_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_child_achievements_child ON child_achievements(child_id);
CREATE INDEX IF NOT EXISTS idx_achievement_progress_child ON achievement_progress(child_id);

-- ============================================================================
-- SEED DEFAULT ACHIEVEMENTS
-- ============================================================================

INSERT INTO achievement_definitions (name, description, icon, category, points, requirement_type, requirement_value, is_repeatable) VALUES
  -- Health achievements
  ('Early Bird', 'No late-night gaming for 7 days in a row', '🌅', 'health', 25, 'no_late_night_streak', 7, TRUE),
  ('Sleep Champion', 'No late-night gaming for 30 days', '😴', 'health', 100, 'no_late_night_streak', 30, FALSE),
  ('Break Master', 'Took regular breaks during gaming sessions', '⏸️', 'health', 15, 'break_sessions', 10, TRUE),
  ('Healthy Gamer', 'Maintained health score above 80 for a week', '💚', 'health', 50, 'health_score_streak', 7, TRUE),
  
  -- Variety achievements  
  ('Game Explorer', 'Played 5 different games in a week', '🎮', 'variety', 20, 'unique_games_week', 5, TRUE),
  ('Diverse Player', 'Played games from all 4 categories', '🌈', 'variety', 30, 'all_categories', 4, TRUE),
  ('Try Something New', 'Played a new game this week', '✨', 'variety', 10, 'new_game', 1, TRUE),
  
  -- Balance achievements
  ('Weekend Warrior', 'Kept gaming balanced on weekends', '⚖️', 'balance', 20, 'weekend_balance', 3, TRUE),
  ('Weekday Balance', 'Kept weekday gaming under 2 hours average', '📚', 'balance', 25, 'weekday_moderate', 5, TRUE),
  ('Session Control', 'No session longer than 90 minutes this week', '⏱️', 'balance', 30, 'short_sessions_week', 7, TRUE),
  
  -- Milestone achievements
  ('First Week', 'Completed first week of tracking', '🎉', 'milestone', 50, 'days_tracked', 7, FALSE),
  ('One Month Strong', 'One month of healthy gaming insights', '📅', 'milestone', 100, 'days_tracked', 30, FALSE),
  ('Quarter Champion', '3 months of gaming insights', '🏅', 'milestone', 200, 'days_tracked', 90, FALSE),
  
  -- Social achievements
  ('Team Player', 'Played social games this week', '👥', 'social', 15, 'social_games', 3, TRUE),
  ('Creative Mind', 'Spent time in creative games', '🎨', 'social', 15, 'creative_games', 3, TRUE)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- FUNCTION: Check and award achievements for a child
-- ============================================================================

CREATE OR REPLACE FUNCTION check_achievements(p_child_id UUID)
RETURNS TABLE(achievement_name TEXT, newly_earned BOOLEAN) AS $$
DECLARE
  achievement RECORD;
  current_val INTEGER;
  already_earned BOOLEAN;
  earned_count INTEGER;
BEGIN
  -- Loop through all achievements
  FOR achievement IN SELECT * FROM achievement_definitions LOOP
    already_earned := FALSE;
    
    -- Check if already earned (for non-repeatable)
    SELECT COUNT(*) INTO earned_count 
    FROM child_achievements 
    WHERE child_id = p_child_id AND achievement_id = achievement.id;
    
    IF NOT achievement.is_repeatable AND earned_count > 0 THEN
      CONTINUE; -- Skip if already earned and not repeatable
    END IF;
    
    -- Calculate current progress based on requirement type
    current_val := 0;
    
    CASE achievement.requirement_type
      WHEN 'no_late_night_streak' THEN
        -- Count consecutive days without late-night sessions
        WITH daily_late AS (
          SELECT DATE(started_at) as day,
                 COUNT(*) FILTER (WHERE EXTRACT(HOUR FROM ended_at) >= 22 OR EXTRACT(HOUR FROM ended_at) < 6) as late_count
          FROM gaming_sessions 
          WHERE child_id = p_child_id 
            AND started_at >= NOW() - INTERVAL '30 days'
          GROUP BY DATE(started_at)
        )
        SELECT COUNT(*) INTO current_val
        FROM daily_late 
        WHERE late_count = 0;
        
      WHEN 'unique_games_week' THEN
        SELECT COUNT(DISTINCT game_id) INTO current_val
        FROM gaming_sessions 
        WHERE child_id = p_child_id 
          AND started_at >= NOW() - INTERVAL '7 days';
          
      WHEN 'days_tracked' THEN
        SELECT EXTRACT(DAY FROM NOW() - MIN(created_at))::INTEGER INTO current_val
        FROM children WHERE id = p_child_id;
        
      WHEN 'social_games' THEN
        SELECT COUNT(*) INTO current_val
        FROM gaming_sessions gs
        JOIN games g ON gs.game_id = g.id
        WHERE gs.child_id = p_child_id 
          AND gs.started_at >= NOW() - INTERVAL '7 days'
          AND g.category = 'social';
          
      WHEN 'creative_games' THEN
        SELECT COUNT(*) INTO current_val
        FROM gaming_sessions gs
        JOIN games g ON gs.game_id = g.id
        WHERE gs.child_id = p_child_id 
          AND gs.started_at >= NOW() - INTERVAL '7 days'
          AND g.category = 'creative';
          
      ELSE
        current_val := 0;
    END CASE;
    
    -- Update progress
    INSERT INTO achievement_progress (child_id, achievement_id, current_progress)
    VALUES (p_child_id, achievement.id, current_val)
    ON CONFLICT (child_id, achievement_id) 
    DO UPDATE SET current_progress = current_val, last_updated = NOW();
    
    -- Check if achievement is earned
    IF current_val >= achievement.requirement_value THEN
      -- Award the achievement
      INSERT INTO child_achievements (child_id, achievement_id)
      VALUES (p_child_id, achievement.id)
      ON CONFLICT (child_id, achievement_id) 
      DO UPDATE SET times_earned = child_achievements.times_earned + 1, earned_at = NOW()
      WHERE achievement.is_repeatable;
      
      -- Return result
      achievement_name := achievement.name;
      newly_earned := (earned_count = 0);
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Get child's achievements
-- ============================================================================

CREATE OR REPLACE FUNCTION get_child_achievements(p_child_id UUID)
RETURNS TABLE(
  id UUID,
  name TEXT,
  description TEXT,
  icon TEXT,
  category TEXT,
  points INTEGER,
  earned_at TIMESTAMPTZ,
  times_earned INTEGER,
  current_progress INTEGER,
  requirement_value INTEGER,
  is_earned BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ad.id,
    ad.name,
    ad.description,
    ad.icon,
    ad.category,
    ad.points,
    ca.earned_at,
    COALESCE(ca.times_earned, 0) as times_earned,
    COALESCE(ap.current_progress, 0) as current_progress,
    ad.requirement_value,
    (ca.id IS NOT NULL) as is_earned
  FROM achievement_definitions ad
  LEFT JOIN child_achievements ca ON ca.achievement_id = ad.id AND ca.child_id = p_child_id
  LEFT JOIN achievement_progress ap ON ap.achievement_id = ad.id AND ap.child_id = p_child_id
  ORDER BY (ca.id IS NOT NULL) DESC, ad.category, ad.points DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Success Message
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Achievement system tables created successfully!';
  RAISE NOTICE 'Default achievements seeded.';
END $$;
