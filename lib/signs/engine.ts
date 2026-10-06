// Motor do índice Ω (06/10/2026). Cada sinal vem de uma fonte primária com
// histórico e é medido contra o PRÓPRIO passado (percentil), não pelo volume de
// notícias. O Ω antigo (utils/omegaCalculator) somava contagens do feed e ficava
// travado em MARANATHA: medido em 06/10/2026, 73,4/100 com 2 fatores saturados,
// num mês em que os terremotos M6+ estavam em 0,33× da média histórica.
//
// Roda no worker (Node 22, fetch global). Uma fonte que falha vira status 'error'
// no seu sinal e o resto segue; nada aqui lança exceção para o chamador.
import {
    DAY_MS, computeOmega, dayIndex, mean, parseCsvLine, percentileRank,
    pickEscalationMarkets, rollingWindowCounts, tensionLevel, trendOf,
} from './stats';
import type { SignId, SignReading, SignsPayload } from './types';

const TIMEOUT_MS = 45_000;
const UA = 'EndTimesMonitor/1.0 (+https://endtimes.live)';

async function fetchText(url: string): Promise<{ status: number; body: string }> {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(TIMEOUT_MS) });
    const body = res.status === 204 ? '' : await res.text();
    if (res.status !== 200 && res.status !== 204) throw new Error(`HTTP ${res.status} em ${new URL(url).host}`);
    return { status: res.status, body };
}

async function fetchJson(url: string): Promise<any> {
    const { body } = await fetchText(url);
    return JSON.parse(body);
}

const isoDay = (d: Date) => d.toISOString().slice(0, 10);
const daysAgo = (now: Date, n: number) => new Date(now.getTime() - n * DAY_MS);
const round1 = (n: number | null) => (n === null ? null : Math.round(n * 10) / 10);

function base(id: SignId, sourceName: string, sourceUrl: string): SignReading {
    return {
        id, status: 'ok', value: null, baselineMean: null, percentile: null, trend: null,
        period: null, baselineSpan: null, sourceName, sourceUrl,
    };
}

// ── Lc 21:11 — terremotos ─────────────────────────────────────────────────────
// M6+ nos últimos 30 dias vs. todas as janelas de 30 dias de 2000 até o fim do ano passado.
async function readEarthquakes(now: Date): Promise<SignReading> {
    const r = base('earthquakes', 'USGS', 'https://earthquake.usgs.gov/earthquakes/map/');
    const lastYear = now.getUTCFullYear() - 1;
    const histUrl = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=csv&minmagnitude=6&starttime=2000-01-01&endtime=${lastYear + 1}-01-01&orderby=time-asc`;
    const countUrl = (from: Date, to: Date) =>
        `https://earthquake.usgs.gov/fdsnws/event/1/count?format=geojson&minmagnitude=6&starttime=${from.toISOString()}&endtime=${to.toISOString()}`;

    const [hist, cur, prev] = await Promise.all([
        fetchText(histUrl),
        fetchJson(countUrl(daysAgo(now, 30), now)),
        fetchJson(countUrl(daysAgo(now, 60), daysAgo(now, 30))),
    ]);
    const lines = hist.body.trim().split('\n').slice(1);
    const days = lines.map(l => dayIndex(l.slice(0, l.indexOf(','))));
    const sample = rollingWindowCounts(days, dayIndex('2000-01-01'), dayIndex(`${lastYear}-12-31`), 30);

    r.value = Number(cur.count);
    r.baselineMean = round1(mean(sample));
    r.percentile = percentileRank(r.value, sample);
    r.trend = trendOf(r.value, Number(prev.count));
    r.period = '30d';
    r.baselineSpan = `2000–${lastYear}`;
    return r;
}

