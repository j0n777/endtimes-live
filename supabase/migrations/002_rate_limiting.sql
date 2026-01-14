-- =====================================================
-- RATE LIMIT LOG TABLE
-- Tracks all API requests for rate limiting enforcement
-- =====================================================

CREATE TABLE IF NOT EXISTS rate_limit_log (
  id BIGSERIAL PRIMARY KEY,
  collector_name TEXT NOT NULL,
  request_timestamp TIMESTAMPTZ DEFAULT NOW(),
  success BOOLEAN NOT NULL,
  response_time_ms INT,
  error_message TEXT,
  
  -- For future IP-based rate limiting
  client_ip INET,
  
  CONSTRAINT fk_collector 
    FOREIGN KEY (collector_name) 
    REFERENCES collector_status(collector_name)
    ON DELETE CASCADE
);

-- Indexes for rate limiting queries (critical for performance)
CREATE INDEX IF NOT EXISTS rate_limit_log_collector_timestamp_idx 
ON rate_limit_log (collector_name, request_timestamp DESC);

CREATE INDEX IF NOT EXISTS rate_limit_log_timestamp_idx 
ON rate_limit_log (request_timestamp DESC);

-- Index for IP-based rate limiting (future use)
CREATE INDEX IF NOT EXISTS rate_limit_log_ip_timestamp_idx 
ON rate_limit_log (client_ip, request_timestamp DESC)
WHERE client_ip IS NOT NULL;

-- Partial index for error analysis
CREATE INDEX IF NOT EXISTS rate_limit_log_errors_idx 
ON rate_limit_log (collector_name, request_timestamp DESC)
WHERE success = false;

-- Auto-cleanup old logs (keep last 30 days)
-- This prevents table bloat while maintaining enough history for analysis
CREATE OR REPLACE FUNCTION cleanup_old_rate_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limit_log 
  WHERE request_timestamp < NOW() - INTERVAL '30 days';
  
  RAISE NOTICE 'Cleaned up rate_limit_log entries older than 30 days';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run cleanup (if pg_cron is available)
-- Note: This requires pg_cron extension, fallback to manual cleanup if not available
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
    -- Schedule weekly cleanup on Sundays at 2 AM
    PERFORM cron.schedule(
      'cleanup-rate-logs',
      '0 2 * * 0',
      'SELECT cleanup_old_rate_logs();'
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron not available, cleanup must be run manually';
END;
$$;

-- Helper function: Check rate limit for a collector
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_collector_name TEXT,
  p_time_window_seconds INT,
  p_max_requests INT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_request_count INT;
BEGIN
  SELECT COUNT(*) INTO v_request_count
  FROM rate_limit_log
  WHERE collector_name = p_collector_name
    AND request_timestamp > NOW() - (p_time_window_seconds || ' seconds')::INTERVAL;
  
  RETURN v_request_count < p_max_requests;
END;
$$ LANGUAGE plpgsql;

-- Helper function: Get request count for time window
CREATE OR REPLACE FUNCTION get_request_count(
  p_collector_name TEXT,
  p_time_window_seconds INT
)
RETURNS INT AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM rate_limit_log
  WHERE collector_name = p_collector_name
    AND request_timestamp > NOW() - (p_time_window_seconds || ' seconds')::INTERVAL;
  
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE rate_limit_log IS 'Logs all API requests for rate limiting and monitoring';
COMMENT ON FUNCTION check_rate_limit IS 'Check if a collector is within rate limits for a given time window';
COMMENT ON FUNCTION get_request_count IS 'Get number of requests in a time window';
