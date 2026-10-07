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
    rollingWindowCounts, tensionLevel, trailingMeans, trendOf,
} from './stats';
import type { Co2Reading, SignId, SignReading, SignsPayload } from './types';
import { countBetween, majorStormsFromCsv, mergeRecent, type StormCatalog } from './ibtracs';
import { readDta } from './stata';
import { publishData } from '../publishData';
import { readXlsxSheet } from './xlsx';

const TIMEOUT_MS = 45_000;
const UA = 'EndTimesMonitor/1.0 (+https://endtimes.live)';

async function fetchText(url: string): Promise<{ status: number; body: string }> {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(TIMEOUT_MS) });
    const body = res.status === 204 ? '' : await res.text();
    if (res.status !== 200 && res.status !== 204) throw new Error(`HTTP ${res.status} em ${new URL(url).host}`);
    return { status: res.status, body };
}

async function fetchBytes(url: string): Promise<Uint8Array> {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) throw new Error(`HTTP ${res.status} em ${new URL(url).host}`);
    return new Uint8Array(await res.arrayBuffer());
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
// Índice de preços de alimentos do Banco Mundial ("Pink Sheet", mensal desde 1960,
// 2010 = 100, US$ nominais), CC BY 4.0, vs. os 10 anos anteriores (a janela de 10 anos
// limita o viés de inflação).
// Substitui o índice da FAO (07/10/2026), cujo conteúdo é só para uso não comercial.
// O link da planilha muda a cada ano, então é lido da página de mercados.
const PINK_SHEET_PAGE = 'https://www.worldbank.org/en/research/commodity-markets';

