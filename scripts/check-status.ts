
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
    console.error("Missing credentials");
    process.exit(1);
}

const supabase = createClient(url, key);

async function check() {
    console.log("Checking Collector Status...");
    const { data, error } = await supabase
        .from('collector_status')
        .select('collector_name, enabled, last_success_at, last_error_at, last_error_message, total_successes');

    if (error) {
        console.error("Error:", error);
    } else {
        console.table(data);
    }
}
check();