// ── Mt 24:7 — nação contra nação ──────────────────────────────────────────────
// Mortes em conflitos armados no mundo (UCDP, via Our World in Data). Dado anual.
async function readWars(): Promise<SignReading> {
    const r = base('wars', 'UCDP / Our World in Data', 'https://ourworldindata.org/grapher/deaths-in-armed-conflicts-by-type');
    const { body } = await fetchText('https://ourworldindata.org/grapher/deaths-in-armed-conflicts-by-type.csv?v=1&csvType=full&useColumnShortNames=true');
    const rows = body.trim().split('\n').map(parseCsvLine);
    const header = rows[0];
    const yearCol = header.indexOf('year');
    const typeCols = header.map((h, i) => (h.startsWith('number_deaths') ? i : -1)).filter(i => i >= 0);
    const series = rows.slice(1)
        .filter(c => c[0] === 'World')
        .map(c => ({ year: Number(c[yearCol]), deaths: typeCols.reduce((s, i) => s + (Number(c[i]) || 0), 0) }))
        .sort((a, b) => a.year - b.year);
    if (series.length < 10) throw new Error(`série curta (${series.length} anos)`);

    const latest = series[series.length - 1];
    const sample = series.slice(0, -1).map(s => s.deaths);
    r.value = latest.deaths;
    r.baselineMean = Math.round(mean(sample) as number);
    r.percentile = percentileRank(latest.deaths, sample);
    r.trend = trendOf(latest.deaths, series[series.length - 2].deaths);
    r.period = String(latest.year);
    r.baselineSpan = `${series[0].year}–${latest.year - 1}`;
    return r;
}

// ── Ap 6:6 — "um queniz de trigo por um denário" ─────────────────────────────
// Índice FAO de Preços de Alimentos (nominal, 2014–2016 = 100) vs. os 10 anos anteriores.
// A janela de 10 anos limita o viés de inflação; o índice real (deflacionado) só sai em xlsx.
async function readFamine(): Promise<SignReading> {
    const r = base('famine', 'FAO Food Price Index', 'https://www.fao.org/worldfoodsituation/foodpricesindex/en/');
    const { body } = await fetchText('https://www.fao.org/media/docs/worldfoodsituationlibraries/wfs-library/food_price_indices_data.csv');
    const lines = body.replace(/^﻿/, '').split(/\r?\n/).map(parseCsvLine);
    const headerAt = lines.findIndex(c => c[0] === 'Date');
    if (headerAt < 0) throw new Error('cabeçalho Date não encontrado no CSV da FAO');
    const series = lines.slice(headerAt + 1)
        .filter(c => /^\d{4}-\d{2}$/.test(c[0]) && Number.isFinite(parseFloat(c[1])))
        .map(c => ({ month: c[0], index: parseFloat(c[1]) }));
    if (series.length < 124) throw new Error(`série curta (${series.length} meses)`);

    const latest = series[series.length - 1];
    const window = series.slice(-121, -1);
    const sample = window.map(s => s.index);
    r.value = latest.index;
    r.baselineMean = round1(mean(sample));
    r.percentile = percentileRank(latest.index, sample);
    r.trend = trendOf(latest.index, series[series.length - 4].index, 0.03);
    r.period = latest.month;
    r.baselineSpan = `${window[0].month}–${window[window.length - 1].month}`;
    return r;
}

// ── Lc 21:11 — pestes ─────────────────────────────────────────────────────────
// Alertas oficiais de surto da OMS (Disease Outbreak News) em 90 dias vs. a mesma
// janela nos 6 anos anteriores. Baseline curto de propósito: a OMS publica bem menos
// DONs hoje do que há 10 anos (38 na janela de 2015 contra 6 na de 2026), e um
// histórico longo leria essa mudança editorial como "pestes em queda".
const PESTILENCE_YEARS = 6;
async function readPestilence(now: Date): Promise<SignReading> {
    const r = base('pestilence', 'WHO Disease Outbreak News', 'https://www.who.int/emergencies/disease-outbreak-news');
    const count = async (from: Date, to: Date) => {
        const filter = encodeURIComponent(`PublicationDateAndTime ge ${from.toISOString()} and PublicationDateAndTime lt ${to.toISOString()}`);
        const json = await fetchJson(`https://www.who.int/api/news/diseaseoutbreaknews?sf_culture=en&$filter=${filter}&$count=true&$top=1&$select=PublicationDateAndTime`);
        const n = json?.['@odata.count'];
        if (typeof n !== 'number') throw new Error('resposta da OMS sem @odata.count');
        return n;
    };
    const shift = (d: Date, years: number) => { const c = new Date(d); c.setUTCFullYear(c.getUTCFullYear() - years); return c; };
    const from = daysAgo(now, 90);
    const years = Array.from({ length: PESTILENCE_YEARS }, (_, i) => i + 1);

    const [current, previous, ...sample] = await Promise.all([
        count(from, now),
        count(daysAgo(now, 180), from),
        ...years.map(y => count(shift(from, y), shift(now, y))),
    ]);
    r.value = current;
    r.baselineMean = round1(mean(sample));
    r.percentile = percentileRank(current, sample);
    r.trend = trendOf(current, previous);
    r.period = '90d';
    r.baselineSpan = `${now.getUTCFullYear() - PESTILENCE_YEARS}–${now.getUTCFullYear() - 1}`;
    return r;
}

