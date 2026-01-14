
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { AviationCollector } from './lib/collectors/AviationCollector';
import { MaritimeCollector } from './lib/collectors/MaritimeCollector';

dotenv.config();
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function setupCollector(name: string) {
    // Only set KNOWN minimal fields + Required Not Nulls (assuming defaults handle the rest or we provide them)
    // cache_duration_seconds was required (Not Null).
    // circuit_breaker_timeout missing?
    // We try to insert only what we know exists or is required.

    // Check what columns exist? No, blind update.
    // If circuit_breaker_timeout missing, we skip it.

    const { error } = await supabase
        .from('collector_status')
        .upsert({
            collector_name: name,
            enabled: true,
            last_success_at: null,
            circuit_open: false,
            cache_duration_seconds: 1800,
            rate_limit_per_minute: 10,
            max_retries: 3,
            // circuit_breaker_threshold: 5, // Removing as potentially missing
            // circuit_breaker_timeout: 3600, // Removing as potentially missing
            consecutive_failures: 0
        }, { onConflict: 'collector_name' });

    if (error) console.error(`Failed to setup ${name}`, error);
    else console.log(`✅ Configured ${name} in DB`);
}

async function run() {
    console.log('🧪 Configuring & Testing Collectors...');

    await setupCollector('AVIATION_HERALD');
    await setupCollector('MARITIME_NEWS');
    await setupCollector('POLYMARKET');

    // 1. Aviation
    try {
        const av = new AviationCollector(supabase);
        console.log('\n--- Running AviationCollector ---');
        const avEvents = await av.collect();
        console.log(`✅ Success: ${avEvents.length} events`);
        if (avEvents.length > 0) console.log('Sample:', JSON.stringify(avEvents[0], null, 2));
    } catch (e) {
        console.error('❌ Aviation Failed:', e);
    }

    // 2. Maritime
    try {
        const mar = new MaritimeCollector(supabase);
        console.log('\n--- Running MaritimeCollector ---');
        const marEvents = await mar.collect();
        console.log(`✅ Success: ${marEvents.length} events`);
        if (marEvents.length > 0) console.log('Sample:', JSON.stringify(marEvents[0], null, 2));
    } catch (e) {
        console.error('❌ Maritime Failed:', e);
    }

    // 3. Polymarket (Verify Probability Parsing)
    try {
        const { PolymarketCollector } = await import('./lib/collectors/PolymarketCollector');
        const poly = new PolymarketCollector(supabase);
        console.log('\n--- Running PolymarketCollector ---');
        const polyEvents = await poly.collect();
        console.log(`✅ Success: ${polyEvents.length} events`);
        if (polyEvents.length > 0) {
            console.log('Sample Title:', polyEvents[0].title);
        }
    } catch (e) {
        console.error('❌ Polymarket Failed:', e);
    }
}

run();
