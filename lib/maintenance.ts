// Faxina de rotina para o projeto caber no plano gratuito da Supabase (07/10/2026).
// rate_limit_log recebe uma linha por requisição de coletor e só era limpo por um
// pg_cron opcional (002_rate_limiting.sql) que pode nem existir no projeto.
import type { SupabaseClient } from '@supabase/supabase-js';

const DAY_MS = 86_400_000;
const KEEP_DAYS = 7;          // janelas por minuto/dia do BaseCollector cabem com folga
const KEEP_DAYS_YEARLY = 366; // coletores com cota anual (ACLED) contam 365 dias
const STALE_FILES = ['defcon.json']; // DefconCollector removido em 06/10/2026
// Coletores desligados por licença em 07/10/2026: os eventos deles não seriam mais substituídos.
const RETIRED_COLLECTORS = [
    'TELEGRAM_BRAZIL', 'TELEGRAM_SOUTH_AMERICA', 'TELEGRAM_EUROPE', 'TELEGRAM_AFRICA',
    'TELEGRAM_RUSSIA_ASIA', 'TELEGRAM_NORTH_AMERICA', 'AVIATION_MILITARY', 'FLIGHT_RADAR',
    'VIX', 'NEWSAPI_AI', 'ASKNews', 'ACLED', 'TWITTER', 'POLYMARKET',
];

export async function runMaintenance(supabase: SupabaseClient, now = new Date()): Promise<void> {
    try {
        const { data: yearly, error: statusError } = await supabase
            .from('collector_status')
            .select('collector_name')
            .not('rate_limit_per_year', 'is', null);
        if (statusError) throw statusError;
        const keepLonger = (yearly ?? []).map(r => r.collector_name).filter(Boolean);

        let recent = supabase
            .from('rate_limit_log')
            .delete({ count: 'exact' })
            .lt('request_timestamp', new Date(now.getTime() - KEEP_DAYS * DAY_MS).toISOString());
        if (keepLonger.length) recent = recent.not('collector_name', 'in', `(${keepLonger.map(n => `"${n}"`).join(',')})`);
        const { count: c1, error: e1 } = await recent;
        if (e1) throw e1;

        const { count: c2, error: e2 } = await supabase
            .from('rate_limit_log')
            .delete({ count: 'exact' })
            .lt('request_timestamp', new Date(now.getTime() - KEEP_DAYS_YEARLY * DAY_MS).toISOString());
        if (e2) throw e2;
        console.log(`🧹 MANUTENÇÃO: rate_limit_log −${(c1 ?? 0) + (c2 ?? 0)} linhas antigas`);
    } catch (err) {
        console.warn(`⚠️ MANUTENÇÃO: limpeza do rate_limit_log falhou: ${err instanceof Error ? err.message : JSON.stringify(err)}`);
    }

    const { count: retired, error: retiredError } = await supabase
        .from('events')
        .delete({ count: 'exact' })
        .in('collector_name', RETIRED_COLLECTORS);
    if (retiredError) console.warn(`⚠️ MANUTENÇÃO: limpeza de eventos de coletores desligados falhou: ${retiredError.message}`);
    else if (retired) console.log(`🧹 MANUTENÇÃO: events −${retired} de coletores desligados`);

    const { error } = await supabase.storage.from('data').remove(STALE_FILES);
    if (error) console.warn(`⚠️ MANUTENÇÃO: remoção de arquivos obsoletos falhou: ${error.message}`);
}