// ── Lc 21:11, 21:25 — sinais no sol ──────────────────────────────────────────
// Dias com tempestade geomagnética (Kp máximo do dia ≥ 5, G1+) em 30 dias vs. todas
// as janelas de 30 dias desde 1995. Kp oficial do GFZ Potsdam.
async function readHeavens(now: Date): Promise<SignReading> {
    const r = base('heavens', 'GFZ Potsdam (Kp)', 'https://kp.gfz-potsdam.de/en/');
    const json = await fetchJson(`https://kp.gfz-potsdam.de/app/json/?start=1995-01-01T00:00:00Z&end=${now.toISOString().slice(0, 19)}Z&index=Kp`);
    const times: string[] = json?.datetime ?? [];
    const kp: number[] = json?.Kp ?? [];
    if (times.length < 1000) throw new Error('série Kp vazia');

    const dailyMax = new Map<number, number>();
    times.forEach((t, i) => {
        const d = dayIndex(t);
        dailyMax.set(d, Math.max(dailyMax.get(d) ?? 0, kp[i]));
    });
    const stormDays = [...dailyMax].filter(([, max]) => max >= 5).map(([d]) => d);

    const today = dayIndex(now);
    const inRange = (a: number, b: number) => stormDays.filter(d => d > a && d <= b).length;
    const sample = rollingWindowCounts(stormDays, dayIndex('1995-01-01'), today - 31, 30);

    r.value = inRange(today - 30, today);
    r.baselineMean = round1(mean(sample));
    r.percentile = percentileRank(r.value, sample);
    r.trend = trendOf(r.value, inRange(today - 60, today - 30));
    r.period = '30d';
    r.baselineSpan = `1995–${new Date((today - 31) * DAY_MS).getUTCFullYear()}`;
    return r;
}

// ── Lc 21:25 — "bramido do mar e das ondas" ──────────────────────────────────
// Ciclones tropicais com alerta laranja ou vermelho (GDACS) em 90 dias vs. a mesma
// janela sazonal (ciclones têm temporada) nos anos anteriores. A busca do GDACS tem
// dado desde 2012 (testado em 06/10/2026: 2012/2016/2020 respondem, 2008 dá 204) e só
// com eventlist=TC — "TC;TS" devolve 204 em qualquer ano. Anos sem dado são
// descartados; com menos de 4 anos o sinal fica fora do Ω como 'short-baseline'.
const SEA_YEARS = 14;
const SEA_MIN_YEARS = 4;
async function readSea(now: Date): Promise<SignReading> {
    const r = base('sea', 'GDACS', 'https://www.gdacs.org/');
    const count = async (from: Date, to: Date): Promise<number | null> => {
        const { status, body } = await fetchText(`https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventlist=TC&fromDate=${isoDay(from)}&toDate=${isoDay(to)}&alertlevel=Orange;Red`);
        if (status === 204 || !body) return null;
        return (JSON.parse(body)?.features ?? []).length;
    };
    const shift = (d: Date, years: number) => { const c = new Date(d); c.setUTCFullYear(c.getUTCFullYear() - years); return c; };
    const from = daysAgo(now, 90);
    const years = Array.from({ length: SEA_YEARS }, (_, i) => i + 1);

    const [current, previous, ...past] = await Promise.all([
        count(from, now),
        count(daysAgo(now, 180), from),
        ...years.map(y => count(shift(from, y), shift(now, y)).catch(() => null)),
    ]);
    const sample = past.filter((n): n is number => n !== null);
    const sampledYears = years.filter((_, i) => past[i] !== null).map(y => now.getUTCFullYear() - y);
    // A janela atual sempre tem dado; 204 aqui significa zero ciclones nesse período.
    r.value = current ?? 0;
    r.baselineMean = round1(mean(sample));
    r.percentile = percentileRank(r.value, sample);
    r.trend = trendOf(r.value, previous ?? 0);
    r.period = '90d';
    r.baselineSpan = sampledYears.length ? `${Math.min(...sampledYears)}–${Math.max(...sampledYears)}` : null;
    if (sample.length < SEA_MIN_YEARS) r.status = 'short-baseline';
    return r;
}

