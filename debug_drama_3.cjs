const https = require('https');

const bookId = '42000004169';

async function run() {
    console.log(`Checking BookID: ${bookId}`);

    // 1. Check Stream API
    const streamUrl = `https://dramabos.asia/api/dramabox/api/watch/player?bookId=${bookId}&index=0&lang=in`;
    console.log(`API Stream URL: ${streamUrl}`);

    https.get(streamUrl, res => {
        console.log(`Stream API Status: ${res.statusCode}`);
    });

    // 2. Check Detail & Chapters for fallback
    const detailUrl = `https://dramabos.asia/api/dramabox/api/drama/${bookId}?lang=in`;
    https.get(detailUrl, res => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                if (json.success && json.data) {
                    console.log("Detail VideoPath:", json.data.videoPath);
                    console.log("Detail Trailer:", json.data.trailer);
                } else {
                    console.log("Detail Fetch Failed or Success False");
                }
            } catch (e) { }
        });
    });
}

run();
