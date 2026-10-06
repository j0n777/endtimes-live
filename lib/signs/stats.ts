// Funções puras do índice Ω. Sem I/O: testadas em tests/test-signs-stats.ts.
import type { IndexLevel, SignReading, SignTrend, TensionMarket } from './types';

export const DAY_MS = 86_400_000;

export const dayIndex = (d: Date | string | number): number =>
    Math.floor(new Date(d).getTime() / DAY_MS);

/** Posição de `value` na amostra, 0–100. Empates contam meio. */
export function percentileRank(value: number, sample: number[]): number | null {
    if (sample.length === 0) return null;
    let below = 0;
    let equal = 0;
    for (const s of sample) {
        if (s < value) below++;
        else if (s === value) equal++;
    }
    return Math.round(((below + 0.5 * equal) / sample.length) * 1000) / 10;
}

export function mean(sample: number[]): number | null {
    if (sample.length === 0) return null;
    return sample.reduce((a, b) => a + b, 0) / sample.length;
}

/** Atual vs. anterior: muda de "flat" só acima de ±tolerance (10% por padrão). */
export function trendOf(current: number, previous: number, tolerance = 0.1): SignTrend {
    if (previous === 0) return current > 0 ? 'up' : 'flat';
    const ratio = (current - previous) / Math.abs(previous);
    if (ratio > tolerance) return 'up';
    if (ratio < -tolerance) return 'down';
    return 'flat';
}

/**
 * Contagem em janelas móveis de `window` dias, passo diário, terminando em cada dia
 * de [fromDay + window − 1, toDay]. `days` são índices de dia (dayIndex) dos eventos.
 */
export function rollingWindowCounts(days: number[], fromDay: number, toDay: number, window: number): number[] {
    const span = toDay - fromDay + 1;
    if (span < window) return [];
    const perDay = new Array<number>(span).fill(0);
    for (const d of days) {
        if (d >= fromDay && d <= toDay) perDay[d - fromDay]++;
    }
    const counts: number[] = [];
    let running = 0;
    for (let i = 0; i < span; i++) {
        running += perDay[i];
        if (i >= window) running -= perDay[i - window];
        if (i >= window - 1) counts.push(running);
    }
    return counts;
}

export const ANOMALY_PERCENTILE = 90;
export const MIN_USABLE_SIGNS = 5;

/**
 * Ω = convergência de sinais anômalos, não soma de manchetes.
 * Com 7 sinais independentes, P(nenhum no p90) ≈ 48%, P(≥3) ≈ 2,6% — o nível alto
 * é raro por construção, então quando acende significa alguma coisa.
 *   1 WATCHMAN    nenhum sinal anômalo
 *   2 SIGNS       1 sinal anômalo
 *   3 BIRTH PANGS 2 sinais anômalos
 *   4 TRIBULATION 3 ou mais
 *   5 MARANATHA   ≥ 70% dos sinais anômalos E a maioria em alta (as dores se aproximando)
 */
export function computeOmega(signs: SignReading[]) {
    const usable = signs.filter(s => s.status === 'ok' && s.percentile !== null);
    const anomalous = usable.filter(s => (s.percentile as number) >= ANOMALY_PERCENTILE);
    const rising = usable.filter(s => s.trend === 'up').length;

    let level: IndexLevel | null = null;
    if (usable.length >= MIN_USABLE_SIGNS) {
        const k = anomalous.length;
        level = k >= 3 ? 4 : k === 2 ? 3 : k === 1 ? 2 : 1;
        if (k >= Math.ceil(usable.length * 0.7) && rising > usable.length / 2) level = 5;
    }
    return { level, anomalous: anomalous.map(s => s.id), usable: usable.length, rising };
}

/** Tensão Militar pela maior probabilidade entre mercados de escalada: 1 baixa … 5 crítica. */
export function tensionLevel(maxProbability: number | null): IndexLevel | null {
    if (maxProbability === null) return null;
    if (maxProbability >= 0.5) return 5;
    if (maxProbability >= 0.3) return 4;
    if (maxProbability >= 0.15) return 3;
    if (maxProbability >= 0.05) return 2;
    return 1;
}

// Perguntas de mercado que, se resolvidas "Yes", significam escalada militar.
const ESCALATION = /\b(invade|invasion|war (with|on)|declare war|military (action|strike|clash)|strikes? on|attacks? on|nuclear (test|weapon|strike|detonation))\b/i;
export const MIN_MARKET_VOLUME = 500_000;

export function pickEscalationMarkets(events: any[], now: Date): TensionMarket[] {
    const markets: TensionMarket[] = [];
    for (const event of events) {
        for (const m of event?.markets ?? []) {
            if (!m?.active || m?.closed || !ESCALATION.test(m?.question ?? '')) continue;
            if (Number(m.volume ?? 0) < MIN_MARKET_VOLUME) continue;
            if (m.endDate && new Date(m.endDate).getTime() <= now.getTime()) continue;
            let outcomes: string[];
            let prices: string[];
            try {
                outcomes = JSON.parse(m.outcomes);
                prices = JSON.parse(m.outcomePrices);
            } catch {
                continue;
            }
            if (outcomes?.[0] !== 'Yes') continue;
            const probability = Number(prices?.[0]);
            if (!Number.isFinite(probability)) continue;
            markets.push({
                question: m.question,
                probability,
                monthChange: m.oneMonthPriceChange === undefined || m.oneMonthPriceChange === null ? null : Number(m.oneMonthPriceChange),
                volume: Number(m.volume),
                url: `https://polymarket.com/event/${event.slug}`,
            });
        }
    }
    return markets.sort((a, b) => b.probability - a.probability);
}

/** Parser de CSV com aspas (OWID tem nomes como "Korea, North"). */
export function parseCsvLine(line: string): string[] {
    const out: string[] = [];
    let cur = '';
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (quoted) {
            if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
            else if (c === '"') quoted = false;
            else cur += c;
        } else if (c === '"') quoted = true;
        else if (c === ',') { out.push(cur); cur = ''; }
        else cur += c;
    }
    out.push(cur);
    return out;
}
