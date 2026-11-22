// Data access. Read-only by construction: GET requests only, with the public
// (publishable) key, the same access an anonymous visitor of the site has. The service
// role key is never used here.
//
// Two origins: the public storage bucket where the collector publishes signs.json and
// signs-history.json, and the events table through the REST API with an explicit column
// list (never select=*), a LIMIT on every query and keyset pagination.

import { EVENT_COLUMNS, PUBLIC_SOURCE_TYPES, ToolError, type EventCursor, type RawRow } from './shape.ts';

export interface EventQuery {
    categories?: string[];
    severities?: string[];
    location?: string;
    text?: string;
    /** Inclusive lower bound, ISO timestamp. */
    since?: string;
    /** Exclusive upper bound, ISO timestamp. */
    before?: string;
    after?: EventCursor;
    limit: number;
}

export interface JsonFile {
    body: unknown;
    /** Last-Modified of the file, ISO, when the storage reports it. */
    lastModified: string | null;
}

export interface DataSource {
    signs(): Promise<JsonFile>;
    signsHistory(): Promise<JsonFile>;
    searchEvents(query: EventQuery): Promise<{ rows: RawRow[]; total: number | null }>;
    getEvent(id: string): Promise<RawRow | null>;
}

export interface HttpDataSourceOptions {
    fetchFn: typeof fetch;
    supabaseUrl: string;
    publishableKey: string;
    /** Base URL of the public data bucket. */
    dataBaseUrl: string;
    timeoutMs?: number;
}

const UNAVAILABLE = 'The data source did not answer. Try again in 60 seconds.';

/** Characters accepted in free-text filters. Keeps REST filter syntax out of user input. */
export const TEXT_FILTER_PATTERN = "^[\\p{L}\\p{N}][\\p{L}\\p{N} .'-]*$";

export function buildEventsUrl(supabaseUrl: string, q: EventQuery): string {
    const p = new URLSearchParams();
    p.set('select', EVENT_COLUMNS.join(','));
    p.set('source_type', `in.(${PUBLIC_SOURCE_TYPES.join(',')})`);
    if (q.categories?.length) p.set('category', `in.(${q.categories.join(',')})`);
    if (q.severities?.length) p.set('severity', `in.(${q.severities.join(',')})`);
    if (q.location) p.set('location', `ilike.*${q.location}*`);
    if (q.since) p.append('event_timestamp', `gte.${q.since}`);
    if (q.before) p.append('event_timestamp', `lt.${q.before}`);
    if (q.text) p.append('or', `(title.ilike."*${q.text}*",description.ilike."*${q.text}*")`);
    if (q.after) p.append('or', `(event_timestamp.lt."${q.after.t}",and(event_timestamp.eq."${q.after.t}",id.lt.${q.after.i}))`);
    p.set('order', 'event_timestamp.desc,id.desc');
    p.set('limit', String(q.limit));
    return `${supabaseUrl}/rest/v1/events?${p.toString()}`;
}

export function createHttpDataSource(options: HttpDataSourceOptions): DataSource {
    const { fetchFn, supabaseUrl, publishableKey, dataBaseUrl } = options;
    const timeoutMs = options.timeoutMs ?? 8000;

    async function get(url: string, headers: Record<string, string> = {}): Promise<Response> {
        let res: Response;
        try {
            res = await fetchFn(url, { method: 'GET', headers, signal: AbortSignal.timeout(timeoutMs) });
        } catch {
            throw new ToolError('source_unavailable', UNAVAILABLE, 60);
        }
        if (!res.ok) {
            await res.body?.cancel().catch(() => undefined);
            throw new ToolError('source_unavailable', UNAVAILABLE, 60);
        }
        return res;
    }

    async function json(res: Response): Promise<unknown> {
        try {
            return await res.json();
        } catch {
            throw new ToolError('source_unavailable', UNAVAILABLE, 60);
        }
    }

    async function file(name: string): Promise<JsonFile> {
        const res = await get(`${dataBaseUrl}/${name}`);
        const modified = res.headers.get('last-modified');
        const ms = modified ? Date.parse(modified) : NaN;
        return { body: await json(res), lastModified: Number.isNaN(ms) ? null : new Date(ms).toISOString() };
    }

    const restHeaders = { apikey: publishableKey, authorization: `Bearer ${publishableKey}`, accept: 'application/json' };

    return {
        signs: () => file('signs.json'),
        signsHistory: () => file('signs-history.json'),

        async searchEvents(query) {
            const res = await get(buildEventsUrl(supabaseUrl, query), { ...restHeaders, prefer: 'count=exact' });
            const body = await json(res);
            if (!Array.isArray(body)) throw new ToolError('source_unavailable', UNAVAILABLE, 60);
            const range = res.headers.get('content-range') ?? '';
            const total = /\/(\d+)$/.exec(range);
            return { rows: body as RawRow[], total: total ? Number(total[1]) : null };
        },

        async getEvent(id) {
            const p = new URLSearchParams();
            p.set('select', EVENT_COLUMNS.join(','));
            p.set('id', `eq.${id}`);
            p.set('source_type', `in.(${PUBLIC_SOURCE_TYPES.join(',')})`);
            p.set('limit', '1');
            const res = await get(`${supabaseUrl}/rest/v1/events?${p.toString()}`, restHeaders);
            const body = await json(res);
            if (!Array.isArray(body)) throw new ToolError('source_unavailable', UNAVAILABLE, 60);
            return (body[0] as RawRow | undefined) ?? null;
        },
    };
}
