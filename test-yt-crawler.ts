import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { YouTubeLiveCollector } from './lib/collectors/YouTubeLiveCollector';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testYouTubeCollector() {
    console.log("Initializing YouTubeLiveCollector...");
    const collector = new YouTubeLiveCollector(supabase);
    
    console.log("Fetching data...");
    const events = await (collector as any).fetchData();
    
    console.log(`\nResults: ${events.length} Live Cams mapped!\n`);
    events.forEach((e: any) => {
        console.log(`📍 ${e.title} -> ${e.location} (${e.coordinates.lat}, ${e.coordinates.lng})`);
        console.log(`   Feed: ${e.mediaUrl}\n`);
    });
}

testYouTubeCollector().catch(console.error);
