// Publica o alerta de apocalipse (lib/ews) no Storage:
//   ews.json          → leitura atual, consumida pelo painel de sinais
//   ews-history.json  → uma amostra por rodada do grupo 6 (~25 min), 70 dias
import { computeEws, sampleNow } from '../ews/engine';
import type { EwsPayload, EwsSample } from '../ews/types';
import { publishData } from '../publishData';

const HISTORY_FILE = 'ews-history.json';

export class EwsCollector {
    async run(): Promise<EwsPayload | null> {
        try {
            const now = new Date();
            const [stored, sample] = await Promise.all([this.readHistory(), sampleNow(now)]);
            if (sample.jets == null && sample.military == null) {
                console.warn('⚠️ EWS: adsb.lol sem resposta, mantendo a última publicação');
                return null;
            }
            const { payload, history: next } = computeEws(stored ?? [], sample, now);
            const fmt = (c: EwsPayload['cohorts'][number]) =>
                `${c.id} ${c.airborne ?? '—'} no ar (esperado ${c.expected ?? '—'}, nível ${c.level ?? `calibrando ${c.weeks}/${payload.minWeeks} sem`})`;
            console.log(`✈️  EWS: ${payload.cohorts.map(fmt).join(' · ')}`);
            await publishData('ews.json', payload);
            // Leitura do histórico falhou (rede, 5xx): não sobrescreve semanas de amostras com uma só.
            if (stored) await publishData(HISTORY_FILE, next);
            return payload;
        } catch (err) {
            console.error('❌ EWS: falhou:', err);
            return null;
        }
    }

    /** [] se o arquivo ainda não existe; null se não deu para ler (aí não se regrava). */
    private async readHistory(): Promise<EwsSample[] | null> {
        const base = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
        if (!base) return null;
        try {
            const res = await fetch(`${base}/storage/v1/object/public/data/${HISTORY_FILE}?t=${Date.now()}`, { signal: AbortSignal.timeout(20_000) });
            if ((res.status === 400 || res.status === 404) && /not.?found/i.test(await res.text())) return [];
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            if (!Array.isArray(data)) throw new Error('formato inesperado');
            return data;
        } catch (err) {
            console.warn(`⚠️ EWS: histórico ilegível, não será regravado nesta rodada: ${err instanceof Error ? err.message : err}`);
            return null;
        }
    }
}
