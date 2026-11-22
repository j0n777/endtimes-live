// Response shaping: the shared envelope, tool errors, cursors, the size budget and the
// allowlist of fields that may leave the server. Every field in a response is copied by
// name from the source row; nothing is spread or passed through, so a column added to the
// database later cannot leak by accident.

import {
    EVENT_CATEGORIES, EVENT_SEVERITIES, EXCERPT_MAX, LEGACY_CATEGORY, NOTICE, SERVER_TITLE, SITE_URL,
    type EventCategory, type EventSeverity,
} from './facts.ts';

/** Hard cap on the text of one tool response. Lists shrink by whole items to fit. */
export const MAX_RESPONSE_CHARS = 25_000;

export interface Source {
    name: string;
    url: string;
    origin?: string;
}

export interface Envelope {
    data: unknown;
    updated_at: string;
    stale?: boolean;
    source: Source;
    notice: string;
    message?: string;
    total?: number;
    has_more?: boolean;
    next_cursor?: string;
    [extra: string]: unknown;
}

export interface ToolResult {
    content: { type: 'text'; text: string }[];
    isError: boolean;
}

export type ErrorCode = 'invalid_input' | 'not_found' | 'invalid_cursor' | 'rate_limited' | 'source_unavailable' | 'internal_error';

export class ToolError extends Error {
    constructor(public code: ErrorCode, message: string, public retryAfterSeconds?: number) {
        super(message);
    }
}

export const SITE_SOURCE: Source = { name: SERVER_TITLE, url: `${SITE_URL}/` };

export function success(envelope: Omit<Envelope, 'notice'>): ToolResult {
    const full = { ...envelope, notice: NOTICE };
    return { content: [{ type: 'text', text: JSON.stringify(full) }], isError: false };
}

export function failure(code: ErrorCode, message: string, retryAfterSeconds?: number): ToolResult {
    const error: Record<string, unknown> = { code, message };
    if (retryAfterSeconds !== undefined) error.retry_after_seconds = retryAfterSeconds;
    return { content: [{ type: 'text', text: JSON.stringify({ error }) }], isError: true };
}

export function rateLimited(retryAfterSeconds: number): ToolResult {
    const s = Math.max(1, Math.ceil(retryAfterSeconds));
    return failure('rate_limited', `Rate limit reached. Try again in ${s} second${s === 1 ? '' : 's'}.`, s);
}

/**
 * Builds a list response that fits the size budget by returning fewer whole items.
 * `build(n)` must return the envelope for the first n items (with has_more and
 * next_cursor already adjusted for that n).
 */
export function fitToBudget(count: number, build: (n: number) => Omit<Envelope, 'notice'>): ToolResult {
    const fits = (r: ToolResult): boolean => r.content[0].text.length <= MAX_RESPONSE_CHARS;
    const all = success(build(count));
    if (fits(all) || count <= 1) return all;
    // Largest number of whole items that fits (binary search; a single item always goes out).
    let low = 1, high = count - 1, best = success(build(1));
    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const candidate = success(build(mid));
        if (fits(candidate)) { best = candidate; low = mid + 1; } else high = mid - 1;
    }
    return best;
}

// ── cursors ───────────────────────────────────────────────────────────────────

