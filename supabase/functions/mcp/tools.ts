// The four read-only tools. Names are frozen once published; changes are additive.

import { cacheKey, TtlCache, type Clock } from './cache.ts';
import { TEXT_FILTER_PATTERN, type DataSource, type EventQuery } from './data.ts';
import {
    ANOMALY_PERCENTILE, EVENT_CATEGORIES, EVENT_LINK_TEMPLATE, EVENT_SEVERITIES, EXCERPT_MAX, LEGACY_CATEGORY,
    MIN_USABLE_SIGNS, OMEGA_METHOD, SIGN_IDS, SIGN_VALUE_WITHHELD, SIGNS, SITE_URL, TENSION_LABELS, TENSION_MEASURE,
    TENSION_SOURCE_NAME, signPageUrl, type SignId,
} from './facts.ts';
import type { Args, ObjectSchema } from './schema.ts';
import {
    SITE_SOURCE, ToolError, UUID_PATTERN, decodeDateCursor, decodeEventCursor, encodeCursor, fitToBudget, isoOrNull,
    latestUpdate, numOrNull, plainDashes, publicUrl, shapeEvent, success, type PublicEvent, type RawRow, type ToolResult,
} from './shape.ts';

export interface ToolContext {
    data: DataSource;
    cache: TtlCache;
    clock: Clock;
}

export interface ToolDefinition {
    name: string;
    title: string;
    description: string;
    inputSchema: ObjectSchema;
    annotations: { readOnlyHint: true; destructiveHint: false; idempotentHint: true; openWorldHint: false };
    run(args: Args, ctx: ToolContext): Promise<ToolResult>;
}

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } as const;

// Cache lifetimes. signs.json is published with max-age=60; the history gains one row a
// day; collectors add events every few minutes.
export const TTL = { signs: 60_000, history: 300_000, events: 60_000, event: 300_000 } as const;

/** A reading older than this means several collection cycles were missed. */
const SIGNS_STALE_MS = 2 * 60 * 60 * 1000;
const HISTORY_STALE_MS = 2 * 24 * 60 * 60 * 1000;
const EVENTS_STALE_MS = 6 * 60 * 60 * 1000;

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const levelOrNull = (v: unknown): number | null => (typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 5 ? v : null);
const UNAVAILABLE = new ToolError('source_unavailable', 'The data source did not answer. Try again in 60 seconds.', 60);

// ── endtimes_get_signs ────────────────────────────────────────────────────────

const SIGN_STATUSES = ['ok', 'short-baseline', 'unavailable', 'error'];

function shapeSign(id: SignId, raw: Record<string, unknown> | undefined) {
    const fact = SIGNS[id];
    const status = raw && typeof raw.status === 'string' && SIGN_STATUSES.includes(raw.status) ? raw.status : 'unavailable';
    const percentile = raw ? numOrNull(raw.percentile) : null;
    const withheld = SIGN_VALUE_WITHHELD.includes(id);
    const extra: Record<string, number> = {};
    if (raw && isObject(raw.extra) && !withheld) {
        for (const [k, v] of Object.entries(raw.extra)) if (/^[a-z][a-zA-Z0-9]{0,30}$/.test(k) && typeof v === 'number') extra[k] = v;
    }
    return {
        id,
        name: fact.name,
        scripture: fact.scripture,
        status,
        counted_in_omega: status === 'ok' && percentile !== null,
        value: raw && !withheld ? numOrNull(raw.value) : null,
        baseline_mean: raw && !withheld ? numOrNull(raw.baselineMean) : null,
        percentile,
        anomalous: status === 'ok' && percentile !== null && percentile >= ANOMALY_PERCENTILE,
        trend: raw && typeof raw.trend === 'string' && ['up', 'down', 'flat'].includes(raw.trend) ? raw.trend : null,
        period: raw && typeof raw.period === 'string' ? raw.period.slice(0, 40) : null,
        baseline_span: raw ? plainDashes(raw.baselineSpan)?.slice(0, 60) ?? null : null,
        ...(Object.keys(extra).length ? { extra } : {}),
        measure: fact.measure,
        source: {
            name: (raw && plainDashes(raw.sourceName)?.slice(0, 120)) || fact.name,
            url: (raw && publicUrl(raw.sourceUrl)) || signPageUrl(id),
        },
        page: signPageUrl(id),
    };
}

