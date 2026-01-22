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
                if (list.length > 0) {
                    // Sort
                    const sorted = list.sort((a, b) => (a.chapterIndex || 0) - (b.chapterIndex || 0));

                    console.log(`First Chapter Index: ${sorted[0].chapterIndex}`);
                    console.log(`First Chapter Name: ${sorted[0].chapterName}`);
                    console.log(`Last Chapter Index: ${sorted[sorted.length - 1].chapterIndex}`);
                    console.log(`Last Chapter Name: ${sorted[sorted.length - 1].chapterName}`);

                    // Show first 5
                    console.log("First 5 indices:", sorted.slice(0, 5).map(c => c.chapterIndex));
                }
            } else {
                console.log("Invalid JSON structure or no chapters");
            }
        } catch (e) {
            console.error("Parse Error", e);
        }
    });
}).on('error', (e) => {
    console.error("Fetch Error", e);
});
