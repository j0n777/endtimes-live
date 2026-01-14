
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { GeocodingService } from '../lib/services/GeocodingService';
import { GeocodingRequest } from '../lib/types/StandardizedEvent';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config(); // fallback to .env

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing Supabase configuration');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const geocoder = new GeocodingService();

async function reprocessLocations() {
    console.log('🌍 Starting Location Reprocessing...');
    console.log(`Using Gemini API Key: ${GEMINI_API_KEY ? 'Present ✅' : 'Missing ❌'}`);

    // Fetch events with (0,0) coordinates
    const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .or('lat.eq.0,lng.eq.0')
        .order('detected_at', { ascending: false });

    if (error) {
        console.error('Error fetching events:', error);
        return;
    }

    if (!events || events.length === 0) {
        console.log('✅ No events found requiring geolocation fix.');
        return;
    }

    console.log(`📍 Found ${events.length} events needing geolocation.`);

    let successCount = 0;
    let failCount = 0;

    for (const event of events) {
        const searchText = `${event.title}. ${event.description || ''}`.substring(0, 500); // Limit text length

        console.log(`\n🔍 Processing: "${event.title}"`);

        // Skip if text is too short or generic
        if (searchText.length < 10) {
            console.log('   ⏭️ Skipped (text too short)');
            failCount++;
            continue;
        }

        const request: GeocodingRequest = {
            text: searchText,
            priority: 'high', // Force AI usage if possible
            context: {
                country: null // Let AI infer
            }
        };

        const result = await geocoder.geocode(request);

        if (result.success && result.location) {
            const { lat, lng, city, country } = result.location;
            console.log(`   ✅ Resolved: ${city || 'Unknown'}, ${country} (${lat}, ${lng}) - via ${result.location.geocodedBy}`);

            // Update in Supabase
            const { error: updateError } = await supabase
                .from('events')
                .update({
                    lat: lat,
                    lng: lng,
                    location: result.location.address || result.location.city || result.location.country || event.location,
                    // If we have geocoding data, store it in metadata if column exists, otherwise just lat/lng
                })
                .eq('id', event.id);

            if (updateError) {
                console.error(`   ❌ Update failed: ${updateError.message}`);
                failCount++;
            } else {
                successCount++;
            }
        } else {
            console.log(`   ❌ Failed to geocode: ${result.error}`);
            // Mark as 'failed' in some way? Or just leave as 0,0
            failCount++;
        }

        // Rate limiting to preserve standard API limits if falling back
        await new Promise(r => setTimeout(r, 1500));
    }

    console.log('\n=============================================');
    console.log(`🎉 Reprocessing Complete`);
    console.log(`✅ Fixed: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log('=============================================');
}

reprocessLocations().catch(console.error);