async function readFamine(): Promise<SignReading> {
    const r = base('famine', 'World Bank Pink Sheet', PINK_SHEET_PAGE);
    const { body: page } = await fetchText(PINK_SHEET_PAGE);
    const url = page.match(/https:\/\/thedocs\.worldbank\.org\/[^"'\s]+CMO-Historical-Data-Monthly\.xlsx/)?.[0];
    if (!url) throw new Error('link da Pink Sheet mensal não encontrado');
    const rows = readXlsxSheet(await fetchBytes(url), 'Monthly Indices');
    const col = rows.slice(0, 15).map(row => row.findIndex(c => /^Food\b/.test(c.trim()))).find(c => c >= 0);
    if (col === undefined) throw new Error('coluna Food não encontrada na Pink Sheet');
    const series = rows
        .filter(row => /^\d{4}M\d{2}$/.test(row[0]) && Number.isFinite(parseFloat(row[col])))
        .map(row => ({ month: `${row[0].slice(0, 4)}-${row[0].slice(5)}`, index: parseFloat(row[col]) }));
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
// Ciclones tropicais que chegaram à categoria 3+ (NOAA IBTrACS) nos últimos 90 dias vs.
// a mesma janela sazonal (ciclones têm temporada) em cada ano desde 1981. O IBTrACS
// atualiza 3×/semana com até ~1 semana de atraso, e a parte recente é provisória.
// Para não baixar o arquivo completo (145 MB) a cada rodada, o worker guarda no Storage
// um catálogo compacto e só baixa o last3years (11 MB) quando a NOAA publica versão nova.
const IBTRACS_CSV = 'https://www.ncei.noaa.gov/data/international-best-track-archive-for-climate-stewardship-ibtracs/v04r01/access/csv';
const IBTRACS_PAGE = 'https://www.ncei.noaa.gov/products/international-best-track-archive';
const STORM_CATALOG_FILE = 'ibtracs-major.json';
const SEA_FIRST_YEAR = 1981;

async function loadStormCatalog(): Promise<Record<string, string>> {
    const storage = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    let catalog: StormCatalog | null = null;
    if (storage) {
        try {
            const res = await fetch(`${storage}/storage/v1/object/public/data/${STORM_CATALOG_FILE}?t=${Date.now()}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
            if (res.ok) catalog = await res.json();
        } catch { /* sem catálogo: reconstrói abaixo */ }
    }
    const head = await fetch(`${IBTRACS_CSV}/ibtracs.last3years.list.v04r01.csv`, { method: 'HEAD', headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(TIMEOUT_MS) });
    const modified = head.headers.get('last-modified');
    if (catalog?.storms && (!modified || modified === catalog.sourceModified)) return catalog.storms;

    let storms: Record<string, string>;
    if (catalog?.storms) {
        const { body } = await fetchText(`${IBTRACS_CSV}/ibtracs.last3years.list.v04r01.csv`);
        const recent = majorStormsFromCsv(body);
        storms = recent.firstDate ? mergeRecent(catalog.storms, recent.storms, recent.firstDate) : catalog.storms;
    } else {
        const { body } = await fetchText(`${IBTRACS_CSV}/ibtracs.since1980.list.v04r01.csv`);
        storms = majorStormsFromCsv(body).storms;
    }
    await publishData(STORM_CATALOG_FILE, { version: 1, builtAt: new Date().toISOString(), sourceModified: modified, storms } satisfies StormCatalog);
    return storms;
}

async function readSea(now: Date): Promise<SignReading> {
    const r = base('sea', 'NOAA IBTrACS', IBTRACS_PAGE);
    const dates = Object.values(await loadStormCatalog());
    const shiftDay = (d: Date, years: number) => { const c = new Date(d); c.setUTCFullYear(c.getUTCFullYear() - years); return isoDay(c); };
    const from = daysAgo(now, 90);
    const upTo = isoDay(new Date(now.getTime() + DAY_MS));
    const years = Array.from({ length: now.getUTCFullYear() - SEA_FIRST_YEAR }, (_, i) => i + 1);
    const sample = years.map(y => countBetween(dates, shiftDay(from, y), shiftDay(new Date(now.getTime() + DAY_MS), y)));

    r.value = countBetween(dates, isoDay(from), upTo);
    r.baselineMean = round1(mean(sample));
    r.percentile = percentileRank(r.value, sample);
    r.trend = trendOf(r.value, countBetween(dates, isoDay(daysAgo(now, 180)), isoDay(from)));
    r.period = '90d';
    r.baselineSpan = `${SEA_FIRST_YEAR}–${now.getUTCFullYear() - 1}`;
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
// Índice de Estresse Financeiro do OFR (Tesouro dos EUA; 0 = normal, positivo = estresse
// acima da média), diário desde 2000, vs. todo o histórico. Obra do governo federal
// americano, sem copyright. Substitui o VIX (07/10/2026), que exige licença da CBOE.
const OFR_FSI_PAGE = 'https://www.financialresearch.gov/financial-stress-index/';

async function readDistress(): Promise<SignReading> {
    const r = base('distress', 'OFR Financial Stress Index', OFR_FSI_PAGE);
    const { body } = await fetchText('https://www.financialresearch.gov/financial-stress-index/data/fsi.csv');
    const lines = body.trim().split(/\r?\n/).map(parseCsvLine);
    const col = lines[0]?.indexOf('OFR FSI') ?? -1;
    if (col < 0) throw new Error('coluna "OFR FSI" não encontrada');
    const series = lines.slice(1)
        .map(c => ({ date: c[0], value: parseFloat(c[col]) }))
        .filter(s => /^\d{4}-\d{2}-\d{2}$/.test(s.date) && Number.isFinite(s.value));
    if (series.length < 1000) throw new Error('série do OFR FSI curta');

    const latest = series[series.length - 1];
    const sample = series.slice(0, -1).map(s => s.value);
    const avg = mean(sample)!;
    const sd = Math.sqrt(sample.reduce((a, v) => a + (v - avg) ** 2, 0) / sample.length);
    // O índice oscila em torno de zero, então a tendência é pela diferença absoluta em
    // ~1 mês (21 pregões), com tolerância de ¼ de desvio-padrão, não pela razão.
    const delta = latest.value - series[Math.max(0, series.length - 22)].value;
    r.value = round1(latest.value);
    r.baselineMean = round1(avg);
    r.percentile = percentileRank(latest.value, sample);
    r.trend = delta > sd / 4 ? 'up' : delta < -sd / 4 ? 'down' : 'flat';
    r.period = latest.date;
    r.baselineSpan = `${series[0].date.slice(0, 4)}–${latest.date.slice(0, 4)}`;
    return r;
}

const READERS: Array<{ id: SignId; read: (now: Date) => Promise<SignReading>; source: [string, string] }> = [
    { id: 'earthquakes', read: readEarthquakes, source: ['USGS', 'https://earthquake.usgs.gov/earthquakes/map/'] },
    { id: 'wars', read: readWars, source: ['UCDP / Our World in Data', 'https://ourworldindata.org/grapher/deaths-in-armed-conflicts-by-type'] },
    { id: 'famine', read: readFamine, source: ['World Bank Pink Sheet', PINK_SHEET_PAGE] },
    { id: 'pestilence', read: readPestilence, source: ['WHO Disease Outbreak News', 'https://www.who.int/emergencies/disease-outbreak-news'] },
    { id: 'heavens', read: readHeavens, source: ['GFZ Potsdam (Kp)', 'https://kp.gfz-potsdam.de/en/'] },
    { id: 'sea', read: readSea, source: ['NOAA IBTrACS', IBTRACS_PAGE] },
    { id: 'persecution', read: readPersecution, source: ['Portas Abertas — Lista Mundial da Perseguição', 'https://www.portasabertas.org.br/lista-mundial'] },
    { id: 'distress', read: readDistress, source: ['OFR Financial Stress Index', OFR_FSI_PAGE] },
];

// CO₂ atmosférico diário em Mauna Loa (NOAA GML). Contexto do painel, não é sinal do Ω.
async function readCo2(): Promise<Co2Reading | null> {
    try {
        const { body } = await fetchText('https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_daily_mlo.csv');
        const rows = body.split('\n')
            .filter(l => l && !l.startsWith('#'))
            .map(l => l.split(','))
            .map(c => ({ date: `${c[0]}-${c[1].trim().padStart(2, '0')}-${c[2].trim().padStart(2, '0')}`, ppm: parseFloat(c[4]) }))
            .filter(r => Number.isFinite(r.ppm) && r.ppm > 0);
        const latest = rows[rows.length - 1];
        if (!latest) return null;
        const target = dayIndex(latest.date) - 365;
        const yearAgo = rows.reduce<typeof latest | null>((best, r) =>
            Math.abs(dayIndex(r.date) - target) < Math.abs(dayIndex(best?.date ?? '1900-01-01') - target) ? r : best, null);
        const yearAgoPpm = yearAgo && Math.abs(dayIndex(yearAgo.date) - target) <= 7 ? yearAgo.ppm : null;
        return { ppm: latest.ppm, date: latest.date, yearAgoPpm };
    } catch (err) {
        console.warn(`⚠️ SIGNS: CO₂ falhou: ${err instanceof Error ? err.message : err}`);
        return null;
    }
}

// ── Tensão Militar ───────────────────────────────────────────────────────────
// Sub-índice de AMEAÇAS do Geopolitical Risk Index (Caldara & Iacoviello): fração de
// notícias em 10 jornais sobre ameaças de guerra, diário desde 1985, CC BY. Substitui
// os mercados do Polymarket (07/10/2026), cujos termos não liberam uso comercial.
const GPR_PAGE = 'https://www.matteoiacoviello.com/gpr.htm';
const GPR_DAILY = 'https://www.matteoiacoviello.com/gpr_files/data_gpr_daily_recent.dta';
const STATA_EPOCH = Date.UTC(1960, 0, 1);

async function readTension(): Promise<SignsPayload['tension']> {
    try {
        const cols = readDta(await fetchBytes(GPR_DAILY));
        if (!cols.date || !cols.GPRD_THREAT) throw new Error('colunas date/GPRD_THREAT ausentes');
        const rows = cols.date
            .map((d, i) => ({ d, v: cols.GPRD_THREAT[i] }))
            .filter((r): r is { d: number; v: number } => r.d !== null && r.v !== null)
            .sort((a, b) => a.d - b.d);
        const means = trailingMeans(rows.map(r => r.v), 7);
        if (means.length < 3650) throw new Error(`série GPR curta (${means.length} dias)`);
        const latest = means[means.length - 1];
        const percentile = percentileRank(latest, means.slice(0, -1));
        return {
            level: tensionLevel(percentile),
            value: round1(latest),
            percentile,
            date: isoDay(new Date(STATA_EPOCH + rows[rows.length - 1].d * DAY_MS)),
            sourceUrl: GPR_PAGE,
        };
    } catch (err) {
        console.warn(`⚠️ SIGNS: GPR falhou: ${err instanceof Error ? err.message : err}`);
        return { level: null, value: null, percentile: null, date: null, sourceUrl: GPR_PAGE };
    }
}

export async function computeSigns(now = new Date()): Promise<SignsPayload> {
    const [signs, tension, co2] = await Promise.all([
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
        readTension(),
        readCo2(),
    ]);
    return { version: 1, generatedAt: now.toISOString(), context: { co2 }, omega: computeOmega(signs), tension, signs };
}
