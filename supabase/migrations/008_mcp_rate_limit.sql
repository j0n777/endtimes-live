-- Shared rate-limit counters for the MCP server (supabase/functions/mcp).
--
-- OPTIONAL. The function works without this migration: it then counts per instance, in
-- memory. Apply it, and set the function secret MCP_RATE_LIMIT_BACKEND=postgres, to make
-- the limits hold across instances.
--
-- What is stored: one row per (bucket, window). A bucket is "all", "pool" or
-- "ip:" + a salted SHA-256 prefix of the caller address. No raw address, no tool name,
-- no arguments. Rows are deleted once their window is over.

CREATE TABLE IF NOT EXISTS public.mcp_rate_limit (
    bucket          text        NOT NULL,
    window_seconds  integer     NOT NULL,
    window_start    timestamptz NOT NULL,
    hits            integer     NOT NULL DEFAULT 0,
    PRIMARY KEY (bucket, window_seconds, window_start)
);

COMMENT ON TABLE public.mcp_rate_limit IS 'Rate-limit counters of the MCP server. Hashed keys only; rows expire with their window.';

-- No policies on purpose: with RLS on and no policy, only the service role can read or write.
ALTER TABLE public.mcp_rate_limit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mcp_rate_limit FROM PUBLIC, anon, authenticated;

-- Counts one hit per rule, in order, and stops at the first rule over its limit, so a
-- caller already over its own budget does not consume the shared one.
CREATE OR REPLACE FUNCTION public.mcp_rate_hit(p_buckets text[], p_windows integer[], p_limits integer[])
RETURNS TABLE (allowed boolean, retry_after integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_now   timestamptz := clock_timestamp();
    v_start timestamptz;
    v_hits  integer;
    i       integer;
BEGIN
    IF p_buckets IS NULL
       OR coalesce(array_length(p_buckets, 1), 0) = 0
       OR array_length(p_buckets, 1) > 8
       OR array_length(p_buckets, 1) IS DISTINCT FROM array_length(p_windows, 1)
       OR array_length(p_buckets, 1) IS DISTINCT FROM array_length(p_limits, 1) THEN
        RAISE EXCEPTION 'mcp_rate_hit: invalid arguments';
    END IF;

    -- About one call in fifty also removes finished windows.
    IF random() < 0.02 THEN
        DELETE FROM public.mcp_rate_limit
        WHERE window_start + make_interval(secs => window_seconds) < v_now;
    END IF;

    FOR i IN 1 .. array_length(p_buckets, 1) LOOP
        IF p_windows[i] IS NULL OR p_windows[i] < 1 OR p_windows[i] > 86400
           OR p_limits[i] IS NULL OR p_limits[i] < 1
           OR p_buckets[i] IS NULL OR length(p_buckets[i]) > 64 THEN
            RAISE EXCEPTION 'mcp_rate_hit: invalid rule';
        END IF;

        v_start := to_timestamp(floor(extract(epoch FROM v_now) / p_windows[i]) * p_windows[i]);

        INSERT INTO public.mcp_rate_limit AS r (bucket, window_seconds, window_start, hits)
        VALUES (p_buckets[i], p_windows[i], v_start, 1)
        ON CONFLICT (bucket, window_seconds, window_start) DO UPDATE SET hits = r.hits + 1
        RETURNING r.hits INTO v_hits;

        IF v_hits > p_limits[i] THEN
            RETURN QUERY SELECT false,
                greatest(1, ceil(extract(epoch FROM (v_start + make_interval(secs => p_windows[i]) - v_now)))::integer);
            RETURN;
        END IF;
    END LOOP;

    RETURN QUERY SELECT true, 0;
END;
$$;

-- Only the service role may call it: a visitor holding the public key must not be able
-- to inflate someone else's counter.
REVOKE EXECUTE ON FUNCTION public.mcp_rate_hit(text[], integer[], integer[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mcp_rate_hit(text[], integer[], integer[]) TO service_role;

-- Rollback:
--   DROP FUNCTION IF EXISTS public.mcp_rate_hit(text[], integer[], integer[]);
--   DROP TABLE IF EXISTS public.mcp_rate_limit;
