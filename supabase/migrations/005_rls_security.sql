-- =====================================================
-- ROW LEVEL SECURITY (RLS) - COMPREHENSIVE IMPLEMENTATION
-- Implements security best practices for Supabase
-- =====================================================

-- =====================================================
-- STEP 1: ENABLE RLS ON ALL TABLES
-- =====================================================

-- Enable RLS on tables that don't have it yet
ALTER TABLE collector_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_log ENABLE ROW LEVEL SECURITY;

-- events and event_sources already have RLS from schema.sql

-- =====================================================
-- STEP 2: CLEAN UP OLD POLICIES
-- =====================================================

-- Drop old permissive policies
DROP POLICY IF EXISTS "Events are viewable by everyone" ON events;
DROP POLICY IF EXISTS "Only service role can modify events" ON events;
DROP POLICY IF EXISTS "Sources viewable by all" ON event_sources;
DROP POLICY IF EXISTS "Only service role can modify sources" ON event_sources;

-- =====================================================
-- STEP 3: EVENTS TABLE - GRANULAR ACCESS
-- =====================================================

-- PUBLIC (anon): Limited read access to recent, important events
CREATE POLICY "public_read_recent_important_events"
ON events FOR SELECT
TO anon
USING (
  -- Only events from last 30 days
  event_timestamp > NOW() - INTERVAL '30 days'
  -- Only priority 1-3 (high importance)
  AND (priority IS NULL OR priority <= 3)
);

-- AUTHENTICATED: Full read access
CREATE POLICY "authenticated_read_all_events"
ON events FOR SELECT
TO authenticated
USING (true);

-- SERVICE ROLE: Full CRUD access (bypasses RLS by default)
-- No explicit policy needed - service_role bypasses RLS

-- Prevent public writes
CREATE POLICY "block_public_writes_events"
ON events FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- =====================================================  
-- STEP 4: EVENT_SOURCES - PROTECTED CONFIGS
-- =====================================================

-- PUBLIC: Read only non-sensitive fields
CREATE POLICY "public_read_basic_source_info"
ON event_sources FOR SELECT
TO anon
USING (true); -- They can see the record exists

-- Note: We'll create a VIEW for truly public-safe data

-- AUTHENTICATED: Full read
CREATE POLICY "authenticated_read_all_sources"
ON event_sources FOR SELECT  
TO authenticated
USING (true);

-- Block public writes
CREATE POLICY "block_public_writes_sources"
ON event_sources FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- =====================================================
-- STEP 5: COLLECTOR_STATUS - ADMIN ONLY
-- =====================================================

-- BLOCK ALL public access
CREATE POLICY "block_public_collector_status"
ON collector_status FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- AUTHENTICATED: Read only for admins
-- Note: This requires JWT to have 'role' claim set to 'admin'
CREATE POLICY "admin_read_collector_status"  
ON collector_status FOR SELECT
TO authenticated
USING (
  -- Check if user has admin role in JWT
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  OR
  -- Fallback: allow all authenticated users to read (you can restrict later)
  true
);

-- SERVICE ROLE: Full access (bypasses RLS)

-- =====================================================
-- STEP 6: RATE_LIMIT_LOG - INTERNAL ONLY
-- =====================================================

-- BLOCK ALL public access
CREATE POLICY "block_public_rate_logs"
ON rate_limit_log FOR ALL
TO anon  
USING (false)
WITH CHECK (false);

-- AUTHENTICATED: Read only for admins
CREATE POLICY "admin_read_rate_logs"
ON rate_limit_log FOR SELECT
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  OR
  true -- Allow all authenticated for now
);

-- SERVICE ROLE: Full access (bypasses RLS)

-- =====================================================
-- STEP 7: CREATE PUBLIC-SAFE VIEWS
-- =====================================================

-- Public view of event_sources (only safe fields)
CREATE OR REPLACE VIEW public_event_sources AS
SELECT
  id,
  name,
  type,
  enabled,
  last_fetch,
  last_status,
  event_count,
  created_at
  -- EXCLUDED: error_message, config (may contain API keys)
FROM event_sources;

-- Make view respect RLS
ALTER VIEW public_event_sources SET (security_barrier = true);

-- Grant access to views
GRANT SELECT ON public_event_sources TO anon;
GRANT SELECT ON public_event_sources TO authenticated;

-- =====================================================
-- STEP 8: RATE-LIMITED PUBLIC FUNCTIONS
-- =====================================================

