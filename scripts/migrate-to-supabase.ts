// Migration script: Migrate existing events to Supabase
// Run this ONCE to populate Supabase with current data

import { fetchAllEvents } from './services/data-sources';
import { batchInsertEvents, supabase } from './lib/supabase';
import { MonitorEvent } from './types';
import type { EventRow } from './lib/supabase';

/**
 * Convert MonitorEvent to Supabase EventRow format
 */
function convertToEventRow(event: MonitorEvent): Partial<EventRow> {
    return {
        id: event.id,
        lat: event.coordinates.lat,
        lng: event.coordinates.lng,
        category: event.category,
        severity: event.severity,
        title: event.title,
        description: event.description,
        location: event.location,
        source_name: event.sourceName,
        source_type: event.sourceType,
        source_url: event.sourceUrl,
        conflict_level: event.conflictLevel,
        event_timestamp: event.timestamp,
        metadata: {
            ...event.metadata
        }
    };
}

/**
 * Main migration function
 */
async function migrateToSupabase() {
    console.log('🚀 Starting migration to Supabase...');

    try {
        // Step 1: Fetch all events from current sources
        console.log('📥 Fetching events from current sources...');
        const result = await fetchAllEvents();
        const events = result.events;

        console.log(`✅ Fetched ${events.length} events from ${result.statuses.length} sources`);

        // Step 2: Convert to Supabase format
        console.log('🔄 Converting events to Supabase format...');
        const eventRows = events.map(convertToEventRow);

        // Step 3: Batch insert (500 at a time to avoid timeout)
        console.log('💾 Inserting into Supabase...');
        const BATCH_SIZE = 500;
        let inserted = 0;

        for (let i = 0; i < eventRows.length; i += BATCH_SIZE) {
            const batch = eventRows.slice(i, i + BATCH_SIZE);
            const result = await batchInsertEvents(batch);
            inserted += result.length;
            console.log(`  Inserted ${inserted}/${eventRows.length} events...`);
        }

        console.log(`✅ Migration complete! Inserted ${inserted} events into Supabase`);

        // Step 4: Verify
        const { count } = await supabase
            .from('events')
            .select('*', { count: 'exact', head: true });

        console.log(`📊 Total events in Supabase: ${count}`);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    migrateToSupabase()
        .then(() => {
            console.log('✅ Migration successful!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Migration failed:', error);
            process.exit(1);
        });
}

export { migrateToSupabase };
