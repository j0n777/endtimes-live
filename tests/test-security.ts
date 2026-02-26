
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY; // We need this to test "Public/Anon" access

if (!supabaseUrl || !supabaseKey || !anonKey) {
    console.error('❌ Missing credentials in .env');
    process.exit(1);
}

// Clients
const serviceClient = createClient(supabaseUrl, supabaseKey);
const anonClient = createClient(supabaseUrl, anonKey);

async function runSecurityTests() {
    console.log('🛡️  Running Security Tests...\n');

    let allPassed = true;

    // TEST 1: Public Read Access (Should Succeed)
    console.log('Test 1: Public Read Access (Anon)');
    const { data: readData, error: readError } = await anonClient
        .from('events')
        .select('*')
        .limit(1);

    if (readError) {
        console.error('❌ FAILED: Anon could not read events:', readError.message);
        allPassed = false;
    } else {
        console.log(`✅ PASSED: Anon read ${readData.length} events (Public Read OK)`);
    }
    console.log('---');


    // TEST 2: Anon Write Access (Should FAIL)
    console.log('Test 2: Anon Write Access (Attempting Insert)');
    const { error: writeError } = await anonClient
        .from('events')
        .insert({
            title: 'HACKER ATTACK',
            description: 'This should not be allowed',
            lat: 0, lng: 0,
            category: 'CYBER',
            severity: 'HIGH',
            event_timestamp: new Date().toISOString()
        });

    if (writeError && (writeError.code === '42501' || writeError.message.includes('permission denied') || writeError.message.includes('policy'))) {
        console.log('✅ PASSED: Anon write was blocked (RLS Working)');
    } else if (!writeError) {
        console.error('❌ FAILED: Anon was able to insert! RLS IS BROKEN!');
        allPassed = false;
    } else {
        console.warn('⚠️ WARNING: Anon write failed but with unexpected error:', writeError.message);
    }
    console.log('---');


    // TEST 3: Service Role Write Access (Should Succeed)
    console.log('Test 3: Service Role Write Access');
    const { data: serviceWriteData, error: serviceWriteError } = await serviceClient
        .from('events')
        .insert({
            title: 'Security Drill',
            description: 'Authorized write test',
            lat: 0, lng: 0,
            category: 'CYBER',
            severity: 'LOW',
            event_timestamp: new Date().toISOString(),
            source_name: 'SecurityTest'
        })
        .select()
        .single();

    if (serviceWriteError) {
        console.error('❌ FAILED: Service Role could not write:', serviceWriteError.message);
        allPassed = false;
    } else {
        console.log('✅ PASSED: Service Role write successful');
        // Cleanup
        await serviceClient.from('events').delete().eq('id', serviceWriteData.id);
    }
    console.log('---');

    // SUMMARY
    if (allPassed) {
        console.log('🎉 ALL SECURITY TESTS PASSED. RLS is correctly enforced.');
    } else {
        console.error('💀 SOME TESTS FAILED. CHECK LOGS ABOVE.');
        process.exit(1);
    }
}

runSecurityTests();
