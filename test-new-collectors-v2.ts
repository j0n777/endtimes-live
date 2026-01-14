/**
 * Test NEW collectors individually
 * WHO, GDELT, Polymarket, Telegram
 */

import { config } from 'dotenv';
config();

import { createServiceClient } from './lib/supabaseClient';
import { WHOCollector } from './lib/collectors/WHOCollector';
import { GDELTCollector } from './lib/collectors/GDELTCollector';
import { PolymarketCollector } from './lib/collectors/PolymarketCollector';
import { TelegramCollector } from './lib/collectors/TelegramCollector';

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
                console.log(`      Severity: ${sample.severity}`);
                console.log(`      Location: ${sample.location}`);
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
    console.log('Available: WHO, GDELT, Polymarket, Telegram\n');

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
        console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found!');
        process.exit(1);
    }

    const supabase = createServiceClient(serviceKey);

    const results: any = {};

    // Test GDELT (Refined)
    results.GDELT = await testCollector(
        'GDELT News (Optimized)',
        new GDELTCollector(supabase)
    );

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test Telegram (New)
    results.Telegram = await testCollector(
        'Telegram Intelligence',
        new TelegramCollector(supabase)
    );

    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));

    Object.entries(results).forEach(([name, result]: [string, any]) => {
        const icon = result.success && result.events > 0 ? '✅' : (result.success ? '⚠️' : '❌');
        const info = result.success
            ? `${result.events} events in ${(result.duration / 1000).toFixed(1)}s`
            : `Error: ${result.error}`;
        console.log(`${icon} ${name.padEnd(20)} - ${info}`);
    });

    process.exit(0);
}

runNewCollectorTests().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
