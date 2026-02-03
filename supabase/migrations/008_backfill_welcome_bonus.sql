-- Add 50 welcome bonus points to ALL existing children who don't have it yet
-- This is a one-time migration to backfill points for children created before the feature

-- Insert 50 welcome bonus points for all children who don't already have welcome_bonus
INSERT INTO reward_points (child_id, points_change, reason)
SELECT c.id, 50, 'welcome_bonus'
FROM children c
WHERE NOT EXISTS (
  SELECT 1 FROM reward_points rp 
  WHERE rp.child_id = c.id 
  AND rp.reason = 'welcome_bonus'
);

-- Log how many children received the bonus (this will show in Supabase logs)
DO $$
DECLARE
  count_updated INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_updated
  FROM reward_points
  WHERE reason = 'welcome_bonus'
  AND created_at >= NOW() - INTERVAL '1 minute';
  
  RAISE NOTICE 'Added welcome bonus to % children', count_updated;
END $$;
