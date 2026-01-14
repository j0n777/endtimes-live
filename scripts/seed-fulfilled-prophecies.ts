
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { BIBLICAL_PROPHECIES } from '../prophecyData.ts';
import { EventCategory } from '../types.ts';

dotenv.config();
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function seedProphecies() {
    console.log('📖 Seeding Fulfilled Prophecies into Events table...');

    const prophecies = BIBLICAL_PROPHECIES.filter(p => p.status === 'FULFILLED' || p.status === 'IN_PROGRESS');

    const events = prophecies.map(p => {
        // Determine location based on content (simple heuristic)
        let location = 'Global';
        if (p.title.includes('Israel') || p.description.includes('Israel') || p.description.includes('Jerusalem')) {
            location = 'Israel';
        } else if (p.description.includes('EU') || p.description.includes('European')) {
            location = 'Brussels, Belgium';
        } else if (p.description.includes('Damascus')) {
            location = 'Damascus, Syria';
        }

        // Coordinates (generic centers)
        let lat = 0, lng = 0;
        if (location === 'Israel') { lat = 31.0461; lng = 34.8516; }
        else if (location === 'Jerusalem') { lat = 31.7683; lng = 35.2137; }
        else if (location === 'Damascus, Syria') { lat = 33.5138; lng = 36.2765; }
        else if (location === 'Brussels, Belgium') { lat = 50.8503; lng = 4.3517; }

        return {
            title: `PROPHECY: ${p.title}`,
            description: `${p.scripture} - ${p.description}`,
            category: 'PROPHETIC', // EventCategory.PROPHETIC
            severity: p.warningLevel || 'MEDIUM',
            source_type: 'MANUAL',
            source_name: 'Biblical Scripture',
            location: location,
            lat: lat,
            lng: lng,
            event_timestamp: new Date().toISOString(), // Show as active now
            source_url: `https://bible.com/bible/111/${p.scripture.replace(/:/g, '.').replace(/ /g, '.')}`,
            metadata: {
                prophecyId: p.id,
                status: p.status,
                scripture: p.scripture
            }
        };
    });

    console.log(`Preparing to insert ${events.length} prophetic events...`);

    const { error } = await supabase
        .from('events')
        .insert(events);

    if (error) {
        console.error('❌ Error seeding prophecies:', error);
    } else {
        console.log('✅ Prophecies seeded successfully!');
    }
}

seedProphecies();
