
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { getGeocodingService } from '../lib/services/GeocodingService';

dotenv.config();
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const geocoder = getGeocodingService();

async function run() {
    console.log('🌍 Starting Geocoding Refinement for Hidden Events...');

    // 1. Fetch events with (0,0) or null coordinates
    // We assume 0,0 is "Null Island" default for failed/missing location
    const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .or('lat.eq.0,lng.eq.0,lat.is.null');

    if (error) {
        console.error('❌ Failed to fetch events:', error);
        return;
    }

    if (!events || events.length === 0) {
        console.log('✅ No hidden events found! Map data is clean.');
        return;
    }

    console.log(`📍 Found ${events.length} events needing geocoding.`);

    let successCount = 0;
    let failCount = 0;

    // Process in chunks to respect rate limits
    for (const event of events) {
        // Skip if title/desc is empty
        if (!event.title) continue;

        console.log(`\nProcessing: "${event.title}"`);

        try {
            // Enhanced text for geocoding
            const textToGeocode = `${event.title} ${event.description || ''} ${event.category || ''}`;

            // Force AI geocoding
            const result = await geocoder.geocode({
                text: textToGeocode,
                priority: 'high' // Use AI
            });

            if (result.success && result.location) {
                console.log(`   -> Found: ${result.location.name} (${result.location.lat.toFixed(2)}, ${result.location.lng.toFixed(2)})`);

                // Update DB
                const { error: updateError } = await supabase
                    .from('events')
                    .update({
                        location: result.location.name,
                        lat: result.location.lat,
                        lng: result.location.lng,
                        // Mark as AI processed if you have a flag, or just update
                    })
                    .eq('id', event.id);

                if (updateError) {
                    console.error('   -> Failed to update DB:', updateError.message);
                    failCount++;
                } else {
                    successCount++;
                }
            } else {
                console.log('   -> Could not geocode (AI returned no result).');
                failCount++;
            }

            // Rate limit pause (1s)
            await new Promise(r => setTimeout(r, 1000));

        } catch (e) {
            console.error('   -> Error:', e);
            failCount++;
        }
    }

    console.log(`\n🏁 Finished Refinement.`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
}

run();