async function getSigns(_args: Args, ctx: ToolContext): Promise<ToolResult> {
    return ctx.cache.remember(cacheKey('signs'), TTL.signs, async () => {
        const file = await ctx.data.signs();
        const body = file.body;
        if (!isObject(body) || !Array.isArray(body.signs) || !isObject(body.omega)) throw UNAVAILABLE;
        const generatedAt = isoOrNull(body.generatedAt) ?? file.lastModified;
        if (!generatedAt) throw UNAVAILABLE;

        const byId = new Map<string, Record<string, unknown>>();
        for (const s of body.signs) if (isObject(s) && typeof s.id === 'string') byId.set(s.id, s);
        const signs = SIGN_IDS.map(id => shapeSign(id, byId.get(id)));

        const omega = body.omega;
        const tension = isObject(body.tension) ? body.tension : {};
        const tensionLevel = levelOrNull(tension.level);
        const anomalous = Array.isArray(omega.anomalous)
            ? omega.anomalous.filter((x): x is SignId => (SIGN_IDS as readonly string[]).includes(x as string))
            : [];

        return success({
            data: {
                omega: {
                    level: levelOrNull(omega.level),
                    scale: '1 to 5',
                    anomalous_signs: anomalous,
                    usable_signs: numOrNull(omega.usable),
                    rising_signs: numOrNull(omega.rising),
                    anomaly_percentile: ANOMALY_PERCENTILE,
                    min_usable_signs: MIN_USABLE_SIGNS,
                    method: OMEGA_METHOD.join(' '),
                },
                tension: {
                    level: tensionLevel,
                    label: tensionLevel ? TENSION_LABELS[tensionLevel - 1] : null,
                    scale: '1 to 5',
                    value: numOrNull(tension.value),
                    percentile: numOrNull(tension.percentile),
                    as_of: typeof tension.date === 'string' ? tension.date.slice(0, 10) : null,
                    measure: TENSION_MEASURE,
                    source: { name: TENSION_SOURCE_NAME, url: publicUrl(tension.sourceUrl) ?? `${SITE_URL}/en/about/` },
                },
                signs,
            },
            updated_at: generatedAt,
            ...(ctx.clock() - Date.parse(generatedAt) > SIGNS_STALE_MS ? { stale: true } : {}),
            source: { ...SITE_SOURCE, url: `${SITE_URL}/en/signs/` },
        });
    });
}

// ── endtimes_get_signs_history ────────────────────────────────────────────────

interface HistoryRow {
    date: string;
    omega: number | null;
    tension: number | null;
    percentiles: Partial<Record<SignId, number | null>>;
}

function parseHistory(body: unknown): HistoryRow[] {
    if (!Array.isArray(body)) throw UNAVAILABLE;
    const rows: HistoryRow[] = [];
    for (const e of body) {
        if (!isObject(e) || typeof e.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(e.date)) continue;
        const percentiles: Partial<Record<SignId, number | null>> = {};
        if (isObject(e.percentiles)) {
            for (const id of SIGN_IDS) if (id in e.percentiles) percentiles[id] = numOrNull(e.percentiles[id]);
        }
        rows.push({ date: e.date, omega: levelOrNull(e.omega), tension: levelOrNull(e.tension), percentiles });
    }
    return rows.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)); // newest first
}

function summarize(rows: HistoryRow[]) {
    const levels = rows.map(r => r.omega).filter((v): v is number => v !== null);
    const daysAt: Record<string, number> = {};
    for (const l of levels) daysAt[String(l)] = (daysAt[String(l)] ?? 0) + 1;
    const oldest = rows[rows.length - 1];
    const newest = rows[0];
    return {
        from: oldest.date,
        to: newest.date,
        days: rows.length,
        omega_first: oldest.omega,
        omega_last: newest.omega,
        omega_min: levels.length ? Math.min(...levels) : null,
        omega_max: levels.length ? Math.max(...levels) : null,
        omega_days_at_level: daysAt,
        tension_first: oldest.tension,
        tension_last: newest.tension,
    };
}

