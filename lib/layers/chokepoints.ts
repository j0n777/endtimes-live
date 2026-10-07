// Gargalos marítimos (07/10/2026): travessias diárias de navios nos 28 estreitos e
// canais monitorados pelo IMF PortWatch, comparadas com a média do próprio histórico.
// Ideia vinda do trabalho do Bilawal Sidhu com o Estreito de Ormuz (spatialintelligence.ai),
// aqui com a série oficial do FMI em vez de AIS bruto: medido em 07/10/2026, Ormuz
// fazia 2,8 travessias/dia contra 83,7/dia em 2019–2025.
import type { ChokepointReading, ChokepointsPayload } from './types';

const BASE = 'https://services9.arcgis.com/weJ1QsnbMYJlCHdG/arcgis/rest/services';
const DAILY = `${BASE}/Daily_Chokepoints_Data/FeatureServer/0/query`;
const LOCATIONS = `${BASE}/PortWatch_chokepoints_database/FeatureServer/0/query`;
const WINDOW_DAYS = 7;
const TIMEOUT_MS = 45_000;

async function query(url: string, params: Record<string, string>): Promise<any[]> {
    const qs = new URLSearchParams({ ...params, f: 'json' });
    const res = await fetch(`${url}?${qs}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) throw new Error(`PortWatch HTTP ${res.status}`);
    const json = await res.json();
    if (json?.error) throw new Error(`PortWatch: ${json.error.message ?? JSON.stringify(json.error)}`);
    return (json?.features ?? []).map((f: any) => f.attributes);
}

interface Location { portid: string; portname: string; lat: number; lon: number }
interface Baseline { portid: string; avg_total: number }
interface DailyRow { portid: string; date: string; n_total: number }

/** Junta localização, média histórica e últimos dias. Pura: testada em tests/test-layers.ts. */
export function summarizeChokepoints(locations: Location[], baselines: Baseline[], recent: DailyRow[], windowDays = WINDOW_DAYS): ChokepointReading[] {
    const baseline = new Map(baselines.map(b => [b.portid, b.avg_total]));
    const byPort = new Map<string, DailyRow[]>();
    for (const row of recent) {
        if (!Number.isFinite(row.n_total)) continue;
        byPort.set(row.portid, [...(byPort.get(row.portid) ?? []), row]);
    }
    const out: ChokepointReading[] = [];
    for (const loc of locations) {
        const base = baseline.get(loc.portid);
        const rows = (byPort.get(loc.portid) ?? []).sort((a, b) => b.date.localeCompare(a.date)).slice(0, windowDays);
        if (!base || rows.length === 0) continue;
        const recentAvg = rows.reduce((s, r) => s + r.n_total, 0) / rows.length;
        out.push({
            id: loc.portid,
            name: loc.portname,
            lat: loc.lat,
            lon: loc.lon,
            recentAvg: Math.round(recentAvg * 10) / 10,
            baselineAvg: Math.round(base * 10) / 10,
            changePct: Math.round((recentAvg / base - 1) * 1000) / 10,
            lastDate: rows[0].date,
        });
    }
    return out.sort((a, b) => a.changePct - b.changePct);
}

export async function computeChokepoints(now = new Date()): Promise<ChokepointsPayload> {
    const lastYear = now.getUTCFullYear() - 1;
    const since = new Date(now.getTime() - 21 * 86_400_000).toISOString().slice(0, 10);
    const [locations, baselines, recent] = await Promise.all([
        query(LOCATIONS, { where: '1=1', outFields: 'portid,portname,lat,lon' }),
        query(DAILY, {
            where: `date >= DATE '2019-01-01' AND date < DATE '${lastYear + 1}-01-01'`,
            groupByFieldsForStatistics: 'portid',
            outStatistics: JSON.stringify([{ statisticType: 'avg', onStatisticField: 'n_total', outStatisticFieldName: 'avg_total' }]),
        }),
        query(DAILY, { where: `date >= DATE '${since}'`, outFields: 'portid,date,n_total', resultRecordCount: '2000' }),
    ]);
    return {
        version: 1,
        generatedAt: now.toISOString(),
        windowDays: WINDOW_DAYS,
        baselineSpan: `2019–${lastYear}`,
        // Termos do FMI (imf.org/en/about/copyright-and-terms): reuso livre com atribuição
        // "Source: International Monetary Fund, <base>, <link>"; uso comercial exige permissão.
        source: 'International Monetary Fund, PortWatch',
        sourceUrl: 'https://portwatch.imf.org/',
        chokepoints: summarizeChokepoints(locations, baselines, recent),
    };
}
