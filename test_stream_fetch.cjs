const https = require('https');

const bookId = '42000000651';
const indices = [0, 1, 2, 3];

async function fetchStream(index) {
    return new Promise((resolve) => {
        const url = `https://dramabos.asia/api/dramabox/api/watch/player?bookId=${bookId}&index=${index}&lang=in`;
        console.log(`Fetching Index ${index}: ${url}`);

        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    // console.log(`Response ${index}:`, JSON.stringify(json).substring(0, 100) + "...");
                    if (json.success && json.data && json.data.videoUrl) {
                        console.log(`[SUCCESS] Index ${index} Video: ${json.data.videoUrl.substring(0, 50)}...`);
                        resolve(true);
                    } else {
                        console.log(`[FAILED] Index ${index} - No Video URL. Msg: ${json.message || 'Unknown'}`);
                        resolve(false);
                    }
                } catch (e) {
                    console.error(`[ERROR] Index ${index} Parse Error`);
                    resolve(false);
                }
            });
        }).on('error', e => {
            console.error(`[ERROR] Index ${index} Fetch Error`);
            resolve(false);
        });
    });
}

async function run() {
    for (const i of indices) {
        await fetchStream(i);
        // Wait a bit to avoid rate limits
        await new Promise(r => setTimeout(r, 1000));
    }
}

run();
