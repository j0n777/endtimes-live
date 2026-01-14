-- Add rate limits for new collectors
INSERT INTO collector_status (collector_name, rate_limit_per_minute, enabled)
VALUES 
  ('TELEGRAM', 10, true),
  ('TWITTER', 10, true),
  ('WEATHER_NWS', 60, true),
  ('CYBER_ATTACKS', 10, true),
  ('VIX', 60, true),
  ('EMBASSY', 10, true),
  ('INTERNET_SHUTDOWNS', 10, true)
ON CONFLICT (collector_name) 
DO UPDATE SET 
  rate_limit_per_minute = EXCLUDED.rate_limit_per_minute,
  enabled = EXCLUDED.enabled;
