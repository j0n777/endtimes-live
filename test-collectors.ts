/**
 * Test script to verify collectors are working
 * Run with: npm run test:collectors
 */

// Load environment variables from .env file
import { config } from 'dotenv';
config();

import { createServiceClient } from './lib/supabaseClient';
import { CollectorOrchestrator } from './lib/collectors/CollectorOrchestrator';

async function testCollectors() {
    console.log('🧪 Testing Data Collectors\n');
    console.log('═'.repeat(60));

    // Create service client with full permissions (required to write to database)
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
        console.error('\n❌ SUPABASE_SERVICE_ROLE_KEY not found in .env file!');
        console.error('   Get it from: https://supabase.com/dashboard/project/bimfztwwzuwwefxfkkwe/settings/api');
        console.error('   Add to .env file: SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...\n');
        console.warn('⚠️  Continuing with anon key (may fail to write events)\n');
    }

    const supabase = createServiceClient(serviceKey);

    // Create orchestrator
    const orchestrator = new CollectorOrchestrator(supabase);

    try {
        // Get current status
        console.log('\n📊 Current Collector Status:\n');
        const statuses = await orchestrator.getCollectorStatuses();

        statuses.forEach(status => {
            const healthIcon = status.circuit_open ? '🔴' :
                status.consecutive_failures > 0 ? '⚠️' : '✅';
            const enabledIcon = status.enabled ? '🟢' : '⏸️';

            console.log(`${healthIcon} ${enabledIcon} ${status.collector_name}`);
            console.log(`   Cache: ${Math.floor(status.cache_duration_seconds / 60)}min`);
            console.log(`   Last success: ${status.last_success_at ? new Date(status.last_success_at).toLocaleString() : 'Never'}`);
            console.log(`   Total runs: ${status.total_runs} (${status.total_successes} ✅, ${status.total_failures} ❌)`);
            console.log(`   Events collected: ${status.total_events_collected}`);

            if (status.circuit_open) {
                console.log(`   🔴 Circuit OPEN until: ${new Date(status.circuit_open_until).toLocaleString()}`);
            }

            if (status.last_error_message) {
                console.log(`   Last error: ${status.last_error_message}`);
            }

            console.log('');
        });

        console.log('═'.repeat(60));
        console.log('\n🚀 Running all collectors...\n');

        // Run all collectors
        const result = await orchestrator.runAllCollectors();

        console.log('═'.repeat(60));
        console.log('\n📈 Collection Results:\n');

        result.results.forEach(r => {
            const icon = r.status === 'success' ? '✅' : '❌';
            console.log(`${icon} ${r.collector}: ${r.eventCount} events${r.error ? ` (${r.error})` : ''}`);
        });

        console.log('\n' + '═'.repeat(60));
        console.log(`\n🎉 Total: ${result.totalEvents} events from ${result.successful}/${result.total} collectors\n`);

        // Show some sample events
        console.log('═'.repeat(60));
        console.log('\n📋 Sample Events from Database:\n');

        const { data: sampleEvents, error } = await supabase
            .from('events')
            .select('title, category, severity, source_name, location')
            .order('fetched_at', { ascending: false })
            .limit(10);

        if (error) {
            console.error('Error fetching sample events:', error);
        } else if (sampleEvents && sampleEvents.length > 0) {
            sampleEvents.forEach((event, i) => {
                const severityIcon = event.severity === 'HIGH' ? '🔴' :
                    event.severity === 'ELEVATED' ? '🟠' :
                        event.severity === 'MEDIUM' ? '🟡' : '🟢';
                console.log(`${i + 1}. ${severityIcon} [${event.severity}] ${event.title}`);
                console.log(`   📍 ${event.location} | 📡 ${event.source_name}\n`);
            });
        } else {
            console.log('No events found in database');
        }

        console.log('═'.repeat(60));
        console.log('\n✅ Test completed successfully!\n');

    } catch (error) {
        console.error('\n❌ Test failed:', error);
        process.exit(1);
    }
}

// Run test
testCollectors()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('Fatal error:', err);
        process.exit(1);
    });
