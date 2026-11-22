// Rate limiting for tools/call. Discovery (initialize, server/discover, tools/list, ping)
// is never counted. Fixed windows, checked in order: the caller's own budget first, the
// global ceiling last, so a caller that is already over its own budget does not consume
// the shared one.
//
// Storage: memory by default (per instance, resets when the instance is recycled).
// With MCP_RATE_LIMIT_BACKEND=postgres and the migration 008_mcp_rate_limit.sql applied,
// counters are shared by every instance; any failure there falls back to memory.
//
// The caller's address is only used to derive the counter key. It is hashed before it is
// used as a key, never logged, and never stored outside the counter row, which expires
// with its window.

import type { Clock } from './cache.ts';

export interface RateLimits {
    /** tools/call per minute, per caller address. */
    perMinute: number;
    /** tools/call per hour, per caller address. */
    perHour: number;
    /** tools/call per minute for the shared egress pool of hosted assistants (one bucket). */
    poolPerMinute: number;
    /** tools/call per minute, all callers together. */
    globalPerMinute: number;
}

export const DEFAULT_LIMITS: RateLimits = {
    perMinute: 30,
    perHour: 300,
    poolPerMinute: 600,
    globalPerMinute: 900,
};

export interface Rule {
    bucket: string;
    limit: number;
    windowSeconds: number;
}

export interface Verdict {
    allowed: boolean;
    retryAfterSeconds: number;
}

export interface LimitStore {
    /** Counts one hit per rule, in order, and stops at the first rule that is over its limit. */
    hit(rules: Rule[], nowMs: number): Promise<Verdict>;
}

export class MemoryStore implements LimitStore {
    private counters = new Map<string, { count: number; expires: number }>();

    constructor(private maxKeys = 20_000) {}

    get size(): number {
        return this.counters.size;
    }

    hit(rules: Rule[], nowMs: number): Promise<Verdict> {
        const nowSec = Math.floor(nowMs / 1000);
        for (const rule of rules) {
            const start = Math.floor(nowSec / rule.windowSeconds) * rule.windowSeconds;
            const key = `${rule.bucket}|${rule.windowSeconds}|${start}`;
            const entry = this.counters.get(key) ?? { count: 0, expires: start + rule.windowSeconds };
            entry.count++;
            this.counters.set(key, entry);
            if (entry.count > rule.limit) {
                return Promise.resolve({ allowed: false, retryAfterSeconds: Math.max(1, entry.expires - nowSec) });
            }
        }
        if (this.counters.size > this.maxKeys) this.sweep(nowSec);
        return Promise.resolve({ allowed: true, retryAfterSeconds: 0 });
    }

    private sweep(nowSec: number): void {
        for (const [k, e] of this.counters) if (e.expires <= nowSec) this.counters.delete(k);
        // Under a flood of distinct keys, keep the newest half.
        if (this.counters.size > this.maxKeys) {
            let drop = this.counters.size - Math.floor(this.maxKeys / 2);
            for (const k of this.counters.keys()) {
                if (drop-- <= 0) break;
                this.counters.delete(k);
            }
        }
    }
}

/** Durable counters through the SQL function public.mcp_rate_hit (service role only). */
export class PostgresStore implements LimitStore {
    constructor(
        private fetchFn: typeof fetch,
        private supabaseUrl: string,
        private serviceKey: string,
        private timeoutMs = 1500,
    ) {}

    async hit(rules: Rule[], _nowMs: number): Promise<Verdict> {
        const res = await this.fetchFn(`${this.supabaseUrl}/rest/v1/rpc/mcp_rate_hit`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                apikey: this.serviceKey,
                authorization: `Bearer ${this.serviceKey}`,
            },
            body: JSON.stringify({
                p_buckets: rules.map(r => r.bucket),
                p_windows: rules.map(r => r.windowSeconds),
                p_limits: rules.map(r => r.limit),
            }),
            signal: AbortSignal.timeout(this.timeoutMs),
        });
        if (!res.ok) throw new Error(`rate limit store answered ${res.status}`);
        const body = await res.json();
        const row = Array.isArray(body) ? body[0] : body;
        if (!row || typeof row.allowed !== 'boolean') throw new Error('rate limit store answered an unexpected shape');
        return { allowed: row.allowed, retryAfterSeconds: Math.max(row.allowed ? 0 : 1, Number(row.retry_after) || 0) };
    }
}

// Addresses hosted assistants call from. Many end users share them, so they get one
// larger bucket instead of the per-address budget. Source: Anthropic "IP addresses" page,
// outbound IPv4 ranges, read on 2026-11-22. Used only to pick a budget, never to block.
export const SHARED_POOL_CIDRS = ['160.79.104.0/21', '153.61.208.0/20'];

