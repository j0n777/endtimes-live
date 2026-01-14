-- =====================================================
-- ENHANCED EVENT DATA FIELDS
-- Adds fields for standardized events, geocoding, and OSINT
-- =====================================================

-- Add new columns for enhanced event data
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS priority INT CHECK (priority BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS geocoding_accuracy TEXT CHECK (geocoding_accuracy IN ('exact', 'street', 'city', 'region', 'country', 'unknown')),
ADD COLUMN IF NOT EXISTS geocoding_confidence FLOAT CHECK (geocoding_confidence BETWEEN 0 AND 1),
ADD COLUMN IF NOT EXISTS geocoded_by TEXT CHECK (geocoded_by IN ('api', 'ai', 'manual', 'source')),
ADD COLUMN IF NOT EXISTS original_location_text TEXT,
ADD COLUMN IF NOT EXISTS ai_processed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ai_summary TEXT,
ADD COLUMN IF NOT EXISTS ai_tags TEXT[],
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_source TEXT,
ADD COLUMN IF NOT EXISTS data_confidence FLOAT CHECK (data_confidence BETWEEN 0 AND 1),
ADD COLUMN IF NOT EXISTS casualties INT,
ADD COLUMN IF NOT EXISTS affected_population INT,
ADD COLUMN IF NOT EXISTS economic_impact BIGINT,
ADD COLUMN IF NOT EXISTS detected_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS street TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS region TEXT,
ADD COLUMN IF NOT EXISTS country_code CHAR(2);

-- Indexes for new fields
CREATE INDEX IF NOT EXISTS events_priority_idx ON events (priority);
CREATE INDEX IF NOT EXISTS events_tags_idx ON events USING GIN (tags);
CREATE INDEX IF NOT EXISTS events_geocoding_accuracy_idx ON events (geocoding_accuracy);
CREATE INDEX IF NOT EXISTS events_ai_processed_idx ON events (ai_processed);
CREATE INDEX IF NOT EXISTS events_city_idx ON events (city);
CREATE INDEX IF NOT EXISTS events_country_code_idx ON events (country_code);

-- Composite index for frontend priority filtering
CREATE INDEX IF NOT EXISTS events_frontend_priority_idx 
ON events (priority, severity, detected_at DESC)
WHERE priority <= 2; -- Only HIGH priority events

-- Function to get lightweight events optimized for map rendering
CREATE OR REPLACE FUNCTION get_map_events(
  p_priority_max INT DEFAULT 2,
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
    OR e.severity IN ('HIGH', 'CRITICAL')
  ORDER BY 
    e.priority ASC,
    CASE e.severity
      WHEN 'CRITICAL' THEN 1
      WHEN 'HIGH' THEN 2
      WHEN 'ELEVATED' THEN 3
      WHEN 'MEDIUM' THEN 4
      WHEN 'LOW' THEN 5
    END,
    e.detected_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get standard events for cards/list
CREATE OR REPLACE FUNCTION get_event_cards(
  p_event_ids UUID[]
)
RETURNS TABLE (
  id UUID,
  lat FLOAT,
  lng FLOAT,
  category TEXT,
  severity TEXT,
  priority INT,
  title TEXT,
  city TEXT,
  country_code CHAR(2),
  source_name TEXT,
  summary TEXT,
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
    e.title,
    e.city,
    e.country_code,
    e.source_name,
    LEFT(e.description, 200) as summary, -- First 200 chars
    e.event_timestamp
  FROM events e
  WHERE e.id = ANY(p_event_ids)
  ORDER BY e.priority ASC, e.detected_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to search events by tags
CREATE OR REPLACE FUNCTION search_events_by_tags(
  p_tags TEXT[],
  p_limit INT DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  category TEXT,
  severity TEXT,
  priority INT,
  tags TEXT[],
  event_timestamp TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.title,
    e.category,
    e.severity,
    e.priority,
    e.tags,
    e.event_timestamp
  FROM events e
  WHERE e.tags && p_tags -- Array overlap operator
  ORDER BY e.priority ASC, e.detected_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get events by location accuracy
CREATE OR REPLACE FUNCTION get_precise_events(
  p_min_accuracy TEXT DEFAULT 'street',
  p_limit INT DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  lat FLOAT,
  lng FLOAT,
  accuracy TEXT,
  address TEXT,
  city TEXT,
  geocoding_confidence FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.title,
    e.lat,
    e.lng,
    e.geocoding_accuracy as accuracy,
    e.address,
    e.city,
    e.geocoding_confidence
  FROM events e
  WHERE e.geocoding_accuracy IN ('exact', 'street')
    OR (p_min_accuracy = 'city' AND e.geocoding_accuracy IN ('exact', 'street', 'city'))
  ORDER BY 
    CASE e.geocoding_accuracy
      WHEN 'exact' THEN 1
      WHEN 'street' THEN 2
      WHEN 'city' THEN 3
      WHEN 'region' THEN 4
      WHEN 'country' THEN 5
    END,
    e.geocoding_confidence DESC NULLS LAST
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Update updated_at trigger to include new fields
CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_events_updated_at ON events;
CREATE TRIGGER trigger_update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_events_updated_at();

COMMENT ON COLUMN events.priority IS '1-5 priority level (1=most critical, 5=least)';
COMMENT ON COLUMN events.tags IS 'Array of tags for filtering and search';
COMMENT ON COLUMN events.geocoding_accuracy IS 'Precision level of geocoding';
COMMENT ON COLUMN events.geocoding_confidence IS 'AI/API confidence in geocoding (0-1)';
COMMENT ON COLUMN events.ai_processed IS 'Whether event was processed by AI';
COMMENT ON COLUMN events.casualties IS 'Number of casualties if applicable';
COMMENT ON COLUMN events.detected_at IS 'When we first detected/collected this event';
COMMENT ON FUNCTION get_map_events IS 'Get lightweight events optimized for initial map render (10-20KB payload)';
COMMENT ON FUNCTION get_event_cards IS 'Get standard event data for cards/list view (50-100KB payload)';
COMMENT ON FUNCTION search_events_by_tags IS 'Search events by tags using array overlap';
COMMENT ON FUNCTION get_precise_events IS 'Get events with high geocoding precision';
