
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';

dotenv.config();
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const parser = new Parser();

const FEEDS = [
    'https://news.google.com/rss/search?q=christian+persecution+attack+church&hl=en-US&gl=US&ceid=US:en',
    'https://www.persecution.org/feed/',
    'https://morningstarnews.org/feed/'
];

async function run() {
    console.log('✝️ Fetching Christian Persecution Data...');
    const events: any[] = [];

    for (const url of FEEDS) {
        try {
            console.log(`Fetching ${url}...`);
            const feed = await parser.parseURL(url);

            for (const item of feed.items) {
                // Filter old items
                const pubDate = new Date(item.pubDate || new Date());
                if ((Date.now() - pubDate.getTime()) > 7 * 24 * 60 * 60 * 1000) continue; // 7 days

                const content = (item.title + ' ' + (item.contentSnippet || '')).toLowerCase();

                // Severity logic
                let severity = 'MEDIUM';
                if (content.includes('kill') || content.includes('murder') || content.includes('dead') || content.includes('massacre')) {
                    severity = 'CRITICAL';
                } else if (content.includes('arrest') || content.includes('prison') || content.includes('attack')) {
                    severity = 'HIGH';
                }

                // Location logic (Simple)
                let location = 'Global';
                let lat = 0, lng = 0;

                const countries: { [key: string]: [number, number] } = {
                    'nigeria': [9.0820, 8.6753],
                    'china': [35.8617, 104.1954],
                    'north korea': [40.3399, 127.5101],
                    'pakistan': [30.3753, 69.3451],
                    'india': [20.5937, 78.9629],
                    'iran': [32.4279, 53.6880],
                    'burkina faso': [12.2383, -1.5616],
                    'mozambique': [-18.6657, 35.5296]
                };

                for (const [country, coords] of Object.entries(countries)) {
                    if (content.includes(country)) {
                        location = country.charAt(0).toUpperCase() + country.slice(1);
                        lat = coords[0];
                        lng = coords[1];
                        break;
                    }
                }

                events.push({
                    title: item.title,
                    description: item.contentSnippet?.substring(0, 500) || '',
                    category: 'PERSECUTION',
                    severity: severity,
                    source_type: 'RSS',
                    source_name: feed.title || 'Persecution Watch',
                    source_url: item.link,
                    event_timestamp: pubDate.toISOString(),
                    location: location,
                    lat: lat,
                    lng: lng,
                    fetched_at: new Date().toISOString()
                });
            }
        } catch (e) {
            console.error(`Error fetching ${url}:`, e);
        }
    }

    console.log(`Found ${events.length} events. Inserting...`);

    // Insert/Upsert
    // We don't have unique constraint on URL maybe? Let's try insert.
    for (const event of events) {
        // Basic check to avoid exact duplicate title today
        const { data } = await supabase.from('events').select('id').eq('title', event.title).limit(1);
        if (!data || data.length === 0) {
            await supabase.from('events').insert(event);
        }
    }

    console.log('✅ Done.');
}

run();
