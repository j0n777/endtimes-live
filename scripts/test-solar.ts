import { SolarAlertCollector } from '../lib/collectors/SolarAlertCollector.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const sb = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

console.log('☀️ Testing SolarAlertCollector...');
const collector = new SolarAlertCollector(sb);
const events = await collector.collect();
console.log(`\n✅ Events found: ${events.length}`);
events.slice(0, 5).forEach(e =>
    console.log(` - [${e.severity}] ${e.title} | ${e.category} | lat=${e.coordinates?.lat}`)
);