function b64urlEncode(text: string): string {
    const bytes = new TextEncoder().encode(text);
    let bin = '';
    for (const b of bytes) bin += String.fromCharCode(b);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(text: string): string {
    const bin = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
    return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
}

export const encodeCursor = (value: Record<string, string>): string => b64urlEncode(JSON.stringify(value));

const BAD_CURSOR = 'The cursor is not valid. Call again without cursor to start from the first page.';

export function decodeCursor(cursor: string): Record<string, unknown> {
    try {
        const parsed = JSON.parse(b64urlDecode(cursor));
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
    } catch {
        // fall through
    }
    throw new ToolError('invalid_cursor', BAD_CURSOR);
}

export const UUID_PATTERN = '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
const UUID_RE = new RegExp(UUID_PATTERN);

export interface EventCursor {
    t: string;
    i: string;
}

export function decodeEventCursor(cursor: string): EventCursor {
    const c = decodeCursor(cursor);
    if (typeof c.t !== 'string' || typeof c.i !== 'string' || !UUID_RE.test(c.i) || Number.isNaN(Date.parse(c.t))
        || !/^[0-9T:.+\-Z]{10,40}$/.test(c.t)) {
        throw new ToolError('invalid_cursor', BAD_CURSOR);
    }
    return { t: c.t, i: c.i.toLowerCase() };
}

export function decodeDateCursor(cursor: string): string {
    const c = decodeCursor(cursor);
    if (typeof c.d !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(c.d)) throw new ToolError('invalid_cursor', BAD_CURSOR);
    return c.d;
}

// ── text helpers ──────────────────────────────────────────────────────────────

const clean = (value: unknown): string =>
    (typeof value === 'string' ? value : '').replace(/<[^>]*>?/g, ' ').replace(/\s+/g, ' ').trim();

/** Cuts at a word boundary, never mid-word when a space is near. */
export function clipText(value: unknown, max: number): string {
    const text = clean(value);
    if (text.length <= max) return text;
    const cut = text.slice(0, max - 3);
    const space = cut.lastIndexOf(' ');
    return `${cut.slice(0, space > max - 40 ? space : cut.length)}...`;
}

const isoOrNull = (value: unknown): string | null => {
    if (typeof value !== 'string') return null;
    const ms = Date.parse(value);
    return Number.isNaN(ms) ? null : new Date(ms).toISOString();
};

const numOrNull = (value: unknown): number | null => (typeof value === 'number' && Number.isFinite(value) ? value : null);

function publicUrl(value: unknown): string | null {
    if (typeof value !== 'string' || value.length > 500) return null;
    try {
        const u = new URL(value);
        return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : null;
    } catch {
        return null;
    }
}

// ── events ────────────────────────────────────────────────────────────────────

/** Columns requested from the events table. Nothing else is ever selected. */
export const EVENT_COLUMNS = [
    'id', 'title', 'description', 'category', 'severity', 'location', 'lat', 'lng',
    'event_timestamp', 'updated_at', 'source_name', 'source_type', 'source_url',
] as const;

/** Kinds of source the server republishes: press and agency feeds and the site's own entries.
 *  Posts collected from messaging channels and social accounts are left out. */
export const PUBLIC_SOURCE_TYPES = ['RSS', 'NEWS', 'OFFICIAL', 'GOV_OFFICIAL', 'MANUAL'] as const;

const CHANNEL_HOSTS = ['t.me', 'telegram.me', 'telegram.org', 'x.com', 'twitter.com'];

export interface PublicEvent {
    id: string;
    title: string;
    excerpt: string;
    category: EventCategory;
    severity: EventSeverity;
    location: string | null;
    lat: number | null;
    lng: number | null;
    occurred_at: string | null;
    source: { name: string; url: string | null };
}

export type RawRow = Record<string, unknown>;

/** Maps a database row to the public shape, or null when the row must not be served. */
export function shapeEvent(row: RawRow): PublicEvent | null {
    if (typeof row.id !== 'string' || !UUID_RE.test(row.id)) return null;
    const sourceType = typeof row.source_type === 'string' ? row.source_type.toUpperCase() : '';
    if (!(PUBLIC_SOURCE_TYPES as readonly string[]).includes(sourceType)) return null;

    const sourceName = clipText(row.source_name, 80);
    const url = publicUrl(row.source_url);
    if (sourceName.startsWith('@')) return null;
    if (url) {
        const host = new URL(url).hostname.toLowerCase();
        if (CHANNEL_HOSTS.some(h => host === h || host.endsWith(`.${h}`))) return null;
    }

    const rawCategory = typeof row.category === 'string' ? row.category.toUpperCase() : '';
    const category = LEGACY_CATEGORY[rawCategory]
        ?? ((EVENT_CATEGORIES as readonly string[]).includes(rawCategory) ? rawCategory as EventCategory : 'OTHER');
    const rawSeverity = typeof row.severity === 'string' ? row.severity.toUpperCase() : '';
    const severity = rawSeverity === 'CRITICAL' ? 'HIGH'
        : (EVENT_SEVERITIES as readonly string[]).includes(rawSeverity) ? rawSeverity as EventSeverity : 'LOW';

    const lat = numOrNull(row.lat);
    const lng = numOrNull(row.lng);
    return {
        id: row.id.toLowerCase(),
        title: clipText(row.title, 200),
        excerpt: clipText(row.description, EXCERPT_MAX),
        category,
        severity,
        location: clipText(row.location, 120) || null,
        lat: lat === null ? null : Math.round(lat * 100) / 100,
        lng: lng === null ? null : Math.round(lng * 100) / 100,
        occurred_at: isoOrNull(row.event_timestamp),
        source: { name: sourceName || 'Unknown source', url },
    };
}

/** Newest row update among the rows, as ISO, or null. */
export function latestUpdate(rows: RawRow[]): string | null {
    let max = -Infinity;
    for (const r of rows) {
        const ms = typeof r.updated_at === 'string' ? Date.parse(r.updated_at) : NaN;
        const fallback = typeof r.event_timestamp === 'string' ? Date.parse(r.event_timestamp) : NaN;
        const best = Number.isNaN(ms) ? fallback : ms;
        if (!Number.isNaN(best) && best > max) max = best;
    }
    return max === -Infinity ? null : new Date(max).toISOString();
}

// ── signs ─────────────────────────────────────────────────────────────────────

/** Sign source names and spans come from live data; long dashes are flattened to plain ASCII. */
export const plainDashes = (value: unknown): string | null =>
    typeof value === 'string' ? value.replace(/\s*\u2014\s*/g, ': ').replace(/\s*\u2013\s*/g, ' to ').trim() : null;

export { isoOrNull, numOrNull, publicUrl };
