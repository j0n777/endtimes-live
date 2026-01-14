/**
 * Individual Collector Tests
 * Tests each collector separately to ensure they're working correctly
 */

import { config } from 'dotenv';
config();

import { createServiceClient } from './lib/supabaseClient';
import { GDACSCollector } from './lib/collectors/GDACSCollector';
import { NASAEONETCollector } from './lib/collectors/NASAEONETCollector';
import { ACLEDCollector } from './lib/collectors/ACLEDCollector';
import { NASAFIRMSCollector } from './lib/collectors/NASAFIRMSCollector';

async function testCollector(name: string, collector: any) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 Testing ${name} Collector`);
    console.log('='.repeat(60));

    try {
        const startTime = Date.now();

        // Test collection
        console.log(`📡 Fetching data from ${name}...`);
        const events = await collector.collect();

        const duration = Date.now() - startTime;

        console.log(`✅ ${name}: SUCCESS`);
        console.log(`   ⏱️  Duration: ${duration}ms`);
        console.log(`   📊 Events collected: ${events.length}`);

        if (events.length > 0) {
            console.log(`\n   📋 Sample event:`);
            const sample = events[0];
            console.log(`      Title: ${sample.title}`);
            console.log(`      Category: ${sample.category}`);
            console.log(`      Severity: ${sample.severity}`);
            console.log(`      Location: ${sample.location}`);
            console.log(`      Coordinates: ${sample.coordinates.lat}, ${sample.coordinates.lng}`);
            console.log(`      Source: ${sample.sourceName}`);
            console.log(`      Timestamp: ${sample.timestamp}`);
        }

        return { success: true, events: events.length, duration };

    } catch (error) {
        console.log(`❌ ${name}: FAILED`);
        console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        if (error instanceof Error && error.stack) {
            console.log(`   Stack: ${error.stack.split('\n').slice(0, 3).join('\n')}`);
        }
        return { success: false, error: error instanceof Error ? error.message : 'Unknown' };
    }
}

async function runIndividualTests() {
    console.log('\n🚀 INDIVIDUAL COLLECTOR TESTS');
    console.log('Testing each collector separately...\n');

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
        console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found!');
        process.exit(1);
    }

    const supabase = createServiceClient(serviceKey);

    const results: any = {};

    // Test 1: GDACS
    results.GDACS = await testCollector(
        'GDACS',
        new GDACSCollector(supabase)
    );

    // Wait 2 seconds between tests
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: NASA EONET
    results.NASA_EONET = await testCollector(
        'NASA EONET',
        new NASAEONETCollector(supabase)
    );

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 3: NASA FIRMS
    results.NASA_FIRMS = await testCollector(
        'NASA FIRMS',
        new NASAFIRMSCollector(supabase)
    );

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 4: ACLED
    results.ACLED = await testCollector(
        'ACLED',
        new ACLEDCollector(supabase)
    );

    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));

    const successful = Object.values(results).filter((r: any) => r.success).length;
    const total = Object.keys(results).length;

    Object.entries(results).forEach(([name, result]: [string, any]) => {
        const icon = result.success ? '✅' : '❌';
        const info = result.success
            ? `${result.events} events in ${result.duration}ms`
            : `Error: ${result.error}`;
        console.log(`${icon} ${name.padEnd(15)} - ${info}`);
    });

    console.log(`\n🎯 Overall: ${successful}/${total} collectors working`);

    if (successful === total) {
        console.log('🎉 ALL COLLECTORS WORKING PERFECTLY!\n');
    } else {
        console.log(`⚠️  ${total - successful} collector(s) need attention\n`);
    }

    // Detailed failure info
    const failures = Object.entries(results).filter(([_, r]: any) => !r.success);
    if (failures.length > 0) {
        console.log('\n📋 FAILURE DETAILS:');
        failures.forEach(([name, result]: [string, any]) => {
            console.log(`\n${name}:`);
            if (result.error.includes('API_KEY')) {
                console.log('   ⚠️  Missing API key in .env file');
                console.log(`   💡 Add ${name}_API_KEY to .env`);
            } else if (result.error.includes('Circuit')) {
                console.log('   🔴 Circuit breaker is open');
                console.log('   💡 Wait or reset circuit breaker');
            } else {
                console.log(`   Error: ${result.error}`);
            }
        });
    }

    process.exit(failures.length > 0 ? 1 : 0);
}

// Run tests
runIndividualTests().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
