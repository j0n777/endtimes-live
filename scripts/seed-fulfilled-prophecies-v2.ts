
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PROPHECIES_TO_SEED = [
    {
        title: 'Rebirth of Israel in One Day',
        scripture: 'Isaiah 66:8',
        description: '"Shall a nation be born in a day?" Israel declared independence on May 14, 1948, becoming a nation in a single day.',
        category: 'ISAIAH',
        location: 'Tel Aviv, Israel',
        lat: 32.0853,
        lng: 34.7818,
        severity: 'LOW',
        warningLevel: 'LOW'
    },
    {
        title: 'Desert Will Blossom',
        scripture: 'Isaiah 35:1-2',
        description: 'Israel transformed the Negev Desert into fertile agricultural land, exporting fruit to the world.',
        category: 'ISAIAH',
        location: 'Negev Desert, Israel',
        lat: 30.5000,
        lng: 34.9000,
        severity: 'LOW',
        warningLevel: 'LOW'
    },
    {
        title: 'Hebrew Language Revived',
        scripture: 'Zephaniah 3:9',
        description: 'Hebrew, a dead language for 2000 years, was revived as the national spoken language of Israel.',
        category: 'ZECHARIAH',
        location: 'Jerusalem, Israel',
        lat: 31.7683,
        lng: 35.2137,
        severity: 'LOW',
        warningLevel: 'LOW'
    },
    {
        title: 'Jerusalem Retaken (1967)',
        scripture: 'Luke 21:24',
        description: 'Jerusalem returned to Jewish control in the Six-Day War (1967), ending the "times of the Gentiles" trampling it.',
        category: 'JESUS_OLIVET',
        location: 'Western Wall, Jerusalem',
        lat: 31.7767,
        lng: 35.2345,
        severity: 'MEDIUM',
        warningLevel: 'MEDIUM'
    },
    {
        title: 'Knowledge Explosion',
        scripture: 'Daniel 12:4',
        description: '"Knowledge shall increase." Exponential growth of technology, AI, and digital information.',
        category: 'DANIEL',
        location: 'Global',
        lat: 37.7749, // Silicon Valley (symbolic)
        lng: -122.4194,
        severity: 'MEDIUM',
        warningLevel: 'MEDIUM'
    },
    {
        title: 'Gospel to All Nations',
        scripture: 'Matthew 24:14',
        description: 'Gospel preached in nearly every nation. <1% unreached tribes remain.',
        category: 'JESUS_OLIVET',
        location: 'Global',
        lat: 0,
        lng: 0, // Global event
        severity: 'LOW',
        warningLevel: 'MEDIUM'
    }
];

async function seedProphecies() {
    console.log('📖 Seeding Fulfilled Prophecies into Events table...');

    const events = PROPHECIES_TO_SEED.map(p => {
        return {
            title: `PROPHECY: ${p.title}`,
            description: `${p.scripture} - ${p.description}`,
            category: 'PROPHETIC',
            severity: p.warningLevel || 'MEDIUM',
            source_type: 'MANUAL',
            source_name: 'Biblical Scripture',
            location: p.location,
            lat: p.lat,
            lng: p.lng,
            event_timestamp: new Date().toISOString(), // Show as active now
            source_url: `https://bible.com/bible/111/GEN.1.1`,
            metadata: {
                scripture: p.scripture,
                status: 'FULFILLED'
            }
        };
    });

    const { error } = await supabase
        .from('events')
        .insert(events);

    if (error) {
        console.error('❌ Error seeding prophecies:', error);
    } else {
        console.log(`✅ ${events.length} Prophecies seeded successfully!`);
    }
}

seedProphecies();
