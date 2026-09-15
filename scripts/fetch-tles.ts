import fs from 'fs';
import { publishData } from '../lib/publishData';
import path from 'path';

export async function fetchTles() {
    console.log('🛰️  Fetching latest TLEs from CelesTrak...');
    try {
        const urls = [
            'https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle',
            'https://celestrak.org/NORAD/elements/gp.php?GROUP=weather&FORMAT=tle'
        ];

        let combinedTles = '';
        for (const url of urls) {
            const res = await fetch(url);
            if (res.ok) {
                const text = await res.text();
                combinedTles += text + '\n';
            }
        }

        const lines = combinedTles.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const tles: {name: string, tleStr: string[]}[] = [];
        
        // TLE format is 3 lines per satellite
        for (let i = 0; i < lines.length - 2; i += 3) {
            const name = lines[i];
            const tle1 = lines[i+1];
            const tle2 = lines[i+2];
            
            // List of tactical/weather satellites we want to track
            const targetSats = ['ISS (ZARYA)', 'NOAA 15', 'NOAA 18', 'NOAA 19', 'METEOR-M 2', 'SUOMI NPP', 'TIANGONG'];
            
            if (targetSats.some(target => name.toUpperCase().includes(target))) {
                tles.push({
                    name: name,
                    tleStr: [tle1, tle2]
                });
            }
        }

        const outPath = path.join(process.cwd(), 'public', 'data', 'tles.json');
        
        const dir = path.dirname(outPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(outPath, JSON.stringify(tles, null, 2));
        await publishData('tles.json', tles);
        console.log(`✅ Fetched and saved ${tles.length} TLEs to ${outPath}`);
    } catch (e) {
        console.error('❌ Failed to fetch TLEs', e);
    }
}

import { fileURLToPath } from 'url';

// Allow running standalone
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    fetchTles();
}
