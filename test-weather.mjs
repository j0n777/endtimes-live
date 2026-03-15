import https from 'https';

console.log("Fetching INMET...");
https.get('https://apiprevmet3.inmet.gov.br/avisos/hoje', {
    headers: { 'User-Agent': 'EndTimesMonitor/1.0' }
}, (res) => {
    let data = '';
    res.on('data', d => data += d);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            const alerts = json.hoje || [];
            console.log(`Found ${alerts.length} INMET alerts.`);
            if (alerts.length > 0) {
                const uniqueSeverities = [...new Set(alerts.map(a => a.id_severidade || a.severidade || a.id_condicao_severa || a.id_icone))];
                console.log("Available severity fields:", alerts[0]);
                console.log("Unique severity indicators:", uniqueSeverities);
            }
        } catch (e) {
            console.log("INMET Error:", e.message);
        }
    });
});

console.log("Fetching NWS...");
https.get('https://api.weather.gov/alerts/active?status=Actual&messageType=Alert&severity=Extreme,Severe', {
    headers: { 'User-Agent': 'EndTimesMonitor/1.0 (contact@endtimes.live)' }
}, (res) => {
    let data = '';
    res.on('data', d => data += d);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            const alerts = json.features || [];
            console.log(`Found ${alerts.length} NWS alerts.`);
            if (alerts.length > 0) {
                console.log("First NWS alert properties:", alerts[0].properties);
            }
        } catch (e) {
            console.log("NWS Error:", e.message);
        }
    });
});
