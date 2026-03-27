const axios = require('axios');
require('dotenv').config({ path: '../.env' });

async function testFormat() {
    const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
    try {
        const runRes = await axios.post(`https://api.apify.com/v2/acts/compass~crawler-google-places/runs?token=${APIFY_TOKEN}`, {
            searchStringsArray: ["resorts in kerala"],
            maxCrawledPlacesPerSearch: 2,
            language: "en"
        });
        const runId = runRes.data.data.id;
        const dsId = runRes.data.data.defaultDatasetId;
        
        let status = "RUNNING";
        while(status !== "SUCCEEDED" && status !== "FAILED") {
            await new Promise(r => setTimeout(r, 5000));
            const chk = await axios.get(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`);
            status = chk.data.data.status;
        }
        const res = await axios.get(`https://api.apify.com/v2/datasets/${dsId}/items?token=${APIFY_TOKEN}`);
        const item = res.data[0] || {};
        console.log("KEYS:", Object.keys(item).join(", "));
        console.log("PHONE:", item.phone, "| UNFORMATTED:", item.phoneUnformatted);
        console.log("WEBSITE:", item.website);
    } catch(e) {}
}
testFormat();
