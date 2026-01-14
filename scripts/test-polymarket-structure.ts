import fetch from 'node-fetch';

async function run() {
    const url = 'https://gamma-api.polymarket.com/events?active=true&closed=false&limit=3';
    console.log(`Fetching ${url}...`);
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(response.statusText);
        const data = await response.json();

        console.log('--- EVENT 1 STRUCTURE ---');
        console.log(JSON.stringify(data[0], null, 2));

        if (data[0].markets) {
            console.log('--- MARKETS ---');
            console.log(JSON.stringify(data[0].markets, null, 2));
        }

    } catch (e) {
        console.error(e);
    }
}

run();