function ipv4ToInt(ip: string): number | null {
    const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(ip);
    if (!m) return null;
    const parts = m.slice(1).map(Number);
    if (parts.some(p => p > 255)) return null;
    return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

export function inCidr(ip: string, cidr: string): boolean {
    const [base, bitsText] = cidr.split('/');
    const ipInt = ipv4ToInt(ip);
    const baseInt = ipv4ToInt(base);
    const bits = Number(bitsText);
    if (ipInt === null || baseInt === null || !(bits >= 0 && bits <= 32)) return false;
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    return (ipInt & mask) === (baseInt & mask);
}

const isIp = (s: string): boolean => ipv4ToInt(s) !== null || (/^[0-9a-f:.]+$/i.test(s) && s.includes(':') && s.length <= 45);

function isPrivate(ip: string): boolean {
    const v4 = ipv4ToInt(ip);
    if (v4 !== null) {
        return ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', '127.0.0.0/8', '169.254.0.0/16', '100.64.0.0/10', '0.0.0.0/8']
            .some(c => inCidr(ip, c));
    }
    const lower = ip.toLowerCase();
    return lower === '::1' || lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('fe80');
}

/**
 * The caller's address, from headers the platform sets.
 *
 * Supabase Edge Functions sit behind Cloudflare. `cf-connecting-ip` is written by
 * Cloudflare itself and replaces anything the caller sent under that name. As a fallback,
 * the rightmost public entry of `x-forwarded-for` is the one appended by the nearest
 * trusted proxy; entries to its left are whatever the caller typed, so they are ignored.
 * No custom header is trusted. Returns null when neither yields an address; such callers
 * share one bucket.
 */
export function clientIp(headers: Headers): string | null {
    const cf = headers.get('cf-connecting-ip')?.trim();
    if (cf && isIp(cf)) return cf.toLowerCase();
    const xff = headers.get('x-forwarded-for');
    if (xff) {
        const entries = xff.split(',').map(s => s.trim()).filter(Boolean);
        for (let i = entries.length - 1; i >= 0; i--) {
            if (isIp(entries[i]) && !isPrivate(entries[i])) return entries[i].toLowerCase();
        }
    }
    return null;
}

/** IPv6 callers are counted per /64 network, since one host can use any address inside it. */
export function addressForCounting(ip: string): string {
    if (!ip.includes(':')) return ip;
    const [head, tail = ''] = ip.toLowerCase().split('::');
    const left = head ? head.split(':') : [];
    const right = tail ? tail.split(':') : [];
    const groups = ip.includes('::') ? [...left, ...new Array(Math.max(0, 8 - left.length - right.length)).fill('0'), ...right] : left;
    return `${groups.slice(0, 4).map(g => g.replace(/^0+(?=.)/, '')).join(':')}::/64`;
}

async function sha256Hex(text: string): Promise<string> {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}

export interface LimiterOptions {
    limits?: RateLimits;
    store?: LimitStore;
    /** Secret mixed into the hashed counter key. Set MCP_RATE_SALT when counters are stored in Postgres. */
    salt?: string;
    clock?: Clock;
}

export class RateLimiter {
    readonly limits: RateLimits;
    private store: LimitStore | undefined;
    private memory = new MemoryStore();
    private salt: string;
    private clock: Clock;

    constructor(options: LimiterOptions = {}) {
        this.limits = options.limits ?? DEFAULT_LIMITS;
        this.store = options.store;
        this.salt = options.salt ?? 'endtimes-mcp';
        this.clock = options.clock ?? Date.now;
    }

    async rulesFor(ip: string | null): Promise<Rule[]> {
        const global: Rule = { bucket: 'all', limit: this.limits.globalPerMinute, windowSeconds: 60 };
        if (ip && SHARED_POOL_CIDRS.some(c => inCidr(ip, c))) {
            return [{ bucket: 'pool', limit: this.limits.poolPerMinute, windowSeconds: 60 }, global];
        }
        const bucket = ip ? `ip:${(await sha256Hex(`${this.salt}|${addressForCounting(ip)}`)).slice(0, 32)}` : 'ip:unknown';
        return [
            { bucket, limit: this.limits.perMinute, windowSeconds: 60 },
            { bucket, limit: this.limits.perHour, windowSeconds: 3600 },
            global,
        ];
    }

    /** Counts one tools/call for this caller and says whether it may proceed. */
    async check(headers: Headers): Promise<Verdict> {
        const rules = await this.rulesFor(clientIp(headers));
        const now = this.clock();
        if (this.store) {
            try {
                return await this.store.hit(rules, now);
            } catch {
                // Durable store missing or down: keep serving with per-instance counters.
            }
        }
        return this.memory.hit(rules, now);
    }
}
