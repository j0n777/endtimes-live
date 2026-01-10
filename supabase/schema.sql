-- END TIMES MONITOR - Database Schema
-- Supabase PostgreSQL + PostGIS

-- Enable PostGIS for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- =====================================================
-- EVENTS TABLE (Core)
-- =====================================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Lightweight fields (always loaded for map markers)
  lat FLOAT NOT NULL,
  lng FLOAT NOT NULL,
  category TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'ELEVATED', 'HIGH')),
  
  -- Full data (loaded on-demand when marker clicked)
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  source_name TEXT,
  source_type TEXT,
  source_url TEXT,
  conflict_level TEXT,
  
  -- Timestamps
  event_timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Flexible metadata (JSONB for any additional data)
  metadata JSONB DEFAULT '{}'::jsonb
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Geospatial index for bbox queries (CRITICAL for map performance)
CREATE INDEX IF NOT EXISTS events_location_gist_idx 
ON events USING GIST (
  ST_SetSRID(ST_MakePoint(lng, lat), 4326)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS events_severity_idx ON events (severity);
CREATE INDEX IF NOT EXISTS events_category_idx ON events (category);
CREATE INDEX IF NOT EXISTS events_timestamp_idx ON events (event_timestamp DESC);
CREATE INDEX IF NOT EXISTS events_created_idx ON events (created_at DESC);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS events_composite_idx 
ON events (severity, category, event_timestamp DESC);

-- =====================================================
-- EVENT SOURCES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS event_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL, -- 'API', 'RSS', 'SCRAPER', 'WEBHOOK'
  enabled BOOLEAN DEFAULT true,
  last_fetch TIMESTAMPTZ,
  last_status TEXT, -- 'active', 'error', 'disabled'
  error_message TEXT,
  event_count INT DEFAULT 0,
  config JSONB DEFAULT '{}'::jsonb, -- API keys, endpoints, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for events table
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for event_sources table
DROP TRIGGER IF NOT EXISTS update_event_sources_updated_at ON event_sources;
CREATE TRIGGER update_event_sources_updated_at
    BEFORE UPDATE ON event_sources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_sources ENABLE ROW LEVEL SECURITY;

-- Public read for events (situational awareness is public)
DROP POLICY IF EXISTS "Events are viewable by everyone" ON events;
CREATE POLICY "Events are viewable by everyone"
  ON events FOR SELECT
  USING (true);

-- Only service role can insert/update/delete events
DROP POLICY IF EXISTS "Only service role can modify events" ON events;
CREATE POLICY "Only service role can modify events"
  ON events FOR ALL
  USING (auth.role() = 'service_role');

-- Sources visible to all
DROP POLICY IF EXISTS "Sources viewable by all" ON event_sources;
CREATE POLICY "Sources viewable by all"
  ON event_sources FOR SELECT
  USING (true);

-- Only service role can modify sources
DROP POLICY IF EXISTS "Only service role can modify sources" ON event_sources;
CREATE POLICY "Only service role can modify sources"
  ON event_sources FOR ALL
  USING (auth.role() = 'service_role');

-- =====================================================
-- SAMPLE DATA (for testing)
-- =====================================================

INSERT INTO event_sources (name, type, enabled, config) VALUES
  ('NASA EONET', 'API', true, '{"endpoint": "https://eonet.gsfc.nasa.gov/api/v3/events"}'::jsonb),
  ('GDACS', 'RSS', true, '{"endpoint": "https://www.gdacs.org/xml/rss.xml"}'::jsonb),
  ('ACLED', 'API', false, '{"requiresAuth": true}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Sample events (optional - remove in production)
-- INSERT INTO events (lat, lng, category, severity, title, location, source_name, event_timestamp) VALUES
--   (40.7128, -74.0060, 'CONFLICT', 'MEDIUM', 'Sample Event NYC', 'New York', 'Manual', NOW()),
--   (51.5074, -0.1278, 'PROPHETIC', 'LOW', 'Sample Event London', 'London', 'Manual', NOW());

-- =====================================================
-- UTILITY VIEWS
-- =====================================================

-- Recent High Priority Events
CREATE OR REPLACE VIEW recent_high_priority AS
SELECT * FROM events
WHERE severity IN ('HIGH', 'ELEVATED')
ORDER BY event_timestamp DESC
LIMIT 100;

-- Event Count by Category
CREATE OR REPLACE VIEW events_by_category AS
SELECT 
  category,
  severity,
  COUNT(*) as count,
  MAX(event_timestamp) as most_recent
FROM events
GROUP BY category, severity
ORDER BY count DESC;

-- =====================================================
-- DONE
-- =====================================================
-- Schema ready! Next: Create Supabase client in app
