
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { CollectorOrchestrator } from '../lib/collectors/CollectorOrchestrator';

// Load env vars
dotenv.config({ path: '.env.local' });
dotenv.config(); // fallback

// Suppress experimental warnings if any
const originalEmit = process.emit;
process.emit = function (name, data, ...args) {
    if (name === `warning` && typeof data === `object` && data.name === `ExperimentalWarning`) {
        return false;
    }
    return originalEmit.apply(process, [name, data, ...args]);
} as any;

console.log('🚀 Initializing Collector Runner...');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing Supabase URL or Key in environment variables.');
    process.exit(1);
}

// 2. Initialize Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 3. Run Collectors
async function run() {
    console.log('-------------------------------------------');
    console.log('📡 Starting Global Intelligence Collection');
    console.log('-------------------------------------------');

    const orchestrator = new CollectorOrchestrator(supabase);

    // Force a "circuit breaker reset" on critical collectors just in case
    await orchestrator.resetCircuitBreaker('POLYMARKET');
    await orchestrator.resetCircuitBreaker('GDELT');
    await orchestrator.resetCircuitBreaker('TELEGRAM');

    // Run All
    console.log('⚡ Executing runAllCollectors()...');
    const result = await orchestrator.runAllCollectors();

    console.log('-------------------------------------------');
    console.log('🏁 Final Results:');
    console.log(JSON.stringify(result, null, 2));
    console.log('-------------------------------------------');

    if (result.failed > 0) {
        console.warn(`⚠️ Warning: ${result.failed} collectors failed.`);
        process.exit(0); // Exit success anyway to not break pipelines
    } else {
        console.log('✅ All systems nominal.');
    }
}

run().catch(err => {
    console.error('❌ Critical Failure:', err);
    process.exit(1);
});
