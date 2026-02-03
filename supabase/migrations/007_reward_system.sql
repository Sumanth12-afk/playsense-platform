-- Reward System: Points and Rewards
-- This migration creates tables for gamification rewards system

-- Rewards catalog table (created by parents)
CREATE TABLE IF NOT EXISTS rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_name TEXT NOT NULL,
  reward_type TEXT NOT NULL, -- 'extra_time', 'new_game', 'special_privilege', 'custom'
  description TEXT,
  points_required INTEGER NOT NULL DEFAULT 100,
  icon TEXT, -- emoji or icon name
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Points transactions table (track all point changes)
CREATE TABLE IF NOT EXISTS reward_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  points_change INTEGER NOT NULL, -- positive for earning, negative for spending
  reason TEXT NOT NULL, -- 'goal_completed', 'achievement_earned', 'reward_redeemed', 'parent_bonus'
  reference_id UUID, -- ID of goal, achievement, or redemption
  created_at TIMESTAMP DEFAULT NOW()
);

-- Redemptions table (track reward redemptions)
CREATE TABLE IF NOT EXISTS reward_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  reward_id UUID REFERENCES rewards(id) ON DELETE CASCADE,
  points_spent INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'denied', 'completed'
  requested_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by UUID REFERENCES auth.users(id),
  parent_notes TEXT,
  completed_at TIMESTAMP
);

-- Function to get current points balance for a child
CREATE OR REPLACE FUNCTION get_points_balance(p_child_id UUID)
RETURNS INTEGER AS $$
DECLARE
  balance INTEGER;
BEGIN
  SELECT COALESCE(SUM(points_change), 0)
  INTO balance
  FROM reward_points
  WHERE child_id = p_child_id;
  
  RETURN balance;
END;
$$ LANGUAGE plpgsql;

-- Function to award points
CREATE OR REPLACE FUNCTION award_points(
  p_child_id UUID,
  p_points INTEGER,
  p_reason TEXT,
  p_reference_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  transaction_id UUID;
BEGIN
  INSERT INTO reward_points (child_id, points_change, reason, reference_id)
  VALUES (p_child_id, p_points, p_reason, p_reference_id)
  RETURNING id INTO transaction_id;
  
  RETURN transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Function to redeem reward
CREATE OR REPLACE FUNCTION redeem_reward(
  p_child_id UUID,
  p_reward_id UUID
)
RETURNS UUID AS $$
DECLARE
  redemption_id UUID;
  reward_points INTEGER;
  current_balance INTEGER;
BEGIN
  -- Get reward points required
  SELECT points_required INTO reward_points
  FROM rewards
  WHERE id = p_reward_id AND is_active = TRUE;
  
  IF reward_points IS NULL THEN
    RAISE EXCEPTION 'Reward not found or inactive';
  END IF;
  
  -- Get current balance
  current_balance := get_points_balance(p_child_id);
  
  -- Check if enough points
  IF current_balance < reward_points THEN
    RAISE EXCEPTION 'Insufficient points. Need % but have %', reward_points, current_balance;
  END IF;
  
  -- Create redemption request
  INSERT INTO reward_redemptions (child_id, reward_id, points_spent, status)
  VALUES (p_child_id, p_reward_id, reward_points, 'pending')
  RETURNING id INTO redemption_id;
  
  -- Deduct points (will be refunded if denied)
  PERFORM award_points(p_child_id, -reward_points, 'reward_redeemed', redemption_id);
  
  RETURN redemption_id;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rewards_parent_id ON rewards(parent_id);
CREATE INDEX IF NOT EXISTS idx_rewards_active ON rewards(is_active);
CREATE INDEX IF NOT EXISTS idx_reward_points_child_id ON reward_points(child_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_child_id ON reward_redemptions(child_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_status ON reward_redemptions(status);

-- Insert default rewards
INSERT INTO rewards (parent_id, reward_name, reward_type, description, points_required, icon, is_active)
SELECT 
  u.id,
  r.reward_name,
  r.reward_type,
  r.description,
  r.points_required,
  r.icon,
  TRUE
FROM auth.users u
CROSS JOIN (
  VALUES
    ('Extra 30 Minutes', 'extra_time', 'Get an extra 30 minutes of gaming time', 100, '⏰'),
    ('Extra 1 Hour', 'extra_time', 'Get an extra hour of gaming time', 200, '⏱️'),
    ('New Game Request', 'new_game', 'Request a new game purchase', 500, '🎮'),
    ('Late Night Pass', 'special_privilege', 'Stay up 30 minutes later for gaming', 150, '🌙'),
    ('Weekend Bonus', 'special_privilege', 'Extra gaming time on weekend', 250, '🎉'),
    ('Game Night', 'special_privilege', 'Family game night of your choice', 300, '👨‍👩‍👧'),
    ('Custom Reward', 'custom', 'Create your own reward!', 400, '⭐')
) AS r(reward_name, reward_type, description, points_required, icon)
ON CONFLICT DO NOTHING;

-- Award initial welcome bonus points to all existing children
INSERT INTO reward_points (child_id, points_change, reason)
SELECT id, 50, 'welcome_bonus'
FROM children
WHERE id NOT IN (SELECT DISTINCT child_id FROM reward_points WHERE reason = 'welcome_bonus')
ON CONFLICT DO NOTHING;
