import https from 'https';
https.get('https://apiprevmet3.inmet.gov.br/avisos/ativos', (res) => {
    let data = '';
    res.on('data', d => data += d);
    res.on('end', () => {
        try {
            console.log(data.substring(0, 500));
        } catch (e) {
            console.log("Error:", e.message);
        }
    });
}).on('error', console.error);
