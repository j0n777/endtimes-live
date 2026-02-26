
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

// 3. Run Scheduler
async function runScheduler() {
    console.log('-------------------------------------------');
    console.log('📡 Starting Global Intelligence Scheduler');
    console.log('   Mode: Staggered (15m cycle)');
    console.log('-------------------------------------------');

    const orchestrator = new CollectorOrchestrator(supabase);

    // Initial Circuit Breaker Reset
    await orchestrator.resetCircuitBreaker('POLYMARKET');
    await orchestrator.resetCircuitBreaker('GDELT');
    
    // Main Loop
    while (true) {
        try {
            const now = new Date();
            const minute = now.getMinutes();
            const second = now.getSeconds();
            
            console.log(`\n⏰ Tick: ${now.toISOString()} (Min: ${minute})`);

            // 1. Run Staggered Logic (every minute check)
            // The orchestrator handles the "is it time?" logic based on 15m modulo
            await orchestrator.runStaggeredCycle(minute % 15);

            // 2. Run High-Frequency Critical Alerts (every 5 mins regardless of region?)
            // For now, let's stick to the Staggered groups which include them.
            
            // Wait for next minute boundary to align somewhat
            // Sleep 60s
            console.log('💤 Sleeping 60s...');
            await new Promise(r => setTimeout(r, 60000));

        } catch (err) {
            console.error('❌ Scheduler Error:', err);
            // Wait a bit before retrying to avoid tight loop on error
            await new Promise(r => setTimeout(r, 10000));
        }
    }
}

runScheduler().catch(err => {
    console.error('❌ Critical Failure:', err);
    process.exit(1);
});
