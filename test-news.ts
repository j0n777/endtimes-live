
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { NewsRSSCollector } from './lib/collectors/NewsRSSCollector';

dotenv.config();
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function setupCollector(name: string) {
    const { error } = await supabase
        .from('collector_status')
        .upsert({
            collector_name: name,
            enabled: true,
            last_success_at: null,
            circuit_open: false,
            // Required defaults
            cache_duration_seconds: 900,
            rate_limit_per_minute: 10,
            max_retries: 3,
            consecutive_failures: 0
        }, { onConflict: 'collector_name' });

    if (error) console.error(`Failed to setup ${name}`, error);
    else console.log(`✅ Configured ${name} in DB`);
}

async function run() {
    console.log('🧪 Testing NewsRSS Collector...');
    await setupCollector('NEWS_RSS');

    try {
        const news = new NewsRSSCollector(supabase);
        console.log('\n--- Running NewsRSSCollector ---');
        const events = await news.collect();
        console.log(`✅ Success: ${events.length} events`);

        if (events.length > 0) {
            console.log('Sample:', JSON.stringify(events[0], null, 2));
        }

        // Verify Data
        const { count } = await supabase
            .from('events')
            .select('*', { count: 'exact', head: true })
            .neq('location', 'Global');

        console.log(`\n📊 Total Geocoded Events in DB: ${count}`);

    } catch (e) {
        console.error('❌ NewsRSS Failed:', e);
    }
}

run();
