
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try loading from project root (one level up from scripts/)
const envPath = path.resolve(__dirname, '../.env');
console.log(`Loading .env from: ${envPath}`);
dotenv.config({ path: envPath });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Must use service role to write

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const DEFAULT_CONFIG = {
    enabled: true,
    circuit_breaker_threshold: 3,
    circuit_breaker_timeout_seconds: 600,
    consecutive_failures: 0,
    total_runs: 0,
    total_successes: 0,
    total_failures: 0,
    circuit_open: false,
    // Default rate limits
    rate_limit_per_minute: 10,
    rate_limit_per_day: 1000
};

const COLLECTORS = [
    // Standard
    { name: 'GDACS', cache_duration_seconds: 900 },
    { name: 'NASA_EONET', cache_duration_seconds: 3600 },
    { name: 'POLYMARKET', cache_duration_seconds: 300 },
    { name: 'WHO_OUTBREAKS', cache_duration_seconds: 86400 },
    { name: 'GDELT', cache_duration_seconds: 300 },
    { name: 'AVIATION_HERALD', cache_duration_seconds: 300 },
    { name: 'MARITIME_NEWS', cache_duration_seconds: 300 },
    { name: 'VIX_INDEX', cache_duration_seconds: 300 },
    { name: 'INTERNET_SHUTDOWNS', cache_duration_seconds: 3600 },
    { name: 'CYBER_ATTACKS', cache_duration_seconds: 300 },

    // Regional News
    { name: 'NEWS_SOUTH_AMERICA', cache_duration_seconds: 900 },
    { name: 'NEWS_BRAZIL', cache_duration_seconds: 900 },
    { name: 'NEWS_NORTH_AMERICA', cache_duration_seconds: 900 },
    { name: 'NEWS_EUROPE', cache_duration_seconds: 900 },
    { name: 'NEWS_AFRICA', cache_duration_seconds: 900 },
    { name: 'NEWS_RUSSIA_ASIA', cache_duration_seconds: 900 },

    // Regional Telegram
    { name: 'TELEGRAM_SOUTH_AMERICA', cache_duration_seconds: 300 },
    { name: 'TELEGRAM_BRAZIL', cache_duration_seconds: 300 },
    { name: 'TELEGRAM_NORTH_AMERICA', cache_duration_seconds: 300 },
    { name: 'TELEGRAM_EUROPE', cache_duration_seconds: 300 },
    { name: 'TELEGRAM_AFRICA', cache_duration_seconds: 300 },
    { name: 'TELEGRAM_RUSSIA_ASIA', cache_duration_seconds: 300 }
];

async function seedCollectors() {
    console.log('🌱 Seeding collectors...');

    for (const collector of COLLECTORS) {
        const { error } = await supabase
            .from('collector_status')
            .upsert({
                collector_name: collector.name,
                cache_duration_seconds: collector.cache_duration_seconds,
                ...DEFAULT_CONFIG
            }, { onConflict: 'collector_name' })
            .select();

        if (error) {
            console.error(`❌ Failed to seed ${collector.name}:`, error.message);
        } else {
            console.log(`✅ Seeded ${collector.name}`);
        }
    }

    console.log('✨ Seeding complete!');
    process.exit(0);
}

seedCollectors();