async function getSignsHistory(args: Args, ctx: ToolContext): Promise<ToolResult> {
    const from = args.from as string | undefined;
    const to = args.to as string | undefined;
    const limit = args.limit as number;
    if (from && to && from > to) throw new ToolError('invalid_input', `"from" (${from}) must not be later than "to" (${to}).`);
    const beforeDate = args.cursor ? decodeDateCursor(args.cursor as string) : undefined;

    const { rows: all, lastModified } = await ctx.cache.remember(cacheKey('history'), TTL.history, async () => {
        const file = await ctx.data.signsHistory();
        return { rows: parseHistory(file.body), lastModified: file.lastModified };
    });
    if (!all.length) throw UNAVAILABLE;

    const available = { from: all[all.length - 1].date, to: all[0].date, days: all.length };
    const updatedAt = lastModified ?? `${available.to}T00:00:00.000Z`;
    const stale = ctx.clock() - Date.parse(`${available.to}T00:00:00Z`) > HISTORY_STALE_MS;
    const inRange = all.filter(r => (!from || r.date >= from) && (!to || r.date <= to));
    const source = { ...SITE_SOURCE, url: `${SITE_URL}/en/signs/history/` };

    if (!inRange.length) {
        return success({
            data: [],
            message: `No daily readings in the requested range. Readings are available from ${available.from} to ${available.to}.`,
            available,
            updated_at: updatedAt,
            ...(stale ? { stale: true } : {}),
            source,
            has_more: false,
        });
    }

    const remaining = beforeDate ? inRange.filter(r => r.date < beforeDate) : inRange;
    const page = remaining.slice(0, limit);
    return fitToBudget(page.length, n => {
        const items = page.slice(0, n);
        const hasMore = remaining.length > n;
        return {
            data: items,
            summary: summarize(inRange),
            available,
            columns: 'date is a UTC day; omega and tension are levels 1 to 5; percentiles are 0 to 100 per sign, null when the sign has no measured series.',
            updated_at: updatedAt,
            ...(stale ? { stale: true } : {}),
            source,
            has_more: hasMore,
            ...(hasMore && items.length ? { next_cursor: encodeCursor({ d: items[items.length - 1].date }) } : {}),
        };
    });
}

// ── endtimes_search_events ────────────────────────────────────────────────────

const dayStart = (date: string): string => `${date}T00:00:00Z`;
const nextDayStart = (date: string): string => new Date(Date.parse(dayStart(date)) + 86_400_000).toISOString().replace('.000Z', 'Z');

/** A current category also matches the legacy name old rows may still carry. */
function categoriesFor(category: string): string[] {
    return [category, ...Object.entries(LEGACY_CATEGORY).filter(([, current]) => current === category).map(([legacy]) => legacy)];
}

