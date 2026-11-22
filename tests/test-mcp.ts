// Testes do servidor MCP (supabase/functions/mcp). Sem rede: a fonte de dados é injetada.
// Rodar: npx tsx tests/test-mcp.ts
import { readFileSync } from 'node:fs';
import { TtlCache, cacheKey } from '../supabase/functions/mcp/cache';
import { buildEventsUrl, type DataSource, type EventQuery } from '../supabase/functions/mcp/data';
import * as facts from '../supabase/functions/mcp/facts';
import { LEGACY_VERSIONS, MODERN_VERSIONS, createHandler } from '../supabase/functions/mcp/handler';
import { DEFAULT_LIMITS, MemoryStore, PostgresStore, RateLimiter, addressForCounting, clientIp, inCidr, type LimitStore } from '../supabase/functions/mcp/ratelimit';
import { validateArgs } from '../supabase/functions/mcp/schema';
import { DEFAULT_PUBLISHABLE_KEY, DEFAULT_SUPABASE_URL, createServer, limitsFromEnv } from '../supabase/functions/mcp/server';
import { EVENT_COLUMNS, MAX_RESPONSE_CHARS, clipText, decodeEventCursor, encodeCursor, shapeEvent } from '../supabase/functions/mcp/shape';
import { TOOLS, TTL, listTools } from '../supabase/functions/mcp/tools';
import { ANOMALY_PERCENTILE, MIN_USABLE_SIGNS } from '../lib/signs/stats';
import { SIGN_ORDER, SLUGS } from '../lib/seo/slugs';
import { seoFiles } from '../lib/seo/pages';
import { en } from '../locales/en';
import { EventCategory } from '../types';

let failures = 0;
function check(name: string, actual: unknown, expected: unknown) {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    if (!ok) failures++;
    console.log(`${ok ? '✅' : '❌'} ${name}${ok ? '' : `\n     esperado ${JSON.stringify(expected)}\n     obtido   ${JSON.stringify(actual)}`}`);
}

// ── dados de exemplo ──────────────────────────────────────────────────────────
const NOW = Date.parse('2026-11-22T01:00:00Z');
const SIGNS_JSON = {
    version: 1,
    generatedAt: '2026-11-22T00:50:26.870Z',
    omega: { level: 3, anomalous: ['wars', 'sea'], usable: 7, rising: 4 },
    tension: { level: 3, value: 148.1, percentile: 86.6, date: '2026-11-16', sourceUrl: 'https://www.matteoiacoviello.com/gpr.htm' },
    signs: [
        { id: 'earthquakes', status: 'ok', value: 17, baselineMean: 12.2, percentile: 85.6, trend: 'up', period: '30d', baselineSpan: '2000–2025', sourceName: 'USGS', sourceUrl: 'https://earthquake.usgs.gov/earthquakes/map/' },
        { id: 'wars', status: 'ok', value: 244579, baselineMean: 110682, percentile: 94.4, trend: 'up', period: '2025', baselineSpan: '1989–2024', sourceName: 'UCDP / Our World in Data', sourceUrl: 'https://ourworldindata.org/grapher/deaths-in-armed-conflicts-by-type' },
        { id: 'famine', status: 'error', value: null, baselineMean: null, percentile: null, trend: null, period: null, baselineSpan: null, sourceName: 'World Bank Pink Sheet', sourceUrl: 'https://www.worldbank.org/en/research/commodity-markets', error: 'fetch failed: ECONNRESET at collector.internal:8443' },
        { id: 'persecution', status: 'unavailable', value: null, baselineMean: null, percentile: null, trend: null, period: null, baselineSpan: null, sourceName: 'Portas Abertas — Lista Mundial da Perseguição', sourceUrl: 'https://www.portasabertas.org.br/lista-mundial' },
        { id: 'gospel', status: 'short-baseline', value: 44.2, baselineMean: null, percentile: null, trend: null, period: '2026-11-22', baselineSpan: null, sourceName: 'Data provided by Joshua Project', sourceUrl: 'https://joshuaproject.net/', extra: { groups: 7148 } },
    ],
};
const HISTORY_JSON = Array.from({ length: 48 }, (_, i) => {
    const date = new Date(Date.parse('2026-10-06T00:00:00Z') + i * 86_400_000).toISOString().slice(0, 10);
    return { date, omega: i < 20 ? 2 : 3, tension: 3, percentiles: { earthquakes: 50 + i, wars: 94.4, persecution: null } };
});

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const row = (n: number, over: Record<string, unknown> = {}) => ({
    id: uuid(n),
    title: `Headline ${n}`,
    description: `Excerpt of event ${n}.`,
    category: 'CONFLICT',
    severity: 'HIGH',
    location: 'Ukraine',
    lat: 48.3794123,
    lng: 31.1655987,
    event_timestamp: new Date(NOW - n * 60_000).toISOString().replace('.000Z', '+00:00'),
    updated_at: new Date(NOW - n * 30_000).toISOString(),
    source_name: 'Kyiv Independent',
    source_type: 'RSS',
    source_url: `https://kyivindependent.com/story-${n}`,
    ...over,
});
const FORBIDDEN = {
    metadata: { chat_id: -1001234567890, raw: 'internal' },
    collector_name: 'TELEGRAM_OSINT',
    geocoding_accuracy: 'city', geocoding_confidence: 0.9, geocoded_by: 'nominatim', original_location_text: 'somewhere',
    ai_summary: 'model text', ai_tags: ['x'], priority: 1, fetched_at: '2026-11-22T00:00:00Z', media_url: 'https://cdn.example/x.jpg',
    created_at: '2026-11-21T00:00:00Z',
};

function fakeData(rows: Record<string, unknown>[] = [], opts: { fail?: boolean } = {}) {
    const calls = { signs: 0, history: 0, search: 0, event: 0, queries: [] as EventQuery[] };
    const data: DataSource = {
        async signs() { calls.signs++; if (opts.fail) throw new Error('boom'); return { body: SIGNS_JSON, lastModified: '2026-11-22T00:50:32.000Z' }; },
        async signsHistory() { calls.history++; return { body: HISTORY_JSON, lastModified: '2026-11-22T00:50:33.000Z' }; },
        async searchEvents(q) {
            calls.search++; calls.queries.push(q);
            let list = [...rows].sort((a, b) => (String(a.event_timestamp) < String(b.event_timestamp) ? 1 : -1));
            if (q.after) list = list.filter(r => String(r.event_timestamp) < q.after!.t);
            if (q.categories) list = list.filter(r => q.categories!.includes(String(r.category)));
            return { rows: list.slice(0, q.limit), total: list.length };
        },
        async getEvent(id) { calls.event++; return rows.find(r => r.id === id) ?? null; },
    };
    return { data, calls };
}

function makeHandler(rows: Record<string, unknown>[] = [], opts: { limits?: Partial<typeof DEFAULT_LIMITS>; fail?: boolean; store?: LimitStore } = {}) {
    const clock = { now: NOW };
    const fake = fakeData(rows, { fail: opts.fail });
    const handler = createHandler({
        context: { data: fake.data, cache: new TtlCache(() => clock.now), clock: () => clock.now },
        limiter: new RateLimiter({ limits: { ...DEFAULT_LIMITS, ...opts.limits }, clock: () => clock.now, store: opts.store }),
    });
    return { handler, clock, calls: fake.calls };
}

