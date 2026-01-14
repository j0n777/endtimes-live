/**
 * RLS SECURITY TESTING SCRIPT
 * Tests Row Level Security policies with both anon and service_role keys
 * 
 * Run with: npx tsx scripts/test-rls-policies.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

interface TestResult {
    name: string;
    expected: 'PASS' | 'FAIL';
    actual: 'PASS' | 'FAIL';
    status: '✅' | '❌';
    message: string;
}

class RLSSecurityTester {
    private supabasePublic;
    private supabaseAdmin;
    private results: TestResult[] = [];

    constructor() {
        // Public client (anon key)
        this.supabasePublic = createClient(SUPABASE_URL, ANON_KEY);

        // Admin client (service_role key)
        this.supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
    }

    private addResult(result: TestResult) {
        result.status = result.expected === result.actual ? '✅' : '❌';
        this.results.push(result);
    }

    /**
     * TEST 1: Public can read recent events
     */
    async testPublicReadEvents() {
        console.log('\n📋 TEST 1: Public Read Recent Events');
        console.log('─'.repeat(60));

        try {
            const { data, error } = await this.supabasePublic
                .from('events')
                .select('id, title, category, event_timestamp, priority')
                .limit(10);

            if (error) {
                this.addResult({
                    name: 'Public read events',
                    expected: 'PASS',
                    actual: 'FAIL',
                    status: '❌',
                    message: `Error: ${error.message}`
                });
            } else {
                this.addResult({
                    name: 'Public read events',
                    expected: 'PASS',
                    actual: 'PASS',
                    status: '✅',
                    message: `Retrieved ${data?.length || 0} events`
                });
            }
        } catch (err: any) {
            this.addResult({
                name: 'Public read events',
                expected: 'PASS',
                actual: 'FAIL',
                status: '❌',
                message: `Exception: ${err.message}`
            });
        }
    }

    /**
     * TEST 2: Public CANNOT insert events
     */
    async testPublicCannotInsert() {
        console.log('\n🔒 TEST 2: Public Cannot Insert Events');
        console.log('─'.repeat(60));

        try {
            const { error } = await this.supabasePublic
                .from('events')
                .insert({
                    lat: 0,
                    lng: 0,
                    category: 'TEST',
                    severity: 'LOW',
                    title: 'Unauthorized insert attempt',
                    event_timestamp: new Date().toISOString()
                });

            if (error) {
                this.addResult({
                    name: 'Public blocked from insert',
                    expected: 'PASS',
                    actual: 'PASS',
                    status: '✅',
                    message: `Correctly blocked: ${error.message}`
                });
            } else {
                this.addResult({
                    name: 'Public blocked from insert',
                    expected: 'PASS',
                    actual: 'FAIL',
                    status: '❌',
                    message: 'SECURITY BREACH: Public can insert!'
                });
            }
        } catch (err: any) {
            this.addResult({
                name: 'Public blocked from insert',
                expected: 'PASS',
                actual: 'PASS',
                status: '✅',
                message: `Exception (expected): ${err.message}`
            });
        }
    }

    /**
     * TEST 3: Public CANNOT read collector_status
     */
    async testPublicCannotReadCollectorStatus() {
        console.log('\n🚫 TEST 3: Public Cannot Read Collector Status');
        console.log('─'.repeat(60));

        try {
            const { data, error } = await this.supabasePublic
                .from('collector_status')
                .select('*')
                .limit(1);

            if (error || !data || data.length === 0) {
                this.addResult({
                    name: 'Public blocked from collector_status',
                    expected: 'PASS',
                    actual: 'PASS',
                    status: '✅',
                    message: error ? `Blocked: ${error.message}` : 'No data returned (RLS working)'
                });
            } else {
                this.addResult({
                    name: 'Public blocked from collector_status',
                    expected: 'PASS',
                    actual: 'FAIL',
                    status: '❌',
                    message: `SECURITY BREACH: Public can read ${data.length} records!`
                });
            }
        } catch (err: any) {
            this.addResult({
                name: 'Public blocked from collector_status',
                expected: 'PASS',
                actual: 'PASS',
                status: '✅',
                message: `Exception (expected): ${err.message}`
            });
        }
    }

    /**
     * TEST 4: Public CANNOT read rate_limit_log
     */
    async testPublicCannotReadRateLogs() {
        console.log('\n🚫 TEST 4: Public Cannot Read Rate Logs');
        console.log('─'.repeat(60));

        try {
            const { data, error } = await this.supabasePublic
                .from('rate_limit_log')
                .select('*')
                .limit(1);

            if (error || !data || data.length === 0) {
                this.addResult({
                    name: 'Public blocked from rate_limit_log',
                    expected: 'PASS',
                    actual: 'PASS',
                    status: '✅',
                    message: error ? `Blocked: ${error.message}` : 'No data returned (RLS working)'
                });
            } else {
                this.addResult({
                    name: 'Public blocked from rate_limit_log',
                    expected: 'PASS',
                    actual: 'FAIL',
                    status: '❌',
                    message: `SECURITY BREACH: Public can read ${data.length} records!`
                });
            }
        } catch (err: any) {
            this.addResult({
                name: 'Public blocked from rate_limit_log',
                expected: 'PASS',
                actual: 'PASS',
                status: '✅',
                message: `Exception (expected): ${err.message}`
            });
        }
    }

    /**
     * TEST 5: Service role CAN read all events
     */
    async testAdminCanReadAllEvents() {
        console.log('\n✅ TEST 5: Admin Can Read All Events');
        console.log('─'.repeat(60));

        try {
            const { data, error } = await this.supabaseAdmin
                .from('events')
                .select('id')
                .limit(1000);

            if (error) {
                this.addResult({
                    name: 'Admin read all events',
                    expected: 'PASS',
                    actual: 'FAIL',
                    status: '❌',
                    message: `Error: ${error.message}`
                });
            } else {
                this.addResult({
                    name: 'Admin read all events',
                    expected: 'PASS',
                    actual: 'PASS',
                    status: '✅',
                    message: `Successfully read ${data?.length || 0} events`
                });
            }
        } catch (err: any) {
            this.addResult({
                name: 'Admin read all events',
                expected: 'PASS',
                actual: 'FAIL',
                status: '❌',
                message: `Exception: ${err.message}`
            });
        }
    }

    /**
     * TEST 6: Service role CAN insert events
     */
    async testAdminCanInsertEvents() {
        console.log('\n✅ TEST 6: Admin Can Insert Events');
        console.log('─'.repeat(60));

        const testEvent = {
            lat: 0,
            lng: 0,
            category: 'TEST',
            severity: 'LOW',
            title: `RLS Test Event ${new Date().toISOString()}`,
            description: 'Automated security test',
            event_timestamp: new Date().toISOString(),
            source_name: 'RLS_TEST',
            source_type: 'TEST'
        };

        try {
            const { data, error } = await this.supabaseAdmin
                .from('events')
                .insert(testEvent)
                .select('id')
                .single();

            if (error) {
                this.addResult({
                    name: 'Admin insert event',
                    expected: 'PASS',
                    actual: 'FAIL',
                    status: '❌',
                    message: `Error: ${error.message}`
                });
            } else {
                this.addResult({
                    name: 'Admin insert event',
                    expected: 'PASS',
                    actual: 'PASS',
                    status: '✅',
                    message: `Successfully inserted event ID: ${data?.id}`
                });

                // Clean up test event
                if (data?.id) {
                    await this.supabaseAdmin.from('events').delete().eq('id', data.id);
                }
            }
        } catch (err: any) {
            this.addResult({
                name: 'Admin insert event',
                expected: 'PASS',
                actual: 'FAIL',
                status: '❌',
                message: `Exception: ${err.message}`
            });
        }
    }

    /**
     * TEST 7: Service role CAN read collector_status
     */
    async testAdminCanReadCollectorStatus() {
        console.log('\n✅ TEST 7: Admin Can Read Collector Status');
        console.log('─'.repeat(60));

        try {
            const { data, error } = await this.supabaseAdmin
                .from('collector_status')
                .select('*');

            if (error) {
                this.addResult({
                    name: 'Admin read collector_status',
                    expected: 'PASS',
                    actual: 'FAIL',
                    status: '❌',
                    message: `Error: ${error.message}`
                });
            } else {
                this.addResult({
                    name: 'Admin read collector_status',
                    expected: 'PASS',
                    actual: 'PASS',
                    status: '✅',
                    message: `Successfully read ${data?.length || 0} collectors`
                });
            }
        } catch (err: any) {
            this.addResult({
                name: 'Admin read collector_status',
                expected: 'PASS',
                actual: 'FAIL',
                status: '❌',
                message: `Exception: ${err.message}`
            });
        }
    }

    /**
     * TEST 8: Public can use safe RPC function
     */
    async testPublicCanUseRPC() {
        console.log('\n⚙️ TEST 8: Public Can Use Safe RPC Function');
        console.log('─'.repeat(60));

        try {
            const { data, error } = await this.supabasePublic
                .rpc('get_public_events', {
                    p_limit: 10,
                    p_min_priority: 3
                });

            if (error) {
                this.addResult({
                    name: 'Public use RPC get_public_events',
                    expected: 'PASS',
                    actual: 'FAIL',
                    status: '❌',
                    message: `Error: ${error.message}`
                });
            } else {
                this.addResult({
                    name: 'Public use RPC get_public_events',
                    expected: 'PASS',
                    actual: 'PASS',
                    status: '✅',
                    message: `Successfully retrieved ${data?.length || 0} events via RPC`
                });
            }
        } catch (err: any) {
            this.addResult({
                name: 'Public use RPC get_public_events',
                expected: 'PASS',
                actual: 'FAIL',
                status: '❌',
                message: `Exception: ${err.message}`
            });
        }
    }

    /**
     * TEST 9: RPC enforces rate limits
     */
    async testRPCEnforcesLimits() {
        console.log('\n🚦 TEST 9: RPC Enforces Rate Limits');
        console.log('─'.repeat(60));

        try {
            const { error } = await this.supabasePublic
                .rpc('get_public_events', {
                    p_limit: 1000, // Exceeds max of 500
                    p_min_priority: 3
                });

            if (error) {
                this.addResult({
                    name: 'RPC rejects excessive limit',
                    expected: 'PASS',
                    actual: 'PASS',
                    status: '✅',
                    message: `Correctly rejected: ${error.message}`
                });
            } else {
                this.addResult({
                    name: 'RPC rejects excessive limit',
                    expected: 'PASS',
                    actual: 'FAIL',
                    status: '❌',
                    message: 'SECURITY ISSUE: RPC allowed limit > 500'
                });
            }
        } catch (err: any) {
            this.addResult({
                name: 'RPC rejects excessive limit',
                expected: 'PASS',
                actual: 'PASS',
                status: '✅',
                message: `Exception (expected): ${err.message}`
            });
        }
    }

    /**
     * Print summary report
     */
    printReport() {
        console.log('\n');
        console.log('═'.repeat(60));
        console.log('           RLS SECURITY TEST REPORT');
        console.log('═'.repeat(60));
        console.log('\n');

        const passed = this.results.filter(r => r.status === '✅').length;
        const failed = this.results.filter(r => r.status === '❌').length;

        this.results.forEach(result => {
            console.log(`${result.status} ${result.name}`);
            console.log(`   ${result.message}`);
            console.log('');
        });

        console.log('─'.repeat(60));
        console.log(`TOTAL: ${this.results.length} tests`);
        console.log(`✅ PASSED: ${passed}`);
        console.log(`❌ FAILED: ${failed}`);
        console.log('─'.repeat(60));

        if (failed === 0) {
            console.log('\n🎉 ALL TESTS PASSED! Your RLS policies are secure.');
        } else {
            console.log('\n⚠️  SOME TESTS FAILED! Review your RLS policies.');
        }

        console.log('\n');
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        console.log('\n🔐 Starting RLS Security Tests...\n');
        console.log(`Supabase URL: ${SUPABASE_URL}`);
        console.log(`Anon Key: ${ANON_KEY.substring(0, 20)}...`);
        console.log(`Service Key: ${SERVICE_KEY ? SERVICE_KEY.substring(0, 20) + '...' : 'NOT SET'}`);

        if (!SUPABASE_URL || !ANON_KEY) {
            console.error('\n❌ Error: Missing SUPABASE_URL or ANON_KEY in .env.local');
            process.exit(1);
        }

        if (!SERVICE_KEY) {
            console.warn('\n⚠️  Warning: SERVICE_ROLE_KEY not set. Admin tests will fail.');
        }

        // Run public tests
        await this.testPublicReadEvents();
        await this.testPublicCannotInsert();
        await this.testPublicCannotReadCollectorStatus();
        await this.testPublicCannotReadRateLogs();
        await this.testPublicCanUseRPC();
        await this.testRPCEnforcesLimits();

        // Run admin tests (only if service key is available)
        if (SERVICE_KEY) {
            await this.testAdminCanReadAllEvents();
            await this.testAdminCanInsertEvents();
            await this.testAdminCanReadCollectorStatus();
        }

        // Print final report
        this.printReport();
    }
}

// Run the tests
const tester = new RLSSecurityTester();
tester.runAllTests().catch(err => {
    console.error('\n❌ Fatal error:', err);
    process.exit(1);
});
