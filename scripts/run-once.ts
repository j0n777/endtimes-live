// Uma rodada do scheduler por execução, para rodar em cron externo (GitHub Actions,
// .github/workflows/collectors.yml, a cada 5 min). 14/09/2026: substitui o loop
// infinito do run-all-collectors.ts, que precisava de um container permanente.
//
// O orquestrador tem 5 grupos regionais (offsets 0,3,6,9,12 do ciclo de 15 min).
// Aqui cada execução roda UM grupo, escolhido pela janela de 5 min do relógio:
// grupo = floor(epoch/5min) % 5 → um ciclo completo a cada 25 min, e independe do
// atraso que o cron do GitHub costuma ter. TLEs são atualizadas quando o grupo é 0.
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import dns from 'node:dns';
import { CollectorOrchestrator } from '../lib/collectors/CollectorOrchestrator';
import { fetchTles } from './fetch-tles';

if (dns.setDefaultResultOrder) dns.setDefaultResultOrder('ipv4first');
dotenv.config({ path: '.env.local' });
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing Supabase URL or Key in environment variables.');
    process.exit(1);
}

const OFFSETS = [0, 3, 6, 9, 12];
const MAX_RUN_MS = 9 * 60 * 1000; // nunca passar de 9 min (cron de 5 em 5, concurrency cancela o resto)

async function main() {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);
    const orchestrator = new CollectorOrchestrator(supabase);
    const slot = Math.floor(Date.now() / (5 * 60 * 1000)) % OFFSETS.length;
    const forced = process.env.COLLECT_GROUP ? parseInt(process.env.COLLECT_GROUP, 10) : NaN;
    const offset = Number.isInteger(forced) ? forced : OFFSETS[slot];
    console.log(`🚀 run-once ${new Date().toISOString()} — grupo offset=${offset} (slot ${slot})`);

    const watchdog = setTimeout(() => { console.error('⏱️  run-once: tempo máximo excedido, encerrando'); process.exit(2); }, MAX_RUN_MS);
    try {
        if (offset === 0 || process.env.COLLECT_TLES === '1') await fetchTles();
        await orchestrator.runStaggeredCycle(offset);
        console.log('✅ run-once: rodada concluída');
    } finally {
        clearTimeout(watchdog);
    }
    process.exit(0);
}

main().catch((err) => { console.error('❌ run-once falhou:', err); process.exit(1); });
