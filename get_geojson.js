const https = require('https');
const fs = require('fs');

https.get('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const geo = JSON.parse(data);
    const targetCountries = ['Iran', 'Ukraine', 'Russia', 'Israel', 'Lebanon', 'Sudan', 'Myanmar', 'Democratic Republic of the Congo', 'Mali', 'Niger', 'Burkina Faso'];
    const features = geo.features.filter(f => targetCountries.includes(f.name) || targetCountries.includes(f.properties?.name));
    
    // Create a map
    const map = {};
    features.forEach(f => {
      map[f.properties ? f.properties.name : f.name] = f.geometry || f;
    });
    console.log(Object.keys(map));
    fs.writeFileSync('src/lib/utils/country_shapes.json', JSON.stringify(map));
  });
}).on('error', console.error);
