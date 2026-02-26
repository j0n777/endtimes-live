// ESM Dirname Fix
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import 'dotenv/config'; // Load .env file
import { createClient } from '@supabase/supabase-js';
import { SURVIVAL_GUIDES, PROPHECY_EVENTS } from '../constants';
import { BIBLICAL_PROPHECIES } from '../prophecyData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOMAIN = 'https://endtimes.live';
const SITEMAP_PATH = path.resolve(__dirname, '../public/sitemap.xml');

// Initialize Supabase (Use Service Key if available for bypass RLS, or Anon)
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase Environment Variables. Ensure .env is present.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateSitemap() {
    console.log("🌐 Starting Sitemap Generation...");

    // 1. Static Base URLs
    const urls = [
        { loc: '/', priority: 1.0, changefreq: 'always' },
        { loc: '/map', priority: 0.9, changefreq: 'always' },
        { loc: '/prophecy', priority: 0.8, changefreq: 'daily' },
        { loc: '/survival', priority: 0.8, changefreq: 'weekly' },
        { loc: '/feed', priority: 0.9, changefreq: 'always' },
    ];

    // 2. Static Content: Survival Guides
    console.log(`📚 Adding ${SURVIVAL_GUIDES.length} Survival Guides...`);
    SURVIVAL_GUIDES.forEach(guide => {
        urls.push({
            loc: `/?view=SURVIVAL&guide=${guide.id}`,
            priority: 0.7,
            changefreq: 'monthly'
        });
    });

    // 3. Static Content: Prophecies
    const allProphecies = [...PROPHECY_EVENTS, ...BIBLICAL_PROPHECIES];
    console.log(`📜 Adding ${allProphecies.length} Prophecies...`);
    allProphecies.forEach(p => {
        urls.push({
            loc: `/?prophecy=${p.id}`,
            priority: 0.6,
            changefreq: 'monthly'
        });
    });

    // 4. Dynamic Content: Live Events from Supabase
    try {
        console.log("📡 Fetching Live Events from Supabase...");

        // Fetch last 100 significant events
        const { data: events, error } = await supabase
            .from('events')
            .select('id, event_timestamp, severity')
            .order('event_timestamp', { ascending: false })
            .limit(100);

        if (error) throw error;

        if (events && events.length > 0) {
            console.log(`🔥 Found ${events.length} live events.`);
            events.forEach(event => {
                // Higher priority for recent/critical events
                const isHighSeverity = event.severity === 'CRITICAL' || event.severity === 'HIGH';
                urls.push({
                    loc: `/?event=${event.id}`,
                    priority: isHighSeverity ? 0.8 : 0.6,
                    changefreq: 'never' // Historic events don't change often
                });
            });
        } else {
            console.log("⚠️ No events found in database.");
        }

    } catch (err) {
        console.error("❌ Failed to fetch live events:", err);
        // Continue generation even if DB fails, to preserve static map
    }

    // 5. Generate XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${DOMAIN}${u.loc.startsWith('http') ? '' : u.loc.replace('&', '&amp;')}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    // 6. Write to File
    fs.writeFileSync(SITEMAP_PATH, sitemap);
    console.log(`✅ Sitemap generated successfully at ${SITEMAP_PATH}`);
    console.log(`📊 Total URLs: ${urls.length}`);
}

generateSitemap();
