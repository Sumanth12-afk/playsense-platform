-- ============================================================================
-- Session Notes Feature
-- Allows parents to add context/notes to specific gaming sessions
-- ============================================================================

-- Add notes column to gaming_sessions table (if not exists)
ALTER TABLE gaming_sessions 
ADD COLUMN IF NOT EXISTS parent_note TEXT;

-- Add note_added_at timestamp
ALTER TABLE gaming_sessions 
ADD COLUMN IF NOT EXISTS note_added_at TIMESTAMPTZ;

-- Create an index for sessions with notes
CREATE INDEX IF NOT EXISTS idx_gaming_sessions_has_note 
ON gaming_sessions(child_id) 
WHERE parent_note IS NOT NULL;

-- ============================================================================
-- Function to add/update session note
-- ============================================================================

CREATE OR REPLACE FUNCTION add_session_note(
  p_session_id UUID,
  p_note TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE gaming_sessions
  SET 
    parent_note = p_note,
    note_added_at = NOW()
  WHERE id = p_session_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function to get sessions with notes for a child
-- ============================================================================

CREATE OR REPLACE FUNCTION get_sessions_with_notes(
  p_child_id UUID,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE(
  id UUID,
  game_name TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  parent_note TEXT,
  note_added_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gs.id,
    COALESCE(g.name, 'Unknown Game') as game_name,
    gs.started_at,
    gs.ended_at,
    gs.duration_minutes,
    gs.parent_note,
    gs.note_added_at
  FROM gaming_sessions gs
  LEFT JOIN games g ON gs.game_id = g.id
  WHERE gs.child_id = p_child_id
    AND gs.parent_note IS NOT NULL
  ORDER BY gs.note_added_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Success Message
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Session notes feature added successfully!';
END $$;
