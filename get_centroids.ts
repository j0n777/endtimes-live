import https from 'https';
import fs from 'fs';
import path from 'path';

https.get('https://raw.githubusercontent.com/gavinr/world-countries-centroids/master/dist/countries.geojson', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const geo = JSON.parse(data);
    const centroids: Record<string, [number, number]> = {}; // [lat, lng]

    geo.features.forEach((f: any) => {
      const name = f.properties.COUNTRY;
      const coords = f.geometry.coordinates; // [lng, lat]
      centroids[name] = [coords[1], coords[0]];
    });

    // Add some common aliases OpenSky uses that might not match exactly
    centroids['United States'] = centroids['United States'] || [37.0902, -95.7129];
    centroids['United Kingdom'] = centroids['United Kingdom'] || [55.3781, -3.4360];
    centroids['Russia'] = centroids['Russia'] || [61.5240, 105.3188];
    centroids['China'] = centroids['China'] || [35.8617, 104.1954];
    centroids['South Korea'] = centroids['South Korea'] || [35.9078, 127.7669];
    centroids['North Korea'] = centroids['North Korea'] || [40.3399, 127.5101];

    const tsContent = `export const COUNTRY_CENTROIDS: Record<string, [number, number]> = ${JSON.stringify(centroids, null, 2)};\n`;
    const outputPath = path.resolve(process.cwd(), 'lib/utils/countryCentroids.ts');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, tsContent);
    console.log('Saved centroids to', outputPath);
  });
}).on('error', console.error);