const URL_ = 'https://project.example/functions/v1/mcp';
type H = (req: Request) => Promise<Response>;
async function send(handler: H, body: unknown, headers: Record<string, string> = {}, method = 'POST') {
    const res = await handler(new Request(URL_, {
        method,
        headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream', ...headers },
        body: method === 'POST' ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
    }));
    const text = await res.text();
    return { status: res.status, headers: res.headers, json: text ? JSON.parse(text) : null };
}
let nextId = 1;
const legacy = (handler: H, method: string, params?: unknown, headers: Record<string, string> = {}) =>
    send(handler, { jsonrpc: '2.0', id: nextId++, method, ...(params === undefined ? {} : { params }) }, headers);
const META = {
    'io.modelcontextprotocol/protocolVersion': '2026-07-28',
    'io.modelcontextprotocol/clientInfo': { name: 'test', version: '1' },
    'io.modelcontextprotocol/clientCapabilities': {},
};
const modern = (handler: H, method: string, params: Record<string, unknown> = {}, headers: Record<string, string> = {}) =>
    send(handler, { jsonrpc: '2.0', id: nextId++, method, params: { ...params, _meta: META } }, {
        'mcp-protocol-version': '2026-07-28', 'mcp-method': method,
        ...(typeof params.name === 'string' ? { 'mcp-name': params.name } : {}), ...headers,
    });
const call = async (handler: H, name: string, args?: unknown, headers: Record<string, string> = {}) => {
    const r = await legacy(handler, 'tools/call', { name, ...(args === undefined ? {} : { arguments: args }) }, headers);
    const result = r.json.result;
    return { status: r.status, rpc: r.json, isError: result?.isError, body: result ? JSON.parse(result.content[0].text) : null, size: result ? result.content[0].text.length : 0 };
};

