
-- Update get_map_events to be more inclusive
CREATE OR REPLACE FUNCTION get_map_events(
  p_priority_max INT DEFAULT 3, -- Increased from 2 to include MEDIUM by default
  p_limit INT DEFAULT 300
)
RETURNS TABLE (
  id UUID,
  lat FLOAT,
  lng FLOAT,
  category TEXT,
  severity TEXT,
  priority INT,
  event_timestamp TIMESTAMPTZ
) AS $$  
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.lat,
    e.lng,
    e.category,
    e.severity,
    e.priority,
    e.event_timestamp
  FROM events e
  WHERE e.priority <= p_priority_max
    OR e.severity IN ('HIGH', 'CRITICAL', 'ELEVATED')
    OR (e.priority IS NULL AND e.severity = 'MEDIUM') -- Fallback for NULL priority items
  ORDER BY 
    COALESCE(e.priority, 3) ASC,
    CASE e.severity
      WHEN 'CRITICAL' THEN 1
      WHEN 'HIGH' THEN 2
      WHEN 'ELEVATED' THEN 3
      WHEN 'MEDIUM' THEN 4
      WHEN 'LOW' THEN 5
    END,
    e.event_timestamp DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
