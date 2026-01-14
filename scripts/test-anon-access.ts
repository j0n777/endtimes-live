
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();
dotenv.config({ path: '.env.local' });

// USE ANON KEY HERE
const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
);

async function testAnon() {
    console.log('🕵️ Testing Public (Anon) Access...');

    // Check Prophetic
    const { count: propheticCount, error: err1 } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('category', 'PROPHETIC');

    if (err1) console.error('Error fetching Prophetic:', err1);
    else console.log(`Publicly visible Prophetic events: ${propheticCount}`);

    // Check Persecution
    const { count: persCount, error: err2 } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('category', 'PERSECUTION');

    if (err2) console.error('Error fetching Persecution:', err2);
    else console.log(`Publicly visible Persecution events: ${persCount}`);

    // Check Total
    const { count: total, error: err3 } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

    console.log(`Total visible events: ${total}`);
}

testAnon();
