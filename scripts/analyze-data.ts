
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
    console.log('🔍 Analyzing Event Data...');

    // 1. Total Count
    const { count, error: countErr } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

    if (countErr) { console.error(countErr); return; }
    console.log(`Total Events in DB: ${count}`);

    // 2. Count by Category
    const { data: catData, error: catErr } = await supabase
        .rpc('get_category_counts'); // Need to see if this exists, or do manual query

    // Manual query if RPC missing
    const { data: events } = await supabase
        .from('events')
        .select('category, location, lat, lng');

    if (!events) return;

    const catCounts: Record<string, number> = {};
    let nullIslandCount = 0;
    let specificCount = 0;

    events.forEach((e: any) => {
        catCounts[e.category] = (catCounts[e.category] || 0) + 1;

        if (Math.abs(e.lat) < 0.1 && Math.abs(e.lng) < 0.1) {
            nullIslandCount++;
        } else {
            specificCount++;
        }
    });

    console.log('\n--- Counts per Category ---');
    console.table(catCounts);

    console.log('\n--- Coordinate Health ---');
    console.log(`Events on Null Island (0,0): ${nullIslandCount}`);
    console.log(`Events with Valid Coords: ${specificCount}`);

    if (nullIslandCount > 0) {
        console.log('\n⚠️ WARNING: Large number of events hidden due to (0,0) coordinates.');
    }
}

run();
