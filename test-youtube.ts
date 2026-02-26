async function test() {
    try {
        const response = await fetch('https://www.youtube.com/channel/UCkS9rAemj0VzG4kZNR0D8sQ/live', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            },
            redirect: 'follow'
        });
        const html = await response.text();
        const match = html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([^"]+)">/);
        if (match && match[1]) {
            console.log('Video ID:', match[1]);
        } else {
            console.log('No canonical link found. Snippet:', html.substring(0, 500));
        }
    } catch (e) {
        console.error(e);
    }
}
test();
