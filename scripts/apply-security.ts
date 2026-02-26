
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load correct .env
const envPath = path.resolve(__dirname, '../.env');
console.log(`Loading .env from: ${envPath}`);
dotenv.config({ path: envPath });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applySecurity() {
    console.log('🔒 Applying Security Policies...');

    const sqlPath = path.resolve(__dirname, '../supabase/security.sql');
    if (!fs.existsSync(sqlPath)) {
        console.error('❌ security.sql not found at', sqlPath);
        process.exit(1);
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Supabase-js doesn't have a direct "exec" method exposed easily via client unless pg extension is enabled remotely and exposed via rpc, 
    // BUT we can use the `pg` library if we had connection string, OR we can try to use a specialized RPC function if one exists.
    // However, for standard Supabase setups, we often rely on the dashboard SQL editor.
    // 
    // OPTION: We can try to use the raw REST interface or an RPC function we might have. 
    // If not, we instruct the user.
    //
    // Let's try to see if there is an `exec_sql` function. If not, we will output the SQL for the user.

    try {
        const { error } = await supabase.rpc('exec_sql', { query: sql });
        if (error) {
            console.warn('⚠️ Could not auto-apply SQL (RPC exec_sql missing?).');
            console.log('\nPlease run the following SQL in your Supabase Dashboard:\n');
            console.log(sql);
        } else {
            console.log('✅ Security policies applied successfully via RPC!');
        }
    } catch (e) {
        console.warn('⚠️ Automated execution failed. Please run manually.');
        console.log('\nPLEASE RUN THIS SQL IN SUPABASE DASHBOARD:\n');
        console.log(sql);
    }
}

applySecurity();
