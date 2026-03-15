import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const sb = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Clear the cached_data for SOLAR_ALERTS so the next collect() forces a fresh fetchData()
const { error } = await sb
    .from('collector_status')
    .update({ last_success_at: '2000-01-01T00:00:00Z' })
    .eq('collector_name', 'SOLAR_ALERTS');

if (error) {
    console.error('Error clearing cache:', error);
} else {
    console.log('✅ SOLAR_ALERTS cache cleared — next collect() will re-fetch from NOAA');
}

// Also delete the old SOLAR_ALERT events so the new filtered set replaces them cleanly
const { error: delErr, count } = await sb
    .from('events')
    .delete({ count: 'exact' })
    .eq('category', 'SOLAR_ALERT');

if (delErr) {
    console.error('Error deleting old events:', delErr);
} else {
    console.log(`🗑️  Deleted ${count} old SOLAR_ALERT events from DB`);
}
