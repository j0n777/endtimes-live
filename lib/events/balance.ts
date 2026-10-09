// Mistura equilibrada de eventos para o mapa (09/10/2026). Antes o mapa mostrava os 150
// mais recentes, quase todos notícia (≈130 de 245 em 09/10). Agora cada categoria entra
// em rodízio, do mais recente para o mais antigo, até completar o limite: quem tem pouca
// coisa (terremotos, alertas solares…) sempre aparece, e o resto é preenchido por ordem.
export type EventPeriod = '24h' | '7d' | '30d' | '90d';
export const EVENT_PERIODS: EventPeriod[] = ['24h', '7d', '30d', '90d'];
export const DEFAULT_PERIOD: EventPeriod = '7d';
const PERIOD_DAYS: Record<EventPeriod, number> = { '24h': 1, '7d': 7, '30d': 30, '90d': 90 };

export function periodStart(period: EventPeriod, now = new Date()): string {
    return new Date(now.getTime() - PERIOD_DAYS[period] * 86_400_000).toISOString();
}

export function balanceByCategory<T extends { category: string; timestamp: string }>(events: T[], limit: number): T[] {
    const byCategory = new Map<string, T[]>();
    for (const e of [...events].sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)))) {
        const list = byCategory.get(e.category) ?? [];
        list.push(e);
        byCategory.set(e.category, list);
    }
    const queues = [...byCategory.values()];
    const out: T[] = [];
    for (let round = 0; out.length < limit && queues.some(q => q.length > round); round++) {
        for (const q of queues) {
            if (round < q.length && out.length < limit) out.push(q[round]);
        }
    }
    return out;
}
