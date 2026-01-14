
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkLatest() {
    console.log('🔍 Checking latest events in DB...');

    const { data, error } = await supabase
        .from('events')
        .select('id, title, event_timestamp, category, created_at')
        .order('event_timestamp', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${data.length} events. Top 5 latest:`);
    data.forEach(e => {
        const timeAgo = Math.floor((Date.now() - new Date(e.event_timestamp).getTime()) / 1000 / 60 / 60);
        console.log(`- [${e.category}] ${e.title} (Timestamp: ${e.event_timestamp}, Age: ${timeAgo} hours)`);
    });

    // Check count of events in last 24h
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabase
        .from('events')
        .select('id', { count: 'exact', head: true })
        .gt('event_timestamp', yesterday);

    console.log(`\nTotal events in last 24 hours: ${count}`);
}

checkLatest();
