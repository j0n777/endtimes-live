// Funções puras do alerta de apocalipse (testadas em tests/test-ews.ts).
import type { EwsCohortId, EwsCohortReading, EwsSample } from './types';

const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Hora da semana (0–167) no fuso dado: domingo 0h = 0. */
export function hourOfWeek(date: Date, timeZone: string): number {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short', hour: 'numeric', hourCycle: 'h23' })
        .formatToParts(date);
    const weekday = WEEKDAYS.indexOf(parts.find(p => p.type === 'weekday')?.value ?? '');
    const hour = Number(parts.find(p => p.type === 'hour')?.value);
    return weekday * 24 + hour;
}

/**
 * Nível 1–5 pelos desvios acima do esperado. Kyle McDonald usa 2σ como "elevado" e
 * 4σ como "alarme"; aqui cada desvio inteiro sobe um nível. Queda de tráfego não alarma.
 */
export function levelFromZ(z: number): 1 | 2 | 3 | 4 | 5 {
    if (z >= 4) return 5;
    if (z >= 3) return 4;
    if (z >= 2) return 3;
    if (z >= 1) return 2;
    return 1;
}

/**
 * Compara a contagem atual com as semanas anteriores na mesma hora da semana.
 * O desvio usado tem piso em √média (ruído de contagem), para madrugadas com poucos
 * jatos não dispararem por variações pequenas — o mesmo cuidado do modelo original.
 */
export function assessCohort(
    id: EwsCohortId, airborne: number | null, history: EwsSample[], now: Date, timeZone: string, minWeeks: number,
): EwsCohortReading {
    const slot = hourOfWeek(now, timeZone);
    const values: number[] = [];
    const weeks = new Set<number>();
    for (const s of history) {
        const v = s[id];
        const t = Date.parse(s.t);
        if (v == null || !Number.isFinite(t)) continue;
        const age = now.getTime() - t;
        if (age < 6 * DAY_MS) continue; // a semana corrente não entra na própria linha de base
        if (hourOfWeek(new Date(t), timeZone) !== slot) continue;
        values.push(v);
        weeks.add(Math.round(age / WEEK_MS)); // mesma hora da semana = k semanas ± menos de 1 h
    }
    if (!values.length) return { id, airborne, expected: null, z: null, level: null, weeks: 0 };

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const sd = Math.sqrt(values.reduce((a, v) => a + (v - mean) ** 2, 0) / values.length);
    const expected = Math.round(mean);
    if (airborne == null || weeks.size < minWeeks) return { id, airborne, expected, z: null, level: null, weeks: weeks.size };

    const z = (airborne - mean) / Math.max(sd, Math.sqrt(mean), 1);
    return { id, airborne, expected, z: Math.round(z * 100) / 100, level: levelFromZ(z), weeks: weeks.size };
}

/** Acrescenta a amostra e descarta o que passou de keepDays. */
export function appendSample(history: EwsSample[], sample: EwsSample, keepDays: number): EwsSample[] {
    const cutoff = Date.parse(sample.t) - keepDays * DAY_MS;
    return [...history.filter(s => Date.parse(s.t) >= cutoff && s.t !== sample.t), sample]
        .sort((a, b) => a.t.localeCompare(b.t));
}
