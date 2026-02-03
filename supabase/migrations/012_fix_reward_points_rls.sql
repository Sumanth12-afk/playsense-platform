-- Fix: Make reward functions bypass RLS
-- This ensures the award_points function can insert points regardless of RLS policies

-- Recreate award_points function with SECURITY DEFINER to bypass RLS
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate get_points_balance with SECURITY DEFINER
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate redeem_reward with SECURITY DEFINER
CREATE OR REPLACE FUNCTION redeem_reward(
  p_child_id UUID,
  p_reward_id UUID
)
RETURNS UUID AS $$
DECLARE
  redemption_id UUID;
  reward_points_required INTEGER;
  current_balance INTEGER;
BEGIN
  -- Get reward points required
  SELECT points_required INTO reward_points_required
  FROM rewards
  WHERE id = p_reward_id AND is_active = TRUE;
  
  IF reward_points_required IS NULL THEN
    RAISE EXCEPTION 'Reward not found or inactive';
  END IF;
  
  -- Get current balance
  current_balance := get_points_balance(p_child_id);
  
  -- Check if enough points
  IF current_balance < reward_points_required THEN
    RAISE EXCEPTION 'Insufficient points. Need % but have %', reward_points_required, current_balance;
  END IF;
  
  -- Create redemption request
  INSERT INTO reward_redemptions (child_id, reward_id, points_spent, status)
  VALUES (p_child_id, p_reward_id, reward_points_required, 'pending')
  RETURNING id INTO redemption_id;
  
  -- Deduct points (will be refunded if denied)
  PERFORM award_points(p_child_id, -reward_points_required, 'reward_redeemed', redemption_id);
  
  RETURN redemption_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also add RLS policies for reward_points table if they don't exist
-- Enable RLS
ALTER TABLE reward_points ENABLE ROW LEVEL SECURITY;

-- Policy: Parents can view their children's points
CREATE POLICY IF NOT EXISTS "Parents can view children points" ON reward_points
  FOR SELECT
  USING (
    child_id IN (
      SELECT id FROM children WHERE parent_id = auth.uid()
    )
  );

-- Policy: Allow insert through RPC functions (handled by SECURITY DEFINER)
-- No direct insert policy needed since we use the award_points function

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION award_points TO authenticated;
GRANT EXECUTE ON FUNCTION award_points TO anon;
GRANT EXECUTE ON FUNCTION get_points_balance TO authenticated;
GRANT EXECUTE ON FUNCTION get_points_balance TO anon;
GRANT EXECUTE ON FUNCTION redeem_reward TO authenticated;
