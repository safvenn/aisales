const axios = require('axios');
async function run() {
    try {
        const res = await axios.post('https://api.apify.com/v2/acts/compass~crawler-google-places/runs', {});
        console.log("POST SUCCESS");
    } catch(e) {
        console.log("POST ERROR: " + e.response?.status + " - " + JSON.stringify(e.response?.data));
    }
}
run();
