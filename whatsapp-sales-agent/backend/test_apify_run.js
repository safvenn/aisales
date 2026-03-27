const axios = require('axios');
require('dotenv').config({ path: '../.env' });

async function testFormat() {
    const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
    if(!APIFY_TOKEN) { console.log('NO TOKEN'); return; }
    try {
        const runRes = await axios.post(`https://api.apify.com/v2/acts/compass~crawler-google-places/runs?token=${APIFY_TOKEN}`, {
            searchStringsArray: ["Luxury resorts in Munnar"],
            maxCrawledPlacesPerSearch: 2,
            language: "en"
        });
        const runId = runRes.data.data.id;
        const dsId = runRes.data.data.defaultDatasetId;
        
        console.log("WAITING FOR RUN TO FINISH...");
        let status = "RUNNING";
        while(status !== "SUCCEEDED" && status !== "FAILED") {
            await new Promise(r => setTimeout(r, 6000));
            const chk = await axios.get(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`);
            status = chk.data.data.status;
            console.log(status);
        }
        console.log("RUN STATUS:", status);
        const res = await axios.get(`https://api.apify.com/v2/datasets/${dsId}/items?token=${APIFY_TOKEN}`);
        console.log("FIRST ITEM KEYS:", Object.keys(res.data[0] || {}));
        console.log("FIRST ITEM:", JSON.stringify(res.data[0] || {}, null, 2));
    } catch(e) {
        console.log("ERROR", e.message, e.response?.data);
    }
}
testFormat();
