
-- Enable RLS on core tables
ALTER TABLE IF EXISTS events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS event_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS collector_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rate_limit_log ENABLE ROW LEVEL SECURITY;

-- 1. EVENTS POLICY
-- Public Read
DROP POLICY IF EXISTS "Public Read Events" ON events;
CREATE POLICY "Public Read Events" ON events FOR SELECT USING (true);

-- Service Role Write Only (Implicit deny for anon/authenticated)
DROP POLICY IF EXISTS "Service Write Events" ON events;
CREATE POLICY "Service Write Events" ON events FOR ALL USING (auth.role() = 'service_role');


-- 2. EVENT SOURCES POLICY
-- Public Read
DROP POLICY IF EXISTS "Public Read Sources" ON event_sources;
CREATE POLICY "Public Read Sources" ON event_sources FOR SELECT USING (true);

-- Service Role Write Only
DROP POLICY IF EXISTS "Service Write Sources" ON event_sources;
CREATE POLICY "Service Write Sources" ON event_sources FOR ALL USING (auth.role() = 'service_role');


-- 3. COLLECTOR STATUS POLICY
-- Public Read (for dashboard status)
DROP POLICY IF EXISTS "Public Read Status" ON collector_status;
CREATE POLICY "Public Read Status" ON collector_status FOR SELECT USING (true);

-- Service Role Write Only
DROP POLICY IF EXISTS "Service Write Status" ON collector_status;
CREATE POLICY "Service Write Status" ON collector_status FOR ALL USING (auth.role() = 'service_role');


-- 4. RATE LIMIT LOG POLICY
-- Private (Service Role Only)
DROP POLICY IF EXISTS "Service View Logs" ON rate_limit_log;
CREATE POLICY "Service View Logs" ON rate_limit_log FOR ALL USING (auth.role() = 'service_role');


-- 5. SECURE VIEWS check
-- Ensure views respect RLS of the invoker
ALTER VIEW events_by_category SET (security_invoker = true);
ALTER VIEW recent_high_priority SET (security_invoker = true);
-- Note: spatial_ref_sys is a PostGIS system table and usually stays public/unrestricted.

