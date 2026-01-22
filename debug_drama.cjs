const https = require('https');

const bookId = '42000002601';

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
    console.log("Fetching Detail...");
    const detail = await get(detailUrl, "Detail");
    if (detail && detail.data) {
        console.log("Detail VideoPath:", detail.data.videoPath);
        console.log("Detail Trailer:", detail.data.trailer);
    } else {
        console.log("Detail fetch failed.");
    }

    console.log("Fetching Chapters...");
    const chaptersUrl = `https://dramabos.asia/api/dramabox/api/chapters/${bookId}?lang=in`;
    const chapters = await get(chaptersUrl, "Chapters");

    if (chapters && chapters.data && chapters.data.chapterList) {
        const list = chapters.data.chapterList;
        console.log("Total Chapters:", list.length);
        if (list.length > 0) {
            const first = list[0];
            console.log("Chapter 0 Index:", first.chapterIndex);
            console.log("Chapter 0 CdnList Length:", first.cdnList ? first.cdnList.length : 0);
            if (first.cdnList && first.cdnList[0]) {
                console.log("Chapter 0 VideoPathList:", JSON.stringify(first.cdnList[0].videoPathList));
            }
        }
    } else {
        console.log("Chapters fetch failed.");
    }
}

run();
