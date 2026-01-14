
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function setupAndVerify() {
    console.log('🧪 Configuring Premium Collectors...');

    const premiumCollectors = ['NEWSAPI_AI', 'ASKNews'];

    for (const name of premiumCollectors) {
        const { error } = await supabase
            .from('collector_status')
            .upsert({
                collector_name: name,
                enabled: true,
                circuit_open: false,
                cache_duration_seconds: 1800,
                rate_limit_per_minute: 5,
                max_retries: 3,
                consecutive_failures: 0
            }, { onConflict: 'collector_name' });

        if (error) console.error(`❌ Failed to configure ${name}:`, error.message);
        else console.log(`✅ Configured ${name}`);
    }

    console.log('\n--- Checking DB for Events ---');
    // We can't run the collectors directly easily here without mocking their API libs or importing them complexly, 
    // but we can check if the files exist and compile.
    // Ideally, we'd run a real fetch if we want to burn credits, but let's verify configuration first.
}

setupAndVerify();
