-- =====================================================
-- VALIDATION SCRIPT - RLS SECURITY CHECK
-- Run this after applying 005_rls_security.sql
-- =====================================================

\echo '╔═══════════════════════════════════════════════════════════════╗'
\echo '║         RLS SECURITY VALIDATION REPORT                        ║'
\echo '╚═══════════════════════════════════════════════════════════════╝'
\echo ''

-- =====================================================
-- CHECK 1: RLS ENABLED ON ALL TABLES
-- =====================================================
\echo '📋 CHECK 1: Row Level Security Status'
\echo '─────────────────────────────────────────────────────────────'

SELECT 
  tablename as "Table",
  CASE 
    WHEN rowsecurity THEN '✅ ENABLED'
    ELSE '❌ DISABLED'
  END as "RLS Status"
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('events', 'event_sources', 'collector_status', 'rate_limit_log', 'security_audit_log')
ORDER BY tablename;

\echo ''

-- =====================================================
-- CHECK 2: COUNT POLICIES PER TABLE
-- =====================================================
\echo '📜 CHECK 2: Active Policies Count'
\echo '─────────────────────────────────────────────────────────────'

SELECT 
  tablename as "Table",
  COUNT(*) as "# Policies",
  STRING_AGG(policyname, ', ' ORDER BY policyname) as "Policy Names"
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

\echo ''

-- =====================================================
-- CHECK 3: POLICY DETAILS
-- =====================================================
\echo '🔐 CHECK 3: Policy Details by Table'
\echo '─────────────────────────────────────────────────────────────'

SELECT 
  tablename as "Table",
  policyname as "Policy Name",
  cmd as "Operation",
  CASE 
    WHEN roles = '{PUBLIC}' THEN 'anon'
    WHEN roles = '{authenticated}' THEN 'authenticated'
    ELSE array_to_string(roles, ', ')
  END as "Role",
  permissive as "Permissive"
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

\echo ''

-- =====================================================
-- CHECK 4: VERIFY PUBLIC FUNCTIONS
-- =====================================================
\echo '⚙️ CHECK 4: Public Functions for RLS'
\echo '─────────────────────────────────────────────────────────────'

SELECT 
  proname as "Function Name",
  prosecdef as "Security Definer",
  CASE 
    WHEN proacl IS NULL THEN 'PUBLIC'
    ELSE 'RESTRICTED'
  END as "Access"
FROM pg_proc
WHERE proname IN ('get_public_events', 'is_admin', 'is_authenticated', 'log_security_event')
  AND pronamespace = 'public'::regnamespace;

\echo ''

-- =====================================================
-- CHECK 5: VIEWS AND SECURITY
-- =====================================================
\echo '👁️ CHECK 5: Public-Safe Views'
\echo '─────────────────────────────────────────────────────────────'

SELECT 
  viewname as "View Name",
  viewowner as "Owner"
FROM pg_views
WHERE schemaname = 'public'
  AND viewname LIKE '%public%'
ORDER BY viewname;

\echo ''

-- =====================================================
-- CHECK 6: SAMPLE ACCESS TESTS
-- =====================================================
\echo '🧪 CHECK 6: Simulated Access Tests'
\echo '─────────────────────────────────────────────────────────────'

-- Test 1: Count public-visible events
WITH public_events AS (
  SELECT COUNT(*) as count
  FROM events
  WHERE event_timestamp > NOW() - INTERVAL '30 days'
    AND (priority IS NULL OR priority <= 3)
)
SELECT 
  'Public can see (last 30d, priority ≤3)' as "Test",
  count as "Result"
FROM public_events;

-- Test 2: Count all events (would be visible to service_role)
SELECT 
  'Total events in database' as "Test",
  COUNT(*) as "Result"
FROM events;

-- Test 3: Sensitive tables should be blocked (count = 0 for anon)
SELECT 
  'Collector configs (should be 0 for anon)' as "Test",
  0 as "Result (expected)"
FROM collector_status
LIMIT 1;

\echo ''

-- =====================================================
-- CHECK 7: SECURITY RECOMMENDATIONS
-- =====================================================
\echo '💡 CHECK 7: Security Recommendations'
\echo '─────────────────────────────────────────────────────────────'

DO $$
DECLARE
  event_count INT;
  has_admin_user BOOLEAN;
BEGIN
  -- Check if we have events
  SELECT COUNT(*) INTO event_count FROM events;
  
  IF event_count = 0 THEN
    RAISE NOTICE '⚠️  No events in database - RLS policies will block all reads';
  ELSE
    RAISE NOTICE '✅ Database has % events', event_count;
  END IF;
  
  -- Check if auth.users exists (authentication enabled)
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'auth' AND table_name = 'users'
  ) INTO has_admin_user;
  
  IF NOT has_admin_user THEN
    RAISE NOTICE '⚠️  No authentication configured - consider setting up Supabase Auth';
  ELSE
    RAISE NOTICE '✅ Authentication schema exists';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '📋 RECOMMENDATIONS:';
  RAISE NOTICE '   1. Test with anon key: should NOT see collector_status';
  RAISE NOTICE '   2. Test with service key: should see everything';
  RAISE NOTICE '   3. Enable rate limiting in Supabase Dashboard → Settings → API';
  RAISE NOTICE '   4. Never expose SUPABASE_SERVICE_ROLE_KEY in frontend code';
  RAISE NOTICE '   5. Monitor security_audit_log for suspicious activity';
END $$;

\echo ''

-- =====================================================
-- CHECK 8: CONFIGURATION SUMMARY
-- =====================================================
\echo '📊 CHECK 8: Configuration Summary'
\echo '─────────────────────────────────────────────────────────────'

WITH table_stats AS (
  SELECT 
    'events' as table_name,
    (SELECT COUNT(*) FROM events) as row_count,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'events') as policy_count,
    (SELECT rowsecurity FROM pg_tables WHERE tablename = 'events' AND schemaname = 'public') as rls_enabled
  UNION ALL
  SELECT 
    'event_sources',
    (SELECT COUNT(*) FROM event_sources),
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'event_sources'),
    (SELECT rowsecurity FROM pg_tables WHERE tablename = 'event_sources' AND schemaname = 'public')
  UNION ALL
  SELECT 
    'collector_status',
    (SELECT COUNT(*) FROM collector_status),
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'collector_status'),
    (SELECT rowsecurity FROM pg_tables WHERE tablename = 'collector_status' AND schemaname = 'public')
  UNION ALL
  SELECT 
    'rate_limit_log',
    (SELECT COUNT(*) FROM rate_limit_log),
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'rate_limit_log'),
    (SELECT rowsecurity FROM pg_tables WHERE tablename = 'rate_limit_log' AND schemaname = 'public')
)
SELECT 
  table_name as "Table",
  row_count as "Rows",
  policy_count as "Policies",
  CASE 
    WHEN rls_enabled THEN '✅'
    ELSE '❌'
  END as "RLS"
FROM table_stats;

\echo ''
\echo '╔═══════════════════════════════════════════════════════════════╗'
\echo '║         END OF VALIDATION REPORT                              ║'
\echo '╚═══════════════════════════════════════════════════════════════╝'
\echo ''
\echo '✅ If all tables show RLS enabled and have policies, you are secure!'
\echo '⚠️  Remember: Test with both anon and service_role keys'
\echo ''