async function searchEvents(args: Args, ctx: ToolContext): Promise<ToolResult> {
    const since = args.since as string | undefined;
    const until = args.until as string | undefined;
    const limit = args.limit as number;
    if (since && until && since > until) throw new ToolError('invalid_input', `"since" (${since}) must not be later than "until" (${until}).`);
    const after = args.cursor ? decodeEventCursor(args.cursor as string) : undefined;

    const minSeverity = args.min_severity as string | undefined;
    const query: EventQuery = {
        categories: args.category ? categoriesFor(args.category as string) : undefined,
        severities: minSeverity ? EVENT_SEVERITIES.slice(EVENT_SEVERITIES.indexOf(minSeverity as typeof EVENT_SEVERITIES[number])) : undefined,
        location: args.location as string | undefined,
        text: args.query as string | undefined,
        since: since ? dayStart(since) : undefined,
        before: until ? nextDayStart(until) : undefined,
        after,
        limit: limit + 1, // one extra row tells whether another page exists
    };

    const { rows, total } = await ctx.cache.remember(cacheKey('events', args, ['location', 'query']), TTL.events, () => ctx.data.searchEvents(query));

    const pageRows = rows.slice(0, limit);
    const moreInDb = rows.length > limit;
    const shaped: { row: RawRow; event: PublicEvent }[] = [];
    for (const row of pageRows) {
        const event = shapeEvent(row);
        if (event) shaped.push({ row, event });
    }
    const filtered = Object.keys(args).some(k => k !== 'limit');
    const updatedAt = latestUpdate(pageRows) ?? new Date(ctx.clock()).toISOString();
    const stale = !filtered && pageRows.length > 0 && ctx.clock() - Date.parse(updatedAt) > EVENTS_STALE_MS;
    const source = { ...SITE_SOURCE, origin: 'Each event names its own original source in source.name and source.url.' };

    const cursorOf = (row: RawRow): string => encodeCursor({ t: String(row.event_timestamp), i: String(row.id) });

    if (!shaped.length && moreInDb) {
        // Every row of this page was withheld; the next page may still have results.
        return success({ data: [], updated_at: updatedAt, source, has_more: true, next_cursor: cursorOf(pageRows[pageRows.length - 1]) });
    }
    if (!shaped.length) {
        return success({
            data: [],
            message: filtered
                ? 'No map events match these filters. The map holds mainly recent events; try fewer filters or a wider date range.'
                : 'The map has no events right now.',
            updated_at: updatedAt,
            source,
            ...(after ? {} : { total: 0 }),
            has_more: false,
        });
    }

    return fitToBudget(shaped.length, n => {
        const items = shaped.slice(0, n);
        const hasMore = moreInDb || n < shaped.length;
        return {
            data: items.map(i => i.event),
            event_link: EVENT_LINK_TEMPLATE,
            updated_at: updatedAt,
            ...(stale ? { stale: true } : {}),
            source,
            ...(!after && total !== null ? { total } : {}),
            has_more: hasMore,
            ...(hasMore ? { next_cursor: cursorOf(items[items.length - 1].row) } : {}),
        };
    });
}

// ── endtimes_get_event ────────────────────────────────────────────────────────

async function getEvent(args: Args, ctx: ToolContext): Promise<ToolResult> {
    const id = (args.id as string).toLowerCase();
    const row = await ctx.cache.remember(cacheKey('event', { id }), TTL.event, () => ctx.data.getEvent(id));
    const event = row ? shapeEvent(row) : null;
    if (!row || !event) {
        throw new ToolError('not_found', `No map event has the id ${id}. Old events leave the map; endtimes_search_events lists the current ones.`);
    }
    return success({
        data: { ...event, url: EVENT_LINK_TEMPLATE.replace('{id}', event.id) },
        updated_at: latestUpdate([row]) ?? new Date(ctx.clock()).toISOString(),
        source: { ...SITE_SOURCE, origin: 'The original source is in source.name and source.url.' },
    });
}

// ── definitions ───────────────────────────────────────────────────────────────

