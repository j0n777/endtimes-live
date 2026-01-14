-- =====================================================
-- COLLECTOR STATUS TABLE
-- Tracks the state of each data collector
-- =====================================================

CREATE TABLE IF NOT EXISTS collector_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identifier
  collector_name TEXT UNIQUE NOT NULL,
  
  -- Configuration
  enabled BOOLEAN DEFAULT true,
  cache_duration_seconds INT NOT NULL,
  rate_limit_per_minute INT DEFAULT 60,
  rate_limit_per_day INT,
  rate_limit_per_year INT,
  max_retries INT DEFAULT 3,
  
  -- State
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_error_at TIMESTAMPTZ,
  last_error_message TEXT,
  
  -- Circuit breaker
  consecutive_failures INT DEFAULT 0,
  circuit_open BOOLEAN DEFAULT false,
  circuit_open_until TIMESTAMPTZ,
  circuit_breaker_threshold INT DEFAULT 5,
  circuit_breaker_timeout_seconds INT DEFAULT 1800,
  
  -- Statistics
  total_runs INT DEFAULT 0,
  total_successes INT DEFAULT 0,
  total_failures INT DEFAULT 0,
  total_events_collected INT DEFAULT 0,
  avg_response_time_ms INT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  config JSONB DEFAULT '{}'::jsonb
);

-- Index for scheduled runs
CREATE INDEX IF NOT EXISTS collector_status_next_run_idx 
ON collector_status (next_run_at) 
WHERE enabled = true AND circuit_open = false;

-- Index for monitoring
CREATE INDEX IF NOT EXISTS collector_status_health_idx 
ON collector_status (enabled, circuit_open, consecutive_failures);

-- Initialize collectors with recommended settings
INSERT INTO collector_status (
  collector_name, 
  cache_duration_seconds, 
  rate_limit_per_minute, 
  rate_limit_per_day,
  rate_limit_per_year,
  max_retries,
  circuit_breaker_threshold,
  circuit_breaker_timeout_seconds
) VALUES
  -- CRITICAL: ACLED has strictest limits
  ('ACLED', 86400, 1, 8, 3000, 2, 3, 7200),
  
  -- NASA FIRMS - Daily limit
  ('NASA_FIRMS', 10800, 10, 1000, NULL, 2, 5, 3600),
  
  -- Unlimited but should cache for efficiency
  ('NASA_EONET', 1800, 60, NULL, NULL, 3, 5, 1800),
  ('GDACS', 900, 60, NULL, NULL, 3, 5, 1800),
  ('WHO', 3600, 30, NULL, NULL, 3, 5, 1800),
  ('GDELT', 900, 20, NULL, NULL, 2, 5, 1800),
  ('POLYMARKET', 300, 60, NULL, NULL, 3, 5, 900),
  ('TELEGRAM', 60, 60, NULL, NULL, 3, 5, 600),
  ('WEATHER_NWS', 600, 30, NULL, NULL, 3, 5, 1800),
  
  -- Optional/Low priority
  ('CYBER_ATTACKS', 3600, 10, NULL, NULL, 2, 5, 1800),
  ('INTERNET_SHUTDOWNS', 3600, 10, NULL, NULL, 2, 5, 1800),
  ('VIX', 300, 60, NULL, NULL, 2, 3, 900),
  ('EMBASSY', 86400, 5, NULL, NULL, 2, 3, 3600),
  ('NOTAM', 3600, 10, NULL, NULL, 2, 3, 1800)
ON CONFLICT (collector_name) DO NOTHING;

-- Set initial next_run_at to now (so they all run on first cron trigger)
UPDATE collector_status 
SET next_run_at = NOW() 
WHERE next_run_at IS NULL;

COMMENT ON TABLE collector_status IS 'Tracks state and configuration of each data collector';
COMMENT ON COLUMN collector_status.cache_duration_seconds IS 'How long to cache results before fetching fresh data';
COMMENT ON COLUMN collector_status.rate_limit_per_year IS 'Annual rate limit (critical for ACLED with 3000/year)';
COMMENT ON COLUMN collector_status.circuit_open IS 'True when collector is temporarily disabled due to failures';
