-- Social Comparison Feature: Age Group Statistics
-- This migration creates tables and functions for anonymous social comparison

-- Age group statistics table
CREATE TABLE IF NOT EXISTS age_group_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  age_range TEXT NOT NULL, -- '8-10', '11-13', '14-16', '17-19'
  avg_weekly_minutes INTEGER,
  avg_daily_minutes INTEGER,
  avg_health_score INTEGER,
  avg_session_count INTEGER,
  avg_sessions_per_day DECIMAL(10,2),
  top_categories JSONB, -- ['competitive', 'creative', 'social']
  total_children INTEGER, -- Number of children in this age group
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(age_range)
);

-- Function to determine age range from age_range field
CREATE OR REPLACE FUNCTION get_age_range(child_age_range TEXT)
RETURNS TEXT AS $$
BEGIN
  CASE child_age_range
    WHEN '5-7' THEN RETURN '5-7';
    WHEN '8-10' THEN RETURN '8-10';
    WHEN '11-13' THEN RETURN '11-13';
    WHEN '14-16' THEN RETURN '14-16';
    WHEN '17+' THEN RETURN '17+';
    ELSE RETURN 'unknown';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate health score (simplified version)
CREATE OR REPLACE FUNCTION calculate_health_score(
  total_minutes INTEGER,
  session_count INTEGER,
  late_night_count INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 100;
  avg_session_length DECIMAL;
BEGIN
  -- Calculate average session length
  IF session_count > 0 THEN
    avg_session_length := total_minutes::DECIMAL / session_count;
  ELSE
    avg_session_length := 0;
  END IF;

  -- Deduct points for excessive gaming
  IF total_minutes > 1260 THEN score := score - 20; END IF; -- More than 21 hours/week
  IF total_minutes > 840 THEN score := score - 10; END IF; -- More than 14 hours/week
  
  -- Deduct points for long sessions
  IF avg_session_length > 120 THEN score := score - 15; END IF; -- Sessions over 2 hours
  IF avg_session_length > 90 THEN score := score - 10; END IF; -- Sessions over 1.5 hours
  
  -- Deduct points for too many sessions
  IF session_count > 20 THEN score := score - 10; END IF;
  
  -- Deduct points for late-night gaming
  IF late_night_count > 3 THEN score := score - 15; END IF;

  -- Ensure score is between 0 and 100
  RETURN GREATEST(0, LEAST(100, score));
END;
$$ LANGUAGE plpgsql;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_age_group_stats_age_range ON age_group_stats(age_range);

-- Insert initial placeholder data (will be updated by aggregation function)
INSERT INTO age_group_stats (age_range, avg_weekly_minutes, avg_daily_minutes, avg_health_score, avg_session_count, avg_sessions_per_day, top_categories, total_children)
VALUES 
  ('5-7', 300, 43, 85, 10, 1.4, '["casual", "educational", "creative"]'::jsonb, 0),
  ('8-10', 420, 60, 80, 14, 2.0, '["casual", "creative", "competitive"]'::jsonb, 0),
  ('11-13', 600, 86, 75, 18, 2.6, '["competitive", "social", "creative"]'::jsonb, 0),
  ('14-16', 720, 103, 70, 20, 2.9, '["competitive", "social", "action"]'::jsonb, 0),
  ('17+', 840, 120, 65, 22, 3.1, '["competitive", "social", "action"]'::jsonb, 0)
ON CONFLICT (age_range) DO NOTHING;
