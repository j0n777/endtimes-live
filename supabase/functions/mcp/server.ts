// Wires the handler from configuration. Everything has a working default, so the
// function runs with no secrets set.
//
// Optional settings (function secrets or environment):
//   MCP_PUBLISHABLE_KEY          public key used for reads (default: the site's publishable key)
//   MCP_DATA_BASE_URL            base URL of the public data bucket
//   MCP_ALLOWED_ORIGINS          comma-separated browser origins, or * for any
//   MCP_RATE_PER_MINUTE, MCP_RATE_PER_HOUR, MCP_RATE_POOL_PER_MINUTE, MCP_RATE_GLOBAL_PER_MINUTE
//   MCP_RATE_LIMIT_BACKEND       "postgres" to share counters between instances
//                                (needs migration 008_mcp_rate_limit.sql); default: memory
//   MCP_RATE_SALT                secret mixed into the hashed counter keys
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by the platform. The service
// role key is read only for the counter function, never for tool data.

import { TtlCache, type Clock } from './cache.ts';
import { createHttpDataSource, type DataSource } from './data.ts';
import { DEFAULT_ALLOWED_ORIGINS, createHandler } from './handler.ts';
import { DEFAULT_LIMITS, PostgresStore, RateLimiter, type RateLimits } from './ratelimit.ts';

// Public by design: the same project URL and publishable key the site ships in lib/supabase.ts.
export const DEFAULT_SUPABASE_URL = 'https://bimfztwwzuwwefxfkkwe.supabase.co';
export const DEFAULT_PUBLISHABLE_KEY = 'sb_publishable_PIiYLrLVVl_-NPeoQulKQA_E6lx5uXv';

export type EnvReader = (name: string) => string | undefined;

function positiveInt(value: string | undefined, fallback: number): number {
    const n = Number(value);
    return value !== undefined && Number.isInteger(n) && n > 0 ? n : fallback;
}

export function limitsFromEnv(env: EnvReader): RateLimits {
    return {
        perMinute: positiveInt(env('MCP_RATE_PER_MINUTE'), DEFAULT_LIMITS.perMinute),
        perHour: positiveInt(env('MCP_RATE_PER_HOUR'), DEFAULT_LIMITS.perHour),
        poolPerMinute: positiveInt(env('MCP_RATE_POOL_PER_MINUTE'), DEFAULT_LIMITS.poolPerMinute),
        globalPerMinute: positiveInt(env('MCP_RATE_GLOBAL_PER_MINUTE'), DEFAULT_LIMITS.globalPerMinute),
    };
}

export interface ServerOptions {
    env?: EnvReader;
    fetchFn?: typeof fetch;
    clock?: Clock;
    /** Replaces the HTTP data source (tests). */
    data?: DataSource;
}

export function createServer(options: ServerOptions = {}): (req: Request) => Promise<Response> {
    const env = options.env ?? (() => undefined);
    const fetchFn = options.fetchFn ?? fetch;
    const clock = options.clock ?? Date.now;

    const supabaseUrl = (env('SUPABASE_URL') || DEFAULT_SUPABASE_URL).replace(/\/+$/, '');
    const data = options.data ?? createHttpDataSource({
        fetchFn,
        supabaseUrl,
        publishableKey: env('MCP_PUBLISHABLE_KEY') || DEFAULT_PUBLISHABLE_KEY,
        dataBaseUrl: (env('MCP_DATA_BASE_URL') || `${supabaseUrl}/storage/v1/object/public/data`).replace(/\/+$/, ''),
    });

    const serviceKey = env('SUPABASE_SERVICE_ROLE_KEY');
    const durable = env('MCP_RATE_LIMIT_BACKEND') === 'postgres' && serviceKey
        ? new PostgresStore(fetchFn, supabaseUrl, serviceKey)
        : undefined;

    const origins = env('MCP_ALLOWED_ORIGINS');
    return createHandler({
        context: { data, cache: new TtlCache(clock), clock },
        limiter: new RateLimiter({ limits: limitsFromEnv(env), store: durable, salt: env('MCP_RATE_SALT'), clock }),
        allowedOrigins: origins ? origins.split(',').map(o => o.trim()).filter(Boolean) : DEFAULT_ALLOWED_ORIGINS,
    });
}
