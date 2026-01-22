const https = require('https');

const bookId = '42000004480';

// 1. Fetch Detail
const detailUrl = `https://dramabos.asia/api/dramabox/api/drama/${bookId}?lang=in`;

function get(url, name) {
    return new Promise(resolve => {
        https.get(url, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json);
                } catch (e) { console.error(name, "Parse Error"); resolve(null); }
            });
        });
    });
}

async function run() {
    console.log(`Analyzing BookID: ${bookId}`);

    // Check Stream for Index 0
    const streamUrl = `https://dramabos.asia/api/dramabox/api/watch/player?bookId=${bookId}&index=0&lang=in`;
    console.log(`Checking Stream URL: ${streamUrl}`);

    https.get(streamUrl, res => {
        console.log(`Stream Status: ${res.statusCode}`);
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
            console.log("Stream Response:", data.substring(0, 200));
        });
    });
}

run();
