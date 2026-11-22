// In-memory response cache, per function instance. Identical calls inside the TTL do not
// reach the database or the storage bucket, and concurrent identical calls share one
// upstream read. An instance can be recycled at any time, so this is a cost control,
// not a guarantee.

export type Clock = () => number;

interface Entry {
    value: unknown;
    expires: number;
}

/** Stable key for a tool call: argument order and repeated spaces do not create a new
 *  entry, and neither does the letter case of the arguments named in `caseInsensitive`
 *  (free-text filters the database matches in any case). Enum values arrive already
 *  canonical from validation; cursors and ids keep their case. */
export function cacheKey(scope: string, args: Record<string, string | number> = {}, caseInsensitive: readonly string[] = []): string {
    const parts = Object.keys(args).sort().map(k => {
        const v = args[k];
        if (typeof v !== 'string') return `${k}=${v}`;
        const text = v.trim().replace(/\s+/g, ' ');
        return `${k}=${encodeURIComponent(caseInsensitive.includes(k) ? text.toLowerCase() : text)}`;
    });
    return `${scope}?${parts.join('&')}`;
}

export class TtlCache {
    private entries = new Map<string, Entry>();
    private pending = new Map<string, Promise<unknown>>();

    constructor(private clock: Clock = Date.now, private maxEntries = 300) {}

    get size(): number {
        return this.entries.size;
    }

    /** Returns the cached value or runs `load` once. Failures are not cached. */
    async remember<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
        const now = this.clock();
        const hit = this.entries.get(key);
        if (hit && hit.expires > now) return hit.value as T;

        const inFlight = this.pending.get(key);
        if (inFlight) return inFlight as Promise<T>;

        const promise = load()
            .then(value => {
                this.store(key, value, this.clock() + ttlMs);
                return value;
            })
            .finally(() => this.pending.delete(key));
        this.pending.set(key, promise);
        return promise;
    }

    private store(key: string, value: unknown, expires: number): void {
        if (this.entries.size >= this.maxEntries) {
            const now = this.clock();
            for (const [k, e] of this.entries) if (e.expires <= now) this.entries.delete(k);
            // Still full: drop the oldest insertions (Map keeps insertion order).
            while (this.entries.size >= this.maxEntries) {
                const oldest = this.entries.keys().next().value;
                if (oldest === undefined) break;
                this.entries.delete(oldest);
            }
        }
        this.entries.set(key, { value, expires });
    }
}
