
import dotenv from 'dotenv';
import { CollectorOrchestrator } from './lib/collectors/CollectorOrchestrator';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const orchestrator = new CollectorOrchestrator(supabase);

async function test() {
    console.log('🧪 Testing Staggered Logic...');

    // Test T+0
    console.log('\n--- Minute 0 (Expect: SA, Brazil, GDACS) ---');
    await orchestrator.runStaggeredCycle(0);

    // Test T+3
    console.log('\n--- Minute 3 (Expect: NA, Polymarket) ---');
    await orchestrator.runStaggeredCycle(3);

    // Test T+6
    console.log('\n--- Minute 6 (Expect: Europe, Telegram) ---');
    await orchestrator.runStaggeredCycle(6);

    // Test T+1 (Should SKIP)
    console.log('\n--- Minute 1 (Expect: SKIP) ---');
    await orchestrator.runStaggeredCycle(1);
}

test();