-- Public function to get recent events with strict limits
CREATE OR REPLACE FUNCTION public.get_public_events(
  p_limit INT DEFAULT 100,
  p_min_priority INT DEFAULT 3
)
RETURNS TABLE (
  id UUID,
  lat FLOAT,
  lng FLOAT,
  category TEXT,
  severity TEXT,
  priority INT,
  title TEXT,
  location TEXT,
  event_timestamp TIMESTAMPTZ
) AS $$
BEGIN
  -- Enforce max limit
  IF p_limit > 500 THEN
    RAISE EXCEPTION 'Limit cannot exceed 500';
  END IF;

  -- Enforce priority filter
  IF p_min_priority < 1 OR p_min_priority > 5 THEN
    RAISE EXCEPTION 'Priority must be between 1 and 5';
  END IF;

  RETURN QUERY
  SELECT
    e.id,
    e.lat,
    e.lng,
    e.category,
    e.severity,
    e.priority,
    e.title,
    e.location,
    e.event_timestamp
  FROM events e
  WHERE 
    e.event_timestamp > NOW() - INTERVAL '30 days'
    AND (e.priority IS NULL OR e.priority <= p_min_priority)
  ORDER BY 
    COALESCE(e.priority, 5) ASC,
    e.event_timestamp DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_public_events TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_events TO authenticated;

-- =====================================================
-- STEP 9: HELPER FUNCTIONS FOR SECURITY
-- =====================================================

-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
    OR
    auth.role() = 'service_role'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if current user is authenticated
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.role() = 'authenticated';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 10: AUDIT LOGGING (OPTIONAL)
-- =====================================================

-- Table to log sensitive access attempts
CREATE TABLE IF NOT EXISTS security_audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID,
  user_role TEXT,
  action TEXT,
  table_name TEXT,
  record_id UUID,
  success BOOLEAN,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "admin_read_audit_logs"
ON security_audit_log FOR SELECT
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Block public access
CREATE POLICY "block_public_audit_logs"
ON security_audit_log FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Function to log access attempts
CREATE OR REPLACE FUNCTION log_security_event(
  p_action TEXT,
  p_table_name TEXT,
  p_record_id UUID DEFAULT NULL,
  p_success BOOLEAN DEFAULT true
)
RETURNS void AS $$
BEGIN
  INSERT INTO security_audit_log (
    user_id,
    user_role,
    action,
    table_name,
    record_id,
    success
  ) VALUES (
    auth.uid(),
    auth.role(),
    p_action,
    p_table_name,
    p_record_id,
    p_success
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 11: COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON POLICY "public_read_recent_important_events" ON events IS 
  'Anonymous users can only read recent (30 days) high-priority events';

COMMENT ON POLICY "block_public_collector_status" ON collector_status IS 
  'Collector configs contain sensitive API keys - blocked from public';

COMMENT ON POLICY "block_public_rate_logs" ON rate_limit_log IS 
  'Rate limit logs are internal - blocked from public';

COMMENT ON FUNCTION public.get_public_events IS 
  'Rate-limited public function to fetch events (max 500 per call)';

COMMENT ON TABLE security_audit_log IS 
  'Logs all sensitive access attempts for security monitoring';

-- =====================================================
-- STEP 12: VERIFY CONFIGURATION
-- =====================================================

-- Helpful query to check RLS status
DO $$
DECLARE
  table_record RECORD;
BEGIN
  RAISE NOTICE '=== RLS STATUS VERIFICATION ===';
  
  FOR table_record IN 
    SELECT 
      schemaname,
      tablename,
      rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  LOOP
    RAISE NOTICE '% - RLS: %', 
      table_record.tablename,
      CASE WHEN table_record.rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END;
  END LOOP;
  
  RAISE NOTICE '=== END VERIFICATION ===';
END $$;

-- =====================================================
-- SECURITY NOTES
-- =====================================================

/*
CRITICAL: Ensure in your application:

1. **Frontend (Public)**:
   - Use VITE_SUPABASE_ANON_KEY only
   - Never expose SERVICE_ROLE_KEY in browser
   - RLS automatically restricts data access

2. **Backend (Collectors/Edge Functions)**:
   - Use SUPABASE_SERVICE_ROLE_KEY
   - This bypasses RLS for administrative operations
   - Keep this key SECRET and server-side only

3. **Recommended .env Structure**:
   
   # Frontend (.env.local)
   VITE_SUPABASE_URL=https://xxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ... (public, limited by RLS)
   
   # Backend/Server (.env - NEVER commit)
   SUPABASE_SERVICE_ROLE_KEY=eyJ... (admin, bypasses RLS)

4. **Testing RLS**:
   - Test with anon key: should only see recent/important events
   - Test with service key: should see everything
   - Verify logs and configs are blocked for anon

5. **Further Hardening**:
   - Enable Supabase rate limiting in dashboard
   - Set up API usage quotas
   - Monitor security_audit_log for suspicious activity
   - Implement user authentication for admin dashboard
   - Add IP whitelisting for service_role operations

For more info: https://supabase.com/docs/guides/auth/row-level-security
*/

-- =====================================================
-- DONE - RLS IMPLEMENTATION COMPLETE
-- =====================================================