export const TOOLS: ToolDefinition[] = [
    {
        name: 'endtimes_get_signs',
        title: 'Current signs and Omega index',
        description:
            'Returns the current End Times Monitor reading in one call: the Ω (Omega) index level (1 to 5), which signs are anomalous, ' +
            `the military tension level, and every one of the ${SIGN_IDS.length} signs of Matthew 24 and Luke 21 with its value, historical mean, ` +
            'percentile, trend, measured period, source and a sentence on what is measured. Takes no arguments and returns all signs ' +
            'every time, so a single call answers a question about the current level or about any one sign (earthquakes, wars, famine and so on). ' +
            'Past days are in endtimes_get_signs_history. Map events and news are in endtimes_search_events. ' +
            `The reading is cached for ${TTL.signs / 1000} seconds; a second call inside that time returns the same data.`,
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
        annotations: READ_ONLY,
        run: getSigns,
    },
    {
        name: 'endtimes_get_signs_history',
        title: 'Daily history of the Omega index',
        description:
            'Returns the daily history of the Ω (Omega) level, the military tension level and each sign’s percentile: one row per UTC day, ' +
            'newest first. The response also carries a summary of the whole requested range (first and last level, minimum, maximum, days ' +
            'at each level) and the dates the series covers, so a trend question such as "did the index rise this month?" is answered by ' +
            'one call without paging. The series starts on the day the site began recording readings, not earlier. Values, sources and ' +
            'the explanation of each sign for today are in endtimes_get_signs, not here.',
        inputSchema: {
            type: 'object',
            properties: {
                from: { type: 'string', format: 'date', description: 'First UTC day to include, YYYY-MM-DD. Example: "2026-10-22". Omitted: from the start of the series.' },
                to: { type: 'string', format: 'date', description: 'Last UTC day to include, YYYY-MM-DD. Example: "2026-11-22". Omitted: up to the latest day.' },
                limit: { type: 'integer', minimum: 1, maximum: 90, default: 30, description: 'Days per page, 1 to 90. Default 30.' },
                cursor: { type: 'string', minLength: 1, maxLength: 200, description: 'The next_cursor value of the previous response, to continue to older days with the same from and to.' },
            },
            additionalProperties: false,
        },
        annotations: READ_ONLY,
        run: getSignsHistory,
    },
    {
        name: 'endtimes_search_events',
        title: 'Search map events',
        description:
            'Searches the events shown on the End Times Monitor live map (conflicts, disasters, outbreaks, cyber incidents, persecution and ' +
            `other categories), newest first. Each result has id, headline, an excerpt of up to ${EXCERPT_MAX} characters, category, severity, place ` +
            'name, coordinates, time, and the name and link of the original source. Every filter is optional and filters combine with AND; ' +
            'with no filter it returns the most recent events of all categories. The first page includes total, the number of matches, and ' +
            'has_more says whether another page exists. Results already contain every public field of an event, so endtimes_get_event adds ' +
            'nothing after a search. The map holds mainly recent events, not a long archive, and no full articles: the original story is at ' +
            'source.url. The Ω index and the sign readings are in endtimes_get_signs, not here.',
        inputSchema: {
            type: 'object',
            properties: {
                category: { type: 'string', enum: EVENT_CATEGORIES, description: 'One event category, in any letter case. Example: "CONFLICT".' },
                min_severity: { type: 'string', enum: EVENT_SEVERITIES, description: 'Lowest severity to include, from LOW, MEDIUM, ELEVATED, HIGH. Example: "HIGH" returns only HIGH; "ELEVATED" returns ELEVATED and HIGH.' },
                location: { type: 'string', minLength: 2, maxLength: 80, pattern: TEXT_FILTER_PATTERN, description: 'Part of the place name as the source wrote it, usually a country or region in English; letters, digits, spaces, dot, apostrophe and hyphen only. Example: "Ukraine".' },
                query: { type: 'string', minLength: 2, maxLength: 80, pattern: TEXT_FILTER_PATTERN, description: 'Word or phrase to find in the headline or excerpt, in any letter case; letters, digits, spaces, dot, apostrophe and hyphen only. Example: "earthquake".' },
                since: { type: 'string', format: 'date', description: 'First UTC day to include, YYYY-MM-DD. Example: "2026-11-15".' },
                until: { type: 'string', format: 'date', description: 'Last UTC day to include, YYYY-MM-DD. Example: "2026-11-22".' },
                limit: { type: 'integer', minimum: 1, maximum: 50, default: 20, description: 'Events per page, 1 to 50. Default 20.' },
                cursor: { type: 'string', minLength: 1, maxLength: 300, description: 'The next_cursor value of the previous response, to continue with the same filters.' },
            },
            additionalProperties: false,
        },
        annotations: READ_ONLY,
        run: searchEvents,
    },
    {
        name: 'endtimes_get_event',
        title: 'Get one map event',
        description:
            'Returns one map event by its id, with the same public fields as a result of endtimes_search_events plus its link on the site. ' +
            'It serves an id that comes from a site link (endtimes.live/?event=<id>) or from an earlier conversation. It is not a search ' +
            'and takes no filters: finding events by topic, place or date is done by endtimes_search_events, whose results already ' +
            'include everything this tool returns.',
        inputSchema: {
            type: 'object',
            properties: {
                id: { type: 'string', pattern: UUID_PATTERN, description: 'Event id, a UUID as returned in the id field of endtimes_search_events. Example: "3f9d48b8-e43b-45f1-893e-59f48e37df8c".' },
            },
            required: ['id'],
            additionalProperties: false,
        },
        annotations: READ_ONLY,
        run: getEvent,
    },
];

/** The wire form of a tool for tools/list: no run function, stable key order. */
export function listTools() {
    return TOOLS.map(t => ({
        name: t.name,
        title: t.title,
        description: t.description,
        inputSchema: t.inputSchema,
        annotations: t.annotations,
    }));
}
