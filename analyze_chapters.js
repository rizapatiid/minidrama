const https = require('https');

const url = "https://dramabos.asia/api/dramabox/api/chapters/42000000651?lang=in";

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.success && json.data && json.data.chapterList) {
                const list = json.data.chapterList;
                console.log(`Total Chapters: ${list.length}`);
                console.log(`First Chapter Index: ${list[0].chapterIndex}`);
                console.log(`Last Chapter Index: ${list[list.length - 1].chapterIndex}`);

                // Sort and check gaps
                const sorted = list.sort((a, b) => a.chapterIndex - b.chapterIndex);
                console.log(`Sorted Start: ${sorted[0].chapterIndex}`);
                console.log(`Sorted End: ${sorted[sorted.length - 1].chapterIndex}`);

                // Check for gaps
                let previous = sorted[0].chapterIndex;
                let gaps = 0;
                for (let i = 1; i < sorted.length; i++) {
                    if (sorted[i].chapterIndex !== previous + 1) {
                        gaps++;
                        if (gaps < 5) console.log(`Gap found between ${previous} and ${sorted[i].chapterIndex}`);
                    }
                    previous = sorted[i].chapterIndex;
                }

            } else {
                console.log("Invalid JSON structure or no chapters");
                console.log(JSON.stringify(json).substring(0, 200));
            }
        } catch (e) {
            console.error("Parse Error", e);
        }
    });
}).on('error', (e) => {
    console.error("Fetch Error", e);
});