async function main() {
    // ── fatos: a cópia da função bate com o que o site publica ───────────────
    check('fatos: percentil de anomalia', facts.ANOMALY_PERCENTILE, ANOMALY_PERCENTILE);
    check('fatos: mínimo de sinais', facts.MIN_USABLE_SIGNS, MIN_USABLE_SIGNS);
    check('fatos: ordem dos sinais', [...facts.SIGN_IDS], SIGN_ORDER);
    check('fatos: nome e versículo iguais a locales/en', facts.SIGN_IDS.map(id => [facts.SIGNS[id].name, facts.SIGNS[id].scripture]), SIGN_ORDER.map(id => [en.signs.items[id].name, en.signs.items[id].ref]));
    check('fatos: slugs iguais a lib/seo/slugs', facts.SIGN_IDS.map(id => facts.SIGNS[id].slug), SIGN_ORDER.map(id => SLUGS.en[id]));
    const seo = seoFiles(new Date('2026-11-22T00:00:00Z'));
    check('fatos: "o que medimos" igual ao llms.txt do site', facts.SIGN_IDS.filter(id => !seo['llms.txt'].includes(`: ${facts.SIGNS[id].measure}`)), []);
    const hub = seo['en/signs/index.html'].replace(/&#39;|&apos;/g, "'");
    check('fatos: método do Ω igual à página de sinais', facts.OMEGA_METHOD.filter(p => !hub.includes(p)), []);
    check('fatos: aviso usa a frase do site', seo['llms.txt'].includes('a watch dashboard, not a date prediction') && facts.NOTICE.includes('a watch dashboard, not a date prediction'), true);
    check('fatos: níveis de tensão iguais a locales/en', [...facts.TENSION_LABELS], en.tension.levels);
    const legacyNames = Object.keys(facts.LEGACY_CATEGORY);
    check('fatos: categorias = enum do site sem as legadas', [...facts.EVENT_CATEGORIES], Object.values(EventCategory).filter(c => !legacyNames.includes(c)));
    check('fatos: trecho de 280 caracteres como no coletor', readFileSync('lib/collectors/BaseCollector.ts', 'utf8').includes(`const SNIPPET_MAX = ${facts.EXCERPT_MAX};`), true);
    const siteClient = readFileSync('lib/supabase.ts', 'utf8');
    check('fatos: URL e chave publicável iguais a lib/supabase.ts', siteClient.includes(`'${DEFAULT_SUPABASE_URL}'`) && siteClient.includes(`'${DEFAULT_PUBLISHABLE_KEY}'`), true);
    check('chave padrão é a publicável, nunca service role', DEFAULT_PUBLISHABLE_KEY.startsWith('sb_publishable_'), true);

    // ── contrato das tools ───────────────────────────────────────────────────
    const listed = listTools();
    check('4 tools, em ordem estável', listed.map(t => t.name), ['endtimes_get_signs', 'endtimes_get_signs_history', 'endtimes_search_events', 'endtimes_get_event']);
    check('nomes: prefixo, snake_case, até 64', listed.every(t => /^endtimes_[a-z_]{3,55}$/.test(t.name)), true);
    check('toda tool tem título e descrição', listed.every(t => t.title.length > 5 && t.description.length > 80), true);
    check('hints explícitos em toda tool', listed.map(t => [t.annotations.readOnlyHint, t.annotations.destructiveHint, t.annotations.openWorldHint]), listed.map(() => [true, false, false]));
    check('schema estrito em toda tool', listed.every(t => t.inputSchema.type === 'object' && t.inputSchema.additionalProperties === false), true);
    check('todo argumento tem descrição', listed.every(t => Object.values(t.inputSchema.properties).every(p => p.description.length > 15)), true);
    check('descrição de cada tool cita a tool vizinha', listed.map(t => listed.some(o => o.name !== t.name && t.description.includes(o.name))), [true, true, true, true]);
    const texts = [facts.INSTRUCTIONS, facts.NOTICE, facts.TENSION_MEASURE, ...facts.OMEGA_METHOD, ...listed.flatMap(t => [t.title, t.description, ...Object.values(t.inputSchema.properties).map(p => p.description)])];
    check('sem travessão nos textos', texts.filter(t => /[—–]/.test(t)), []);
    check('descrições descrevem, não dão ordens ao modelo', texts.filter(t => /\b(always|never|you must|you should|must call|call this first|before answering|do not call)\b/i.test(t)), []);
    check('função não seleciona *', EVENT_COLUMNS.includes('*' as never) || EVENT_COLUMNS.some(c => ['metadata', 'collector_name', 'ai_summary'].includes(c)), false);

    // ── validação de argumentos ──────────────────────────────────────────────
    const search = TOOLS[2].inputSchema;
    const v = (schema: typeof search, input: unknown) => validateArgs(schema, input);
    check('validação: sem argumentos aplica só o padrão', v(search, {}), { ok: true, args: { limit: 20 } });
    check('validação: undefined vira objeto vazio', v(search, undefined), { ok: true, args: { limit: 20 } });
    const unknownArg = v(search, { country: 'BR' });
    check('validação: argumento desconhecido é rejeitado', [unknownArg.ok, unknownArg.ok === false && /Unknown argument: country\. Accepted arguments: category,/.test(unknownArg.message)], [false, true]);
    check('validação: limite acima do máximo é rejeitado, não cortado', v(search, { limit: 51 }), { ok: false, message: '"limit" must be from 1 to 50 (received 51).' });
    check('validação: limite zero', v(search, { limit: 0 }).ok, false);
    check('validação: limite decimal', v(search, { limit: 2.5 }).ok, false);
    check('validação: limite como texto não é convertido', v(search, { limit: '10' }).ok, false);
    check('validação: enum fora da lista', v(search, { category: 'WAR' }).ok, false);
    check('validação: enum em qualquer caixa vira o valor canônico', v(search, { category: 'conflict', min_severity: 'High' }), { ok: true, args: { category: 'CONFLICT', min_severity: 'HIGH', limit: 20 } });
    check('validação: data inexistente', v(search, { since: '2026-02-30' }).ok, false);
    check('validação: data em outro formato', v(search, { since: '22/11/2026' }).ok, false);
    check('validação: texto com sintaxe de filtro é rejeitado', [v(search, { query: 'x*,id.gt.0)' }).ok, v(search, { location: 'a%' }).ok, v(search, { query: '"; drop' }).ok], [false, false, false]);
    check('validação: texto curto demais', v(search, { query: 'a' }).ok, false);
    check('validação: texto com acento e espaço passa, sem espaços nas pontas', v(search, { location: '  São   Paulo ' }), { ok: true, args: { location: 'São Paulo', limit: 20 } });
    check('validação: argumentos como lista', v(search, [1]).ok, false);
    check('validação: tool sem argumentos rejeita qualquer um', v(TOOLS[0].inputSchema, { sign: 'wars' }), { ok: false, message: 'Unknown argument: sign. This tool takes no arguments.' });
    check('validação: id obrigatório', v(TOOLS[3].inputSchema, {}), { ok: false, message: '"id" is required.' });
    check('validação: id que não é UUID', v(TOOLS[3].inputSchema, { id: '123' }).ok, false);
    const many = v(search, { foo: 1, limit: 99, since: 'x' });
    check('validação: todos os erros numa resposta só', many.ok === false && ['foo', '"limit"', '"since"'].every(s => many.message.includes(s)), true);

    // ── chave de cache ───────────────────────────────────────────────────────
    check('cache: ordem dos argumentos não muda a chave', cacheKey('events', { limit: 20, category: 'CONFLICT' }), cacheKey('events', { category: 'CONFLICT', limit: 20 }));
    check('cache: caixa e espaços do texto livre não mudam a chave', cacheKey('events', { location: ' UKRAINE ' }, ['location']), cacheKey('events', { location: 'ukraine' }, ['location']));
    check('cache: cursor mantém a caixa', cacheKey('events', { cursor: 'AbC' }) === cacheKey('events', { cursor: 'abc' }), false);
    check('cache: valores diferentes, chaves diferentes', cacheKey('events', { limit: 20 }) === cacheKey('events', { limit: 21 }), false);
    check('cache: separador dentro do valor não colide', cacheKey('events', { query: 'a&limit=5' }) === cacheKey('events', { query: 'a', limit: 5 }), false);
    {
        let t = 0, loads = 0;
        const c = new TtlCache(() => t, 3);
        const load = async () => ++loads;
        await c.remember('k', 1000, load);
        await c.remember('k', 1000, load);
        check('cache: segunda leitura dentro do TTL não recarrega', loads, 1);
        t = 1001;
        await c.remember('k', 1000, load);
        check('cache: expira depois do TTL', loads, 2);
        const [a, b] = await Promise.all([c.remember('p', 1000, load), c.remember('p', 1000, load)]);
        check('cache: chamadas simultâneas compartilham uma leitura', [a === b, loads], [true, 3]);
        let threw = 0;
        for (let i = 0; i < 2; i++) await c.remember('err', 1000, async () => { throw new Error('x'); }).catch(() => threw++);
        check('cache: falha não fica guardada', threw, 2);
        for (const k of ['a', 'b', 'c', 'd', 'e']) await c.remember(k, 1000, async () => k);
        check('cache: tamanho limitado', c.size <= 3, true);
    }

    // ── limite de uso ────────────────────────────────────────────────────────
    const ipH = (ip: string) => new Headers({ 'cf-connecting-ip': ip });
    {
        let t = Date.parse('2026-11-22T01:00:10Z');
        const lim = new RateLimiter({ limits: { perMinute: 3, perHour: 5, poolPerMinute: 4, globalPerMinute: 100 }, clock: () => t });
        const seq: boolean[] = [];
        for (let i = 0; i < 3; i++) seq.push((await lim.check(ipH('203.0.113.7'))).allowed);
        const fourth = await lim.check(ipH('203.0.113.7'));
        check('limite: 3 por minuto passam, a 4ª não', [seq, fourth.allowed], [[true, true, true], false]);
        check('limite: espera = segundos até a janela virar', fourth.retryAfterSeconds, 50);
        check('limite: outro endereço não é afetado', (await lim.check(ipH('203.0.113.8'))).allowed, true);
        t += 50_000;
        check('limite: a janela de 1 minuto zera', (await lim.check(ipH('203.0.113.7'))).allowed, true);
        check('limite: chamada recusada pelo minuto não gasta a hora; a 6ª da hora é recusada', [(await lim.check(ipH('203.0.113.7'))).allowed, (await lim.check(ipH('203.0.113.7'))).allowed], [true, false]);
    }
    {
        let t = Date.parse('2026-11-22T01:00:00Z');
        const lim = new RateLimiter({ limits: { perMinute: 100, perHour: 4, poolPerMinute: 100, globalPerMinute: 1000 }, clock: () => t });
        const seq: boolean[] = [];
        for (let i = 0; i < 5; i++) { seq.push((await lim.check(ipH('198.51.100.1'))).allowed); t += 61_000; }
        check('limite: teto por hora vale entre minutos', seq, [true, true, true, true, false]);
        const v5 = await lim.check(ipH('198.51.100.1'));
        check('limite: espera do teto por hora', [v5.allowed, v5.retryAfterSeconds], [false, 3600 - 305]);
    }
    {
        const lim = new RateLimiter({ limits: { perMinute: 2, perHour: 100, poolPerMinute: 4, globalPerMinute: 1000 }, clock: () => NOW });
        const pool: boolean[] = [];
        for (const ip of ['160.79.104.10', '160.79.111.250', '153.61.208.1', '153.61.223.9', '160.79.105.1']) pool.push((await lim.check(ipH(ip))).allowed);
        check('limite: endereços de assistentes hospedados dividem um balde maior', pool, [true, true, true, true, false]);
        check('limite: quem está logo fora da faixa usa o balde próprio', [inCidr('160.79.112.1', '160.79.104.0/21'), inCidr('153.61.224.1', '153.61.208.0/20')], [false, false]);
    }
    {
        const lim = new RateLimiter({ limits: { perMinute: 1, perHour: 100, poolPerMinute: 100, globalPerMinute: 3 }, clock: () => NOW });
        const a = [(await lim.check(ipH('192.0.2.1'))).allowed, (await lim.check(ipH('192.0.2.1'))).allowed, (await lim.check(ipH('192.0.2.1'))).allowed, (await lim.check(ipH('192.0.2.1'))).allowed];
        const b = [(await lim.check(ipH('192.0.2.2'))).allowed, (await lim.check(ipH('192.0.2.3'))).allowed, (await lim.check(ipH('192.0.2.4'))).allowed];
        check('limite: quem estourou o próprio teto não gasta o teto global', [a, b], [[true, false, false, false], [true, true, false]]);
    }
    {
        const rules = await new RateLimiter({ salt: 's1' }).rulesFor('203.0.113.7');
        const other = await new RateLimiter({ salt: 's2' }).rulesFor('203.0.113.7');
        check('limite: a chave do contador não contém o endereço', [rules[0].bucket.includes('203.0.113.7'), /^ip:[0-9a-f]{32}$/.test(rules[0].bucket), rules[0].bucket === other[0].bucket], [false, true, false]);
        check('limite: números padrão', DEFAULT_LIMITS, { perMinute: 30, perHour: 300, poolPerMinute: 600, globalPerMinute: 900 });
        check('limite: variável inválida cai no padrão', limitsFromEnv(n => ({ MCP_RATE_PER_MINUTE: '5', MCP_RATE_PER_HOUR: 'abc', MCP_RATE_GLOBAL_PER_MINUTE: '-1' } as Record<string, string>)[n]), { perMinute: 5, perHour: 300, poolPerMinute: 600, globalPerMinute: 900 });
        const failing: LimitStore = { hit: async () => { throw new Error('table missing'); } };
        const lim = new RateLimiter({ limits: { ...DEFAULT_LIMITS, perMinute: 1 }, store: failing, clock: () => NOW });
        check('limite: sem a tabela durável, conta em memória', [(await lim.check(ipH('192.0.2.9'))).allowed, (await lim.check(ipH('192.0.2.9'))).allowed], [true, false]);
        const mem = new MemoryStore(10);
        for (let i = 0; i < 200; i++) await mem.hit([{ bucket: `ip:${i}`, limit: 5, windowSeconds: 60 }], NOW);
        check('limite: memória dos contadores é limitada', mem.size <= 11, true);
    }
    {
        const seen: { url: string; init: RequestInit }[] = [];
        const answer = { status: 200, body: [{ allowed: false, retry_after: 17 }] as unknown };
        const fakeFetch = (async (url: string, init: RequestInit) => { seen.push({ url, init }); return new Response(JSON.stringify(answer.body), { status: answer.status }); }) as unknown as typeof fetch;
        const store = new PostgresStore(fakeFetch, 'https://p.example', 'service-key');
        const lim = new RateLimiter({ limits: { ...DEFAULT_LIMITS, perMinute: 1 }, store, clock: () => NOW });
        check('limite durável: veredito vem da função do banco', await lim.check(ipH('192.0.2.77')), { allowed: false, retryAfterSeconds: 17 });
        const sent = JSON.parse(String(seen[0].init.body));
        check('limite durável: chama só a função de contagem, com as regras em ordem', [seen[0].url, seen[0].init.method, sent.p_windows, sent.p_limits, sent.p_buckets[2], sent.p_buckets[0] === sent.p_buckets[1]], ['https://p.example/rest/v1/rpc/mcp_rate_hit', 'POST', [60, 3600, 60], [1, 300, 900], 'all', true]);
        check('limite durável: o endereço não vai para o banco', String(seen[0].init.body).includes('192.0.2.77'), false);
        answer.status = 404; answer.body = { message: 'function not found' };
        check('limite durável: função ausente (migração não aplicada) cai para a memória', [(await lim.check(ipH('192.0.2.77'))).allowed, (await lim.check(ipH('192.0.2.77'))).allowed], [true, false]);
        const noStore = createServer({ env: n => ({ SUPABASE_SERVICE_ROLE_KEY: 'service-key' } as Record<string, string>)[n], fetchFn: fakeFetch, data: fakeData().data });
        seen.length = 0;
        await call(noStore, 'endtimes_get_signs', {});
        check('service role não é usada sem MCP_RATE_LIMIT_BACKEND=postgres', seen.length, 0);
    }
    check('ip: IPv6 conta por rede /64', [addressForCounting('2001:db8:1:2:aaaa:bbbb:cccc:dddd'), addressForCounting('2001:db8:1:2::1'), addressForCounting('2001:0db8::1'), addressForCounting('203.0.113.7')], ['2001:db8:1:2::/64', '2001:db8:1:2::/64', '2001:db8:0:0::/64', '203.0.113.7']);
    check('ip: cf-connecting-ip vence', clientIp(new Headers({ 'cf-connecting-ip': '203.0.113.7', 'x-forwarded-for': '1.1.1.1' })), '203.0.113.7');
    check('ip: x-forwarded-for usa a entrada mais à direita, não a que o cliente digitou', clientIp(new Headers({ 'x-forwarded-for': '9.9.9.9, 203.0.113.7' })), '203.0.113.7');
    check('ip: ignora proxy interno à direita', clientIp(new Headers({ 'x-forwarded-for': '9.9.9.9, 203.0.113.7, 10.0.0.5' })), '203.0.113.7');
    check('ip: cabeçalhos inventados pelo cliente não contam', clientIp(new Headers({ 'x-real-ip': '1.2.3.4', 'x-client-ip': '1.2.3.4', 'x-mcp-client-ip': '1.2.3.4', forwarded: 'for=1.2.3.4' })), null);
    check('ip: valor que não é endereço é ignorado', clientIp(new Headers({ 'cf-connecting-ip': 'pool', 'x-forwarded-for': 'abc' })), null);

    // ── formato dos eventos ──────────────────────────────────────────────────
    const shaped = shapeEvent(row(1, { ...FORBIDDEN, description: '<p>Long <b>text</b></p> ' + 'word '.repeat(100) }))!;
    check('evento: só os campos públicos', Object.keys(shaped), ['id', 'title', 'excerpt', 'category', 'severity', 'location', 'lat', 'lng', 'occurred_at', 'source']);
    check('evento: nada interno no texto', /metadata|chat_id|collector|TELEGRAM_OSINT|nominatim|model text|geocod|cdn\.example/.test(JSON.stringify(shaped)), false);
    check('evento: trecho sem HTML e com até 280 caracteres', [shaped.excerpt.startsWith('Long text word'), shaped.excerpt.length <= 280, shaped.excerpt.endsWith('...')], [true, true, true]);
    check('evento: coordenadas arredondadas', [shaped.lat, shaped.lng], [48.38, 31.17]);
    check('evento: data em ISO', shaped.occurred_at, new Date(NOW - 60_000).toISOString());
    check('evento: post de canal fica de fora', [shapeEvent(row(2, { source_type: 'TELEGRAM', source_name: '@somechannel', source_url: 'https://t.me/s/somechannel/1' })), shapeEvent(row(2, { source_name: '@handle' })), shapeEvent(row(2, { source_url: 'https://t.me/x/1' })), shapeEvent(row(2, { source_type: 'X_OSINT' }))], [null, null, null, null]);
    check('evento: categoria legada vira a atual', [shapeEvent(row(3, { category: 'PANDEMIC' }))!.category, shapeEvent(row(3, { category: 'GOVERNMENT' }))!.category, shapeEvent(row(3, { category: 'WEIRD' }))!.category], ['EPIDEMIC', 'POLITICAL', 'OTHER']);
    check('evento: link que não é http some', shapeEvent(row(4, { source_url: 'javascript:alert(1)' }))!.source.url, null);
    check('evento: linha sem id válido é descartada', shapeEvent(row(5, { id: 'x' })), null);
    check('texto: corte não passa do máximo', clipText('a'.repeat(500), 280).length, 280);

    const urlText = decodeURIComponent(buildEventsUrl('https://p.example', { limit: 21, categories: ['EPIDEMIC', 'PANDEMIC'], severities: ['ELEVATED', 'HIGH'], location: 'Ukraine', text: 'drone strike', since: '2026-11-01T00:00:00Z', before: '2026-11-23T00:00:00Z', after: { t: '2026-11-22T00:32:23+00:00', i: uuid(9) } }).replace(/\+/g, ' '));
    check('consulta: colunas explícitas, nunca *', [urlText.includes(`select=${EVENT_COLUMNS.join(',')}`), /select=\*/.test(urlText), /metadata|collector_name|ai_summary/.test(urlText)], [true, false, false]);
    check('consulta: sempre com limite, ordem e tipos de fonte públicos', [urlText.includes('limit=21'), urlText.includes('order=event_timestamp.desc,id.desc'), urlText.includes('source_type=in.(RSS,NEWS,OFFICIAL,GOV_OFFICIAL,MANUAL)')], [true, true, true]);
    check('consulta: filtros', [urlText.includes('category=in.(EPIDEMIC,PANDEMIC)'), urlText.includes('severity=in.(ELEVATED,HIGH)'), urlText.includes('location=ilike.*Ukraine*'), urlText.includes('event_timestamp=gte.2026-11-01T00:00:00Z'), urlText.includes('event_timestamp=lt.2026-11-23T00:00:00Z'), urlText.includes('or=(title.ilike."*drone strike*",description.ilike."*drone strike*")')], [true, true, true, true, true, true]);
    check('cursor: ida e volta', decodeEventCursor(encodeCursor({ t: '2026-11-22T00:32:23+00:00', i: uuid(9) })), { t: '2026-11-22T00:32:23+00:00', i: uuid(9) });

    // ── JSON-RPC: era legada (initialize) ────────────────────────────────────
    {
        const { handler, calls } = makeHandler([row(1)]);
        const init = await legacy(handler, 'initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '1' } });
        check('initialize: 200 e versão pedida', [init.status, init.json.result.protocolVersion], [200, '2025-06-18']);
        check('initialize: servidor, capacidade de tools e instruções', [init.json.result.serverInfo, init.json.result.capabilities, init.json.result.instructions === facts.INSTRUCTIONS], [{ name: 'endtimes-live', title: 'End Times Monitor', version: facts.SERVER_VERSION }, { tools: { listChanged: false } }, true]);
        check('initialize: sem sessão', init.headers.get('mcp-session-id'), null);
        check('initialize: versão desconhecida recebe a mais nova da era', (await legacy(handler, 'initialize', { protocolVersion: '1999-01-01' })).json.result.protocolVersion, LEGACY_VERSIONS[0]);
        const note = await send(handler, { jsonrpc: '2.0', method: 'notifications/initialized' });
        check('notificação: 202 sem corpo', [note.status, note.json], [202, null]);
        check('ping: resultado vazio', (await legacy(handler, 'ping')).json.result, {});
        const list = await legacy(handler, 'tools/list', undefined, { 'mcp-protocol-version': '2025-06-18' });
        check('tools/list: as 4 tools', [list.status, list.json.result.tools.map((t: { name: string }) => t.name)], [200, listed.map(t => t.name)]);
        check('tools/list: igual em toda chamada', JSON.stringify((await legacy(handler, 'tools/list')).json.result) === JSON.stringify(list.json.result), true);
        const unknownMethod = await legacy(handler, 'resources/list');
        check('método desconhecido: erro -32601', [unknownMethod.status, unknownMethod.json.error.code], [200, -32601]);
        const unknownTool = await legacy(handler, 'tools/call', { name: 'endtimes_delete_everything', arguments: {} });
        check('tool desconhecida: erro de protocolo -32602', [unknownTool.json.error.code, unknownTool.json.error.message], [-32602, 'Unknown tool: endtimes_delete_everything']);
        check('tools/call sem nome: -32602', (await legacy(handler, 'tools/call', { arguments: {} })).json.error.code, -32602);
        check('tools/call com argumentos que não são objeto: -32602', (await legacy(handler, 'tools/call', { name: 'endtimes_get_signs', arguments: 'x' })).json.error.code, -32602);
        const badVersion = await legacy(handler, 'tools/list', undefined, { 'mcp-protocol-version': '2024-01-01' });
        check('versão de protocolo não suportada: 400 e lista das suportadas', [badVersion.status, badVersion.json.error.code, badVersion.json.error.data.supported], [400, -32022, [...MODERN_VERSIONS, ...LEGACY_VERSIONS]]);
        check('descoberta e erros não tocam a fonte de dados', calls, { signs: 0, history: 0, search: 0, event: 0, queries: [] });

        const malformed = await send(handler, '{"jsonrpc": "2.0", "id": 1, "method": ');
        check('corpo inválido: 400 e -32700', [malformed.status, malformed.json.error.code, 'id' in malformed.json], [400, -32700, false]);
        check('lote: recusado', [(await send(handler, [{ jsonrpc: '2.0', id: 1, method: 'ping' }])).status, (await send(handler, [{ jsonrpc: '2.0', id: 1, method: 'ping' }])).json.error.code], [400, -32600]);
        check('sem jsonrpc 2.0: -32600', (await send(handler, { id: 1, method: 'ping' })).json.error.code, -32600);
        check('id nulo: -32600', (await send(handler, { jsonrpc: '2.0', id: null, method: 'ping' })).json.error.code, -32600);
        check('params que não é objeto: -32602', (await send(handler, { jsonrpc: '2.0', id: 1, method: 'tools/list', params: [1] })).json.error.code, -32602);
        const big = await send(handler, { jsonrpc: '2.0', id: 1, method: 'ping', params: { pad: 'x'.repeat(70_000) } });
        check('corpo grande demais: 413', big.status, 413);
        const get = await send(handler, null, {}, 'GET');
        check('GET: 405 com Allow', [get.status, get.headers.get('allow'), typeof get.json.error.message], [405, 'POST, OPTIONS', 'string']);
        check('DELETE: 405', (await send(handler, null, {}, 'DELETE')).status, 405);
        check('respostas não vão para cache HTTP', list.headers.get('cache-control'), 'no-store');
        check('Origin de outro site: 403', (await legacy(handler, 'ping', undefined, { origin: 'https://evil.example' })).status, 403);
        const sameSite = await legacy(handler, 'ping', undefined, { origin: 'https://endtimes.live' });
        check('Origin do site: aceito, com CORS', [sameSite.status, sameSite.headers.get('access-control-allow-origin')], [200, 'https://endtimes.live']);
        check('Origin local (Inspector): aceito', (await legacy(handler, 'ping', undefined, { origin: 'http://localhost:6274' })).status, 200);
        const pre = await handler(new Request(URL_, { method: 'OPTIONS', headers: { origin: 'https://endtimes.live', 'access-control-request-method': 'POST' } }));
        check('OPTIONS: 204 e cabeçalhos do protocolo liberados', [pre.status, (pre.headers.get('access-control-allow-headers') ?? '').includes('mcp-protocol-version')], [204, true]);
    }

    // ── JSON-RPC: era moderna (sem handshake) ────────────────────────────────
    {
        const { handler } = makeHandler([row(1)]);
        const disc = await modern(handler, 'server/discover');
        check('server/discover: versões, capacidades e cache', [disc.status, disc.json.result.resultType, disc.json.result.supportedVersions, disc.json.result.capabilities, disc.json.result.cacheScope, disc.json.result.ttlMs > 0], [200, 'complete', [...MODERN_VERSIONS, ...LEGACY_VERSIONS], { tools: {} }, 'public', true]);
        check('server/discover: identidade do servidor no _meta', disc.json.result._meta['io.modelcontextprotocol/serverInfo'].name, 'endtimes-live');
        const list = await modern(handler, 'tools/list');
        check('tools/list moderno: resultType, ttlMs e cacheScope', [list.json.result.resultType, list.json.result.tools.length, list.json.result.ttlMs > 0, list.json.result.cacheScope], ['complete', 4, true, 'public']);
        const ok = await modern(handler, 'tools/call', { name: 'endtimes_get_signs', arguments: {} });
        check('tools/call moderno: resultado completo', [ok.status, ok.json.result.resultType, ok.json.result.isError, JSON.parse(ok.json.result.content[0].text).data.omega.level], [200, 'complete', false, 3]);
        check('método desconhecido moderno: 404 e -32601', [(await modern(handler, 'ping')).status, (await modern(handler, 'ping')).json.error.code], [404, -32601]);
        const noHeader = await send(handler, { jsonrpc: '2.0', id: 1, method: 'tools/list', params: { _meta: META } });
        check('sem MCP-Protocol-Version: 400 e -32020', [noHeader.status, noHeader.json.error.code], [400, -32020]);
        const mismatch = await modern(handler, 'tools/list', {}, { 'mcp-protocol-version': '2025-06-18' });
        check('cabeçalho e corpo com versões diferentes: -32020', [mismatch.status, mismatch.json.error.code], [400, -32020]);
        const future = await send(handler, { jsonrpc: '2.0', id: 1, method: 'tools/list', params: { _meta: { ...META, 'io.modelcontextprotocol/protocolVersion': '2099-01-01' } } }, { 'mcp-protocol-version': '2099-01-01', 'mcp-method': 'tools/list' });
        check('versão futura: 400, -32022 e versões suportadas', [future.status, future.json.error.code, future.json.error.data.requested, future.json.error.data.supported.includes('2026-07-28')], [400, -32022, '2099-01-01', true]);
        const noMeta = await send(handler, { jsonrpc: '2.0', id: 1, method: 'tools/list' }, { 'mcp-protocol-version': '2026-07-28', 'mcp-method': 'tools/list' });
        check('cabeçalho moderno sem _meta: 400 e -32602', [noMeta.status, noMeta.json.error.code], [400, -32602]);
        const noCaps = await send(handler, { jsonrpc: '2.0', id: 1, method: 'tools/list', params: { _meta: { 'io.modelcontextprotocol/protocolVersion': '2026-07-28' } } }, { 'mcp-protocol-version': '2026-07-28', 'mcp-method': 'tools/list' });
        check('sem clientCapabilities: 400 e -32602', [noCaps.status, noCaps.json.error.code], [400, -32602]);
        check('Mcp-Method diferente do corpo: -32020', (await modern(handler, 'tools/list', {}, { 'mcp-method': 'tools/call' })).json.error.code, -32020);
        check('Mcp-Name ausente em tools/call: -32020', (await send(handler, { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'endtimes_get_signs', _meta: META } }, { 'mcp-protocol-version': '2026-07-28', 'mcp-method': 'tools/call' })).json.error.code, -32020);
        check('Mcp-Name diferente do corpo: -32020', (await modern(handler, 'tools/call', { name: 'endtimes_get_signs' }, { 'mcp-name': 'endtimes_get_event' })).json.error.code, -32020);
        check('Mcp-Name em base64: aceito', (await modern(handler, 'tools/call', { name: 'endtimes_get_signs' }, { 'mcp-name': `=?base64?${btoa('endtimes_get_signs')}?=` })).json.result.isError, false);
        const unknownTool = await modern(handler, 'tools/call', { name: 'nope' });
        check('tool desconhecida moderna: -32602', unknownTool.json.error.code, -32602);
    }

    // ── tools/call: limite só conta tools/call, erro legível ─────────────────
    {
        const { handler, clock, calls } = makeHandler([row(1)], { limits: { perMinute: 2 } });
        const h = { 'cf-connecting-ip': '203.0.113.50' };
        for (let i = 0; i < 20; i++) {
            await legacy(handler, 'initialize', { protocolVersion: '2025-06-18' }, h);
            await legacy(handler, 'tools/list', undefined, h);
            await legacy(handler, 'ping', undefined, h);
            await modern(handler, 'server/discover', {}, h);
            await modern(handler, 'tools/list', {}, h);
        }
        const first = await call(handler, 'endtimes_get_signs', {}, h);
        const second = await call(handler, 'endtimes_get_signs', {}, h);
        const third = await call(handler, 'endtimes_get_signs', {}, h);
        check('limite: 100 chamadas de descoberta não gastam o limite', [first.isError, second.isError], [false, false]);
        check('limite: acima do limite, HTTP 200 e resultado normal com isError', [third.status, third.isError, 'error' in third.rpc], [200, true, false]);
        check('limite: código, texto legível e segundos', [third.body.error.code, third.body.error.message, third.body.error.retry_after_seconds], ['rate_limited', 'Rate limit reached. Try again in 60 seconds.', 60]);
        check('limite: chamada recusada não chega à fonte de dados', calls.signs, 1);
        check('limite: outro endereço continua passando', (await call(handler, 'endtimes_get_signs', {}, { 'cf-connecting-ip': '203.0.113.51' })).isError, false);
        check('limite: cabeçalho inventado não troca de balde', (await call(handler, 'endtimes_get_signs', {}, { ...h, 'x-forwarded-for': '8.8.8.8', 'x-real-ip': '8.8.4.4' })).body.error.code, 'rate_limited');
        const viaModern = await modern(handler, 'tools/call', { name: 'endtimes_get_signs' }, h);
        check('limite: mesmo formato na era moderna', [viaModern.status, viaModern.json.result.isError, JSON.parse(viaModern.json.result.content[0].text).error.code], [200, true, 'rate_limited']);
        clock.now += 60_000;
        check('limite: libera quando a janela vira', (await call(handler, 'endtimes_get_signs', {}, h)).isError, false);
    }

    // ── endtimes_get_signs ───────────────────────────────────────────────────
    {
        const { handler, clock, calls } = makeHandler();
        const r = await call(handler, 'endtimes_get_signs', {});
        const d = r.body.data;
        check('sinais: Ω, anômalos e regras', [d.omega.level, d.omega.anomalous_signs, d.omega.anomaly_percentile, d.omega.min_usable_signs], [3, ['wars', 'sea'], 90, 5]);
        check('sinais: tensão com rótulo e fonte', [d.tension.level, d.tension.label, d.tension.as_of, d.tension.source.url], [3, 'ELEVATED', '2026-11-16', 'https://www.matteoiacoviello.com/gpr.htm']);
        check('sinais: os 9, na ordem do site, mesmo os que faltam no arquivo', d.signs.map((s: { id: string }) => s.id), [...facts.SIGN_IDS]);
        check('sinais: leitura completa de um sinal', d.signs[1], { id: 'wars', name: 'Wars', scripture: 'Matthew 24:7', status: 'ok', counted_in_omega: true, value: 244579, baseline_mean: 110682, percentile: 94.4, anomalous: true, trend: 'up', period: '2025', baseline_span: '1989 to 2024', measure: facts.SIGNS.wars.measure, source: { name: 'UCDP / Our World in Data', url: 'https://ourworldindata.org/grapher/deaths-in-armed-conflicts-by-type' }, page: 'https://endtimes.live/en/signs/wars/' });
        check('sinais: mensagem de erro do coletor nunca sai', [d.signs[2].status, /ECONNRESET|collector\.internal|fetch failed/.test(JSON.stringify(r.body))], ['error', false]);
        check('sinais: sinal ausente no arquivo aparece como indisponível', [d.signs[3].status, d.signs[3].value], ['unavailable', null]);
        check('sinais: travessão da fonte vira texto simples', d.signs[6].source.name, 'Portas Abertas: Lista Mundial da Perseguição');
        check('sinais: extra numérico preservado', d.signs[8].extra, { groups: 7148 });
        check('sinais: envelope com frescor, fonte e aviso', [r.body.updated_at, r.body.source, r.body.notice, 'stale' in r.body], ['2026-11-22T00:50:26.870Z', { name: 'End Times Monitor', url: 'https://endtimes.live/en/signs/' }, facts.NOTICE, false]);
        check('sinais: argumento desconhecido vira erro legível', (await call(handler, 'endtimes_get_signs', { sign: 'wars' })).body.error, { code: 'invalid_input', message: 'Unknown argument: sign. This tool takes no arguments.' });
        await call(handler, 'endtimes_get_signs', {});
        await call(handler, 'endtimes_get_signs');
        check('sinais: chamadas repetidas leem a origem uma vez', calls.signs, 1);
        clock.now += TTL.signs + 1;
        await call(handler, 'endtimes_get_signs', {});
        check('sinais: depois do TTL lê de novo', calls.signs, 2);
        clock.now += 3 * 60 * 60 * 1000;
        check('sinais: leitura velha vem marcada como stale', (await call(handler, 'endtimes_get_signs', {})).body.stale, true);
        check('sinais: tamanho', r.size < 8000, true);
    }
    {
        const down = makeHandler([], { fail: true });
        const logged: string[] = [];
        const realError = console.error;
        console.error = (...a: unknown[]) => { logged.push(a.join(' ')); };
        const r = await call(down.handler, 'endtimes_get_signs', {});
        console.error = realError;
        check('erro inesperado: o log tem a tool e a classe do erro, sem argumentos nem mensagem', logged, ['mcp: endtimes_get_signs failed: Error']);
        check('erro inesperado: mensagem genérica, sem detalhe', [r.isError, r.body.error], [true, { code: 'internal_error', message: 'Internal error. Try again in a moment.' }]);
        const server = createServer({ fetchFn: (async () => { throw new TypeError('connect ECONNREFUSED 10.0.0.1:5432'); }) as unknown as typeof fetch });
        const s = await call(server, 'endtimes_get_signs', {});
        check('origem fora do ar: source_unavailable com espera, sem vazar o erro', s.body.error, { code: 'source_unavailable', message: 'The data source did not answer. Try again in 60 seconds.', retry_after_seconds: 60 });
        const bad = createServer({ fetchFn: (async () => new Response('<html>502</html>', { status: 502 })) as unknown as typeof fetch });
        check('origem com erro HTTP: source_unavailable', (await call(bad, 'endtimes_search_events', {})).body.error.code, 'source_unavailable');
    }

    // ── endtimes_get_signs_history ───────────────────────────────────────────
    {
        const { handler, calls } = makeHandler();
        const r = await call(handler, 'endtimes_get_signs_history', {});
        check('histórico: 30 dias por padrão, mais novo primeiro', [r.body.data.length, r.body.data[0].date, r.body.data[29].date], [30, '2026-11-22', '2026-10-24']);
        check('histórico: linha', r.body.data[0], { date: '2026-11-22', omega: 3, tension: 3, percentiles: { earthquakes: 97, wars: 94.4, persecution: null } });
        check('histórico: resumo do período inteiro', r.body.summary, { from: '2026-10-06', to: '2026-11-22', days: 48, omega_first: 2, omega_last: 3, omega_min: 2, omega_max: 3, omega_days_at_level: { '2': 20, '3': 28 }, tension_first: 3, tension_last: 3 });
        check('histórico: período disponível e paginação', [r.body.available, r.body.has_more, typeof r.body.next_cursor], [{ from: '2026-10-06', to: '2026-11-22', days: 48 }, true, 'string']);
        const p2 = await call(handler, 'endtimes_get_signs_history', { cursor: r.body.next_cursor });
        check('histórico: página 2 continua sem repetir', [p2.body.data[0].date, p2.body.data.length, p2.body.has_more, 'next_cursor' in p2.body], ['2026-10-23', 18, false, false]);
        const ranged = await call(handler, 'endtimes_get_signs_history', { from: '2026-11-01', to: '2026-11-10', limit: 90 });
        check('histórico: intervalo', [ranged.body.data.length, ranged.body.summary.from, ranged.body.summary.to, ranged.body.has_more], [10, '2026-11-01', '2026-11-10', false]);
        const empty = await call(handler, 'endtimes_get_signs_history', { from: '2020-01-01', to: '2020-01-31' });
        check('histórico: fora do período é sucesso vazio com explicação', [empty.isError, empty.body.data, empty.body.message], [false, [], 'No daily readings in the requested range. Readings are available from 2026-10-06 to 2026-11-22.']);
        check('histórico: from depois de to', (await call(handler, 'endtimes_get_signs_history', { from: '2026-11-10', to: '2026-11-01' })).body.error.code, 'invalid_input');
        check('histórico: limite fora da faixa', (await call(handler, 'endtimes_get_signs_history', { limit: 91 })).body.error.message, '"limit" must be from 1 to 90 (received 91).');
        check('histórico: cursor inválido', (await call(handler, 'endtimes_get_signs_history', { cursor: 'not-a-cursor' })).body.error, { code: 'invalid_cursor', message: 'The cursor is not valid. Call again without cursor to start from the first page.' });
        check('histórico: uma leitura da origem para todas as consultas', calls.history, 1);
        const max = await call(handler, 'endtimes_get_signs_history', { limit: 90 });
        check('histórico: página máxima cabe no orçamento', [max.body.data.length, max.size < MAX_RESPONSE_CHARS], [48, true]);
        check('histórico: envelope', [typeof max.body.updated_at, max.body.source.url, max.body.notice], ['string', 'https://endtimes.live/en/signs/history/', facts.NOTICE]);
    }

    // ── endtimes_search_events ───────────────────────────────────────────────
    {
        const rows = [
            ...Array.from({ length: 60 }, (_, i) => row(i + 1, i === 0 ? FORBIDDEN : {})),
            row(100, { source_type: 'TELEGRAM', source_name: '@channel', source_url: 'https://t.me/s/channel/5', title: 'channel post' }),
            row(101, { category: 'PANDEMIC', title: 'Outbreak' }),
        ];
        const { handler, clock, calls } = makeHandler(rows);
        const r = await call(handler, 'endtimes_search_events', {});
        check('eventos: 20 por padrão, mais novo primeiro', [r.body.data.length, r.body.data[0].id, r.body.has_more, r.body.total], [20, uuid(1), true, 62]);
        check('eventos: item', r.body.data[0], { id: uuid(1), title: 'Headline 1', excerpt: 'Excerpt of event 1.', category: 'CONFLICT', severity: 'HIGH', location: 'Ukraine', lat: 48.38, lng: 31.17, occurred_at: new Date(NOW - 60_000).toISOString(), source: { name: 'Kyiv Independent', url: 'https://kyivindependent.com/story-1' } });
        check('eventos: nada interno na resposta', /metadata|chat_id|collector|TELEGRAM|nominatim|model text|geocod|priority|fetched_at|source_type/.test(JSON.stringify(r.body)), false);
        check('eventos: envelope', [r.body.event_link, r.body.source.name, r.body.notice, typeof r.body.updated_at], ['https://endtimes.live/?tab=map&event={id}', 'End Times Monitor', facts.NOTICE, 'string']);
        check('eventos: pede uma linha a mais para saber se há outra página', calls.queries[0].limit, 21);
        const seen = new Set<string>(r.body.data.map((e: { id: string }) => e.id));
        let cursor = r.body.next_cursor, pages = 1, leaked = false;
        while (cursor && pages < 10) {
            const p = await call(handler, 'endtimes_search_events', { cursor });
            for (const e of p.body.data) { if (seen.has(e.id)) leaked = true; seen.add(e.id); if (e.title === 'channel post') leaked = true; }
            check(`eventos: página ${pages + 1} não repete o total`, 'total' in p.body, false);
            cursor = p.body.next_cursor; pages++;
        }
        check('eventos: paginação percorre tudo sem repetir, sem o post de canal', [seen.size, pages, leaked], [61, 4, false]);
        const before = calls.search;
        await call(handler, 'endtimes_search_events', {});
        await call(handler, 'endtimes_search_events', { limit: 20 });
        check('eventos: chamada idêntica (padrão explícito ou não) vem do cache', calls.search, before);
        await call(handler, 'endtimes_search_events', { location: 'Ukraine' });
        await call(handler, 'endtimes_search_events', { location: ' ukraine ' });
        check('eventos: texto em outra caixa usa a mesma entrada de cache', calls.search, before + 1);
        clock.now += TTL.events + 1;
        await call(handler, 'endtimes_search_events', {});
        check('eventos: depois do TTL consulta de novo', calls.search, before + 2);
        const cat = await call(handler, 'endtimes_search_events', { category: 'epidemic', min_severity: 'ELEVATED', since: '2026-11-01', until: '2026-11-22' });
        const q = calls.queries[calls.queries.length - 1];
        check('eventos: categoria inclui o nome legado; severidade mínima; datas', [q.categories, q.severities, q.since, q.before], [['EPIDEMIC', 'PANDEMIC'], ['ELEVATED', 'HIGH'], '2026-11-01T00:00:00Z', '2026-11-23T00:00:00Z']);
        check('eventos: categoria legada sai com o nome atual', cat.body.data.map((e: { category: string }) => e.category), ['EPIDEMIC']);
        const none = await call(handler, 'endtimes_search_events', { category: 'FIRES' });
        check('eventos: sem resultado é sucesso vazio com explicação', [none.isError, none.body.data, none.body.total, none.body.has_more, typeof none.body.message], [false, [], 0, false, 'string']);
        check('eventos: argumento desconhecido', (await call(handler, 'endtimes_search_events', { country: 'UA' })).body.error.code, 'invalid_input');
        check('eventos: limite fora da faixa', (await call(handler, 'endtimes_search_events', { limit: 500 })).body.error.message, '"limit" must be from 1 to 50 (received 500).');
        check('eventos: since depois de until', (await call(handler, 'endtimes_search_events', { since: '2026-11-22', until: '2026-11-01' })).body.error.code, 'invalid_input');
        check('eventos: cursor adulterado', [(await call(handler, 'endtimes_search_events', { cursor: 'AAAA' })).body.error.code, (await call(handler, 'endtimes_search_events', { cursor: encodeCursor({ t: 'x', i: 'y' }) })).body.error.code], ['invalid_cursor', 'invalid_cursor']);
    }
    {
        const fat = Array.from({ length: 50 }, (_, i) => row(i + 1, { title: 'T'.repeat(300), description: 'word '.repeat(200), location: 'L'.repeat(300), source_name: 'S'.repeat(200), source_url: `https://example.org/${'p'.repeat(400)}` }));
        const { handler } = makeHandler(fat);
        const r = await call(handler, 'endtimes_search_events', { limit: 50 });
        check('orçamento: resposta nunca passa de 25.000 caracteres', r.size <= MAX_RESPONSE_CHARS, true);
        check('orçamento: reduz itens inteiros e segue paginável', [r.body.data.length < 50, r.body.data.length > 0, r.body.has_more, typeof r.body.next_cursor, r.body.data.every((e: { excerpt: string }) => e.excerpt.length <= 280)], [true, true, true, 'string', true]);
        const next = await call(handler, 'endtimes_search_events', { limit: 50, cursor: r.body.next_cursor });
        check('orçamento: a página seguinte começa no item que ficou de fora', next.body.data[0].id, uuid(r.body.data.length + 1));
    }

    // ── endtimes_get_event ───────────────────────────────────────────────────
    {
        const { handler, calls } = makeHandler([row(1, FORBIDDEN), row(2, { source_type: 'TELEGRAM', source_name: '@channel' })]);
        const r = await call(handler, 'endtimes_get_event', { id: uuid(1).toUpperCase() });
        check('evento por id: campos públicos e link do site', [Object.keys(r.body.data), r.body.data.url], [['id', 'title', 'excerpt', 'category', 'severity', 'location', 'lat', 'lng', 'occurred_at', 'source', 'url'], `https://endtimes.live/?tab=map&event=${uuid(1)}`]);
        check('evento por id: nada interno', /metadata|chat_id|collector|nominatim|model text/.test(JSON.stringify(r.body)), false);
        await call(handler, 'endtimes_get_event', { id: uuid(1) });
        check('evento por id: repetição vem do cache', calls.event, 1);
        const missing = await call(handler, 'endtimes_get_event', { id: uuid(999) });
        check('evento por id: inexistente', [missing.isError, missing.body.error.code], [true, 'not_found']);
        check('evento por id: post de canal responde como inexistente', (await call(handler, 'endtimes_get_event', { id: uuid(2) })).body.error.code, 'not_found');
        check('evento por id: id inválido', (await call(handler, 'endtimes_get_event', { id: '1; drop table events' })).body.error.code, 'invalid_input');
        check('evento por id: sem id', (await call(handler, 'endtimes_get_event', {})).body.error.message, '"id" is required.');
    }

    console.log(failures ? `\n${failures} teste(s) falharam` : '\nTodos os testes do MCP passaram');
    process.exit(failures ? 1 : 0);
}

main();
