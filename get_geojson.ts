import https from 'https';
import fs from 'fs';
import path from 'path';

https.get('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const geo = JSON.parse(data);
        const targetCountries = ['Iran', 'Ukraine', 'Russia', 'Israel', 'Lebanon', 'Sudan', 'Myanmar', 'Democratic Republic of the Congo', 'Mali', 'Niger', 'Burkina Faso', 'West Bank'];
        const features = geo.features.filter((f: any) => targetCountries.includes(f.properties?.name) || targetCountries.includes(f.id));

        const map: Record<string, any> = {};
        features.forEach((f: any) => {
            map[f.properties.name] = f.geometry;
        });
        console.log("Found countries:", Object.keys(map));

        // Convert to TS module for direct import
        const tsContent = `export const countryShapes: Record<string, any> = ${JSON.stringify(map, null, 2)};\n`;

        const outputPath = path.resolve(process.cwd(), 'src/lib/utils/countryShapes.ts');
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, tsContent);
        console.log('Saved to', outputPath);
    });
}).on('error', console.error);
