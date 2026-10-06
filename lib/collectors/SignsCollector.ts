// Publica o índice Ω e a Tensão Militar (lib/signs/engine.ts) no Storage:
//   signs.json          → leitura atual, consumida pelo front
//   signs-history.json  → um snapshot por dia (UTC), para o gráfico das "contrações"
// Substitui o DefconCollector (06/10/2026), que raspava o defconlevel.com — uma
// estimativa não oficial apresentada como se fosse o DEFCON real.
import { computeSigns } from '../signs/engine';
import { publishData } from '../publishData';
import type { SignsHistoryEntry, SignsPayload } from '../signs/types';

const HISTORY_FILE = 'signs-history.json';
const HISTORY_MAX_DAYS = 730;

export class SignsCollector {
    async run(): Promise<SignsPayload | null> {
        try {
            const payload = await computeSigns(new Date());
            const ok = payload.signs.filter(s => s.status === 'ok').length;
            console.log(`🔭 SIGNS: Ω ${payload.omega.level ?? '—'} (${payload.omega.anomalous.length}/${payload.omega.usable} anômalos) · Tensão ${payload.tension.level ?? '—'} · ${ok}/${payload.signs.length} sinais ok`);
            await publishData('signs.json', payload);
            await this.appendHistory(payload);
            return payload;
        } catch (err) {
            console.error('❌ SIGNS: falhou:', err);
            return null;
        }
    }

    private async appendHistory(payload: SignsPayload): Promise<void> {
        const base = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
        let history: SignsHistoryEntry[] = [];
        if (base) {
            try {
                const res = await fetch(`${base}/storage/v1/object/public/data/${HISTORY_FILE}?t=${Date.now()}`, { signal: AbortSignal.timeout(20_000) });
                if (res.ok) history = await res.json();
            } catch (err) {
                // Sem histórico anterior legível: começa um novo em vez de travar a publicação.
                console.warn(`⚠️ SIGNS: histórico anterior ilegível, recomeçando: ${err instanceof Error ? err.message : err}`);
            }
        }

        const entry: SignsHistoryEntry = {
            date: payload.generatedAt.slice(0, 10),
            omega: payload.omega.level,
            tension: payload.tension.level,
            percentiles: Object.fromEntries(payload.signs.map(s => [s.id, s.status === 'ok' ? s.percentile : null])),
        };
        const rest = (Array.isArray(history) ? history : []).filter(h => h?.date !== entry.date);
        const next = [...rest, entry].sort((a, b) => a.date.localeCompare(b.date)).slice(-HISTORY_MAX_DAYS);
        await publishData(HISTORY_FILE, next);
    }
}