// ── Mt 24:9 — perseguição ────────────────────────────────────────────────────
// Sem fonte primária com histórico consultável: a Lista Mundial da Perseguição
// (Portas Abertas) é anual e não tem API. Fica visível, fora do Ω.
async function readPersecution(): Promise<SignReading> {
    const r = base('persecution', 'Portas Abertas — Lista Mundial da Perseguição', 'https://www.portasabertas.org.br/lista-mundial');
    r.status = 'unavailable';
    return r;
}

// ── Lc 21:25 — "angústia das nações em perplexidade" ─────────────────────────
// VIX (volatilidade implícita do S&P 500, o "índice do medo") vs. todo fechamento desde 1990.
async function readDistress(): Promise<SignReading> {
    const r = base('distress', 'CBOE VIX', 'https://www.cboe.com/tradable_products/vix/');
    const { body } = await fetchText('https://cdn.cboe.com/api/global/us_indices/daily_prices/VIX_History.csv');
    const series = body.trim().split('\n').slice(1).map(parseCsvLine)
        .map(c => ({ date: c[0], close: parseFloat(c[4]) }))
        .filter(s => Number.isFinite(s.close));
    if (series.length < 1000) throw new Error('série VIX curta');

    const latest = series[series.length - 1];
    const sample = series.slice(0, -1).map(s => s.close);
    const [m, d, y] = latest.date.split('/');
    r.value = round1(latest.close);
    r.baselineMean = round1(mean(sample));
    r.percentile = percentileRank(latest.close, sample);
    r.trend = trendOf(latest.close, series[Math.max(0, series.length - 22)].close);
    r.period = `${y}-${m}-${d}`;
    r.baselineSpan = `${series[0].date.slice(-4)}–${y}`;
    return r;
}

const READERS: Array<{ id: SignId; read: (now: Date) => Promise<SignReading>; source: [string, string] }> = [
    { id: 'earthquakes', read: readEarthquakes, source: ['USGS', 'https://earthquake.usgs.gov/earthquakes/map/'] },
    { id: 'wars', read: readWars, source: ['UCDP / Our World in Data', 'https://ourworldindata.org/grapher/deaths-in-armed-conflicts-by-type'] },
    { id: 'famine', read: readFamine, source: ['FAO Food Price Index', 'https://www.fao.org/worldfoodsituation/foodpricesindex/en/'] },
    { id: 'pestilence', read: readPestilence, source: ['WHO Disease Outbreak News', 'https://www.who.int/emergencies/disease-outbreak-news'] },
    { id: 'heavens', read: readHeavens, source: ['GFZ Potsdam (Kp)', 'https://kp.gfz-potsdam.de/en/'] },
    { id: 'sea', read: readSea, source: ['GDACS', 'https://www.gdacs.org/'] },
    { id: 'persecution', read: readPersecution, source: ['Portas Abertas — Lista Mundial da Perseguição', 'https://www.portasabertas.org.br/lista-mundial'] },
    { id: 'distress', read: readDistress, source: ['CBOE VIX', 'https://www.cboe.com/tradable_products/vix/'] },
];

async function readTension(now: Date) {
    try {
        const events = await fetchJson('https://gamma-api.polymarket.com/events?tag_slug=geopolitics&active=true&closed=false&limit=100&order=volume&ascending=false');
        const markets = pickEscalationMarkets(Array.isArray(events) ? events : [], now).slice(0, 5);
        const maxProbability = markets.length ? markets[0].probability : null;
        return { level: tensionLevel(maxProbability), maxProbability, markets };
    } catch (err) {
        console.warn(`⚠️ SIGNS: Polymarket falhou: ${err instanceof Error ? err.message : err}`);
        return { level: null, maxProbability: null, markets: [] };
    }
}

export async function computeSigns(now = new Date()): Promise<SignsPayload> {
    const [signs, tension] = await Promise.all([
        Promise.all(READERS.map(async ({ id, read, source }) => {
            try {
                return await read(now);
            } catch (err) {
                const reading = base(id, source[0], source[1]);
                reading.status = 'error';
                reading.error = err instanceof Error ? err.message : String(err);
                console.warn(`⚠️ SIGNS: ${id} falhou: ${reading.error}`);
                return reading;
            }
        })),
        readTension(now),
    ]);
    return { version: 1, generatedAt: now.toISOString(), omega: computeOmega(signs), tension, signs };
}
