const axios = require('axios');
async function run() {
    try {
        const res = await axios.get('https://api.apify.com/v2/acts/compass~crawler-google-places');
        console.log("crawler-google-places SUCCESS");
    } catch(e) {
        console.log("crawler-google-places ERROR: " + e.response?.status);
    }
    try {
        const res = await axios.get('https://api.apify.com/v2/acts/drobnikj~google-maps-scraper');
        console.log("drobnikj SUCCESS");
    } catch(e) {
        console.log("drobnikj ERROR: " + e.response?.status);
    }
    try {
        const res = await axios.get('https://api.apify.com/v2/acts/compass~google-maps');
        console.log("compass~google-maps SUCCESS");
    } catch(e) {
        console.log("compass~google-maps ERROR: " + e.response?.status);
    }
}
run();
