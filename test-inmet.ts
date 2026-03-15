import https from 'https';
https.get('https://apidatalake.inmet.gov.br/api/avisos/ativos', { headers: { 'User-Agent': 'EndTimesMonitor/1.0' } }, (res) => {
    let data = '';
    res.on('data', d => data += d);
    res.on('end', () => {
        try {
            const arr = JSON.parse(data);
            console.log("Total length:", arr.length);
            // Group by id_aviso to prevent duplicated alerts for each city
            const uniqueAlerts = new Map();
            for(const a of arr) {
                if(!uniqueAlerts.has(a.id_aviso)) uniqueAlerts.set(a.id_aviso, a);
            }
            console.log("Unique alerts:", uniqueAlerts.size);
            const alerts = Array.from(uniqueAlerts.values());
            console.log("Sample:", alerts[0]);
        } catch(e) {
            console.log("Error:", e.message);
        }
    });
});
