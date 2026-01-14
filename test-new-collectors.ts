/**
 * Test NEW collectors individually
 * WHO, GDELT, Polymarket
 */

import { config } from 'dotenv';
config();

import { createServiceClient } from './lib/supabaseClient';
import { WHOCollector } from './lib/collectors/WHOCollector';
import { GDELTCollector } from './lib/collectors/GDELTCollector';
import { PolymarketCollector } from './lib/collectors/PolymarketCollector';

async function testCollector(name: string, collector: any) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 Testing ${name} Collector`);
    console.log('='.repeat(60));

    try {
        const startTime = Date.now();

        console.log(`📡 Fetching data from ${name}...`);
        const events = await collector.collect();

        const duration = Date.now() - startTime;

        console.log(`✅ ${name}: SUCCESS`);
        console.log(`   ⏱️  Duration: ${duration}ms`);
        console.log(`   📊 Events collected: ${events.length}`);

        if (events.length > 0) {
            console.log(`\n   📋 Sample events (first 3):`);
            events.slice(0, 3).forEach((sample: any, i: number) => {
                console.log(`\n   ${i + 1}. ${sample.title}`);
                console.log(`      Category: ${sample.category}`);
                console.log(`      Severity: ${sample.severity}`);
                console.log(`      Location: ${sample.location}`);
                console.log(`      Coordinates: ${sample.coordinates.lat}, ${sample.coordinates.lng}`);
            });
        }

        return { success: true, events: events.length, duration };

    } catch (error) {
        console.log(`❌ ${name}: FAILED`);
        console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown' };
    }
}

async function runNewCollectorTests() {
    console.log('\n🚀 TESTING NEW COLLECTORS');
    console.log('WHO | GDELT | Polymarket\n');

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
        console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found!');
        process.exit(1);
    }

    const supabase = createServiceClient(serviceKey);

    const results: any = {};

    // Test 1: WHO
    results.WHO = await testCollector(
        'WHO Disease Outbreaks',
        new WHOCollector(supabase)
    );

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Test 2: GDELT (with AI geocoding)
    console.log('\n⚠️  GDELT uses AI geocoding - may take longer...');
    results.GDELT = await testCollector(
        'GDELT News',
        new GDELTCollector(supabase)
    );

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Test 3: Polymarket
    results.Polymarket = await testCollector(
        'Polymarket Predictions',
        new PolymarketCollector(supabase)
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
            ? `${result.events} events in ${(result.duration / 1000).toFixed(1)}s`
            : `Error: ${result.error}`;
        console.log(`${icon} ${name.padEnd(20)} - ${info}`);
    });

    console.log(`\n🎯 Overall: ${successful}/${total} new collectors working`);

    if (successful === total) {
        console.log('🎉 ALL NEW COLLECTORS WORKING!\n');
    } else {
        console.log(`⚠️  ${total - successful} collector(s) need attention\n`);
    }

    process.exit(successful === total ? 0 : 1);
}

runNewCollectorTests().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
