-- =====================================================
-- EVENTS TABLE OPTIMIZATION
-- Extends existing events table for collector integration
-- =====================================================

-- Add collector tracking fields (if they don't exist)
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS collector_name TEXT,
ADD COLUMN IF NOT EXISTS fetched_at TIMESTAMPTZ DEFAULT NOW();

-- Add foreign key to collector_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_events_collector'
  ) THEN
    ALTER TABLE events
    ADD CONSTRAINT fk_events_collector
    FOREIGN KEY (collector_name)
    REFERENCES collector_status(collector_name)
    ON DELETE SET NULL;
  END IF;
END $$;

-- Indexes for collector queries
CREATE INDEX IF NOT EXISTS events_collector_idx 
ON events (collector_name, fetched_at DESC);

CREATE INDEX IF NOT EXISTS events_fetched_at_idx 
ON events (fetched_at DESC);

-- Composite index for frontend queries (HIGH/ELEVATED priority events)
CREATE INDEX IF NOT EXISTS events_frontend_priority_idx 
ON events (severity, event_timestamp DESC, fetched_at DESC)
WHERE severity IN ('HIGH', 'ELEVATED');

-- Index for cache validation queries
CREATE INDEX IF NOT EXISTS events_cache_validation_idx
ON events (collector_name, fetched_at DESC)
INCLUDE (id, lat, lng, category, severity);

-- Helper function: Get cached events for a collector
CREATE OR REPLACE FUNCTION get_cached_events(
  p_collector_name TEXT,
  p_cache_duration_seconds INT
)
RETURNS TABLE (
  id UUID,
  lat FLOAT,
  lng FLOAT,
  category TEXT,
  severity TEXT,
  title TEXT,
  description TEXT,
  location TEXT,
  source_name TEXT,
  source_type TEXT,
  source_url TEXT,
  event_timestamp TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.lat,
    e.lng,
    e.category,
    e.severity,
    e.title,
    e.description,
    e.location,
    e.source_name,
    e.source_type,
    e.source_url,
    e.event_timestamp,
    e.fetched_at,
    e.metadata
  FROM events e
  WHERE e.collector_name = p_collector_name
    AND e.fetched_at > NOW() - (p_cache_duration_seconds || ' seconds')::INTERVAL
  ORDER BY e.event_timestamp DESC;
END;
$$ LANGUAGE plpgsql;

-- Helper function: Clear stale events for a collector
CREATE OR REPLACE FUNCTION clear_collector_events(
  p_collector_name TEXT
)
RETURNS INT AS $$
DECLARE
  v_deleted_count INT;
BEGIN
  DELETE FROM events
  WHERE collector_name = p_collector_name;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Helper function: Get lightweight alerts for frontend
CREATE OR REPLACE FUNCTION get_lightweight_alerts(
  p_limit INT DEFAULT 100,
  p_min_severity TEXT DEFAULT 'ELEVATED'
)
RETURNS TABLE (
  id UUID,
  lat FLOAT,
  lng FLOAT,
  category TEXT,
  severity TEXT,
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
    e.event_timestamp
  FROM events e
  WHERE e.severity IN ('HIGH', 'ELEVATED')
    OR (p_min_severity = 'MEDIUM' AND e.severity IN ('HIGH', 'ELEVATED', 'MEDIUM'))
    OR (p_min_severity = 'LOW' AND e.severity IN ('HIGH', 'ELEVATED', 'MEDIUM', 'LOW'))
  ORDER BY 
    CASE e.severity
      WHEN 'HIGH' THEN 1
      WHEN 'ELEVATED' THEN 2
      WHEN 'MEDIUM' THEN 3
      WHEN 'LOW' THEN 4
    END,
    e.event_timestamp DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update collector statistics when events are inserted
CREATE OR REPLACE FUNCTION update_collector_event_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.collector_name IS NOT NULL THEN
    UPDATE collector_status
    SET total_events_collected = total_events_collected + 1
    WHERE collector_name = NEW.collector_name;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_collector_event_count ON events;
CREATE TRIGGER trigger_update_collector_event_count
  AFTER INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_collector_event_count();

COMMENT ON COLUMN events.collector_name IS 'Name of the collector that fetched this event';
COMMENT ON COLUMN events.fetched_at IS 'When this event was fetched from the API (for cache validation)';
COMMENT ON FUNCTION get_cached_events IS 'Get cached events for a collector within cache duration';
COMMENT ON FUNCTION get_lightweight_alerts IS 'Get lightweight event data for initial frontend load';
