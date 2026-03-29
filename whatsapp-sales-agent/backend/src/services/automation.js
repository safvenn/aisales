const axios = require('axios');
const aiService = require('./ai');
const whatsappService = require('./whatsapp');
const Lead = require('../models/Lead');
const Conversation = require('../models/Conversation');

// 1. AI generates niche keywords for the region
async function generateKeywordsByAI(targetAudience) {
    const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
    if (!APIFY_TOKEN) {
        console.log("⚠️ APIFY_API_TOKEN is missing in .env. Skipping real Apify search.");
        return [];
    }

    console.log(`🧠 AI is strategizing search keywords for: "${targetAudience}"`);
    try {
        // Use OpenRouter to generate realistic search queries
        const res = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'openrouter/auto',
            messages: [{
                role: 'system',
                content: `You are an expert lead generation strategist. The user wants to scrape Google Maps for: "${targetAudience}". Generate exactly 10 highly specific search queries (e.g. "Hair salon in Kozhikode", "Dental clinic in Malappuram", "Premium spas in Ernakulam"). Return ONLY a comma-separated list of the 10 queries.`
            }]
        }, {
            headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' }
        });

        const queries = res.data.choices[0].message.content.split(',').map(q => q.trim());
        console.log("🎯 AI generated keywords:", queries);
        return queries;
    } catch (err) {
        lastError = "OpenRouter Action Error: " + (err.response?.status || err.message);
        console.error("❌ " + lastError);
        return [];
    }
}

// 2. Scrape Google Maps using SerpApi
async function scrapeGoogleMaps(query) {
    const SERPAPI_KEY = process.env.SERPAPI_API_KEY;
    console.log(`🕵️ Scraping Google Maps via SerpApi for: "${query}"...`);
    
    if (!SERPAPI_KEY) {
        lastError = "SerpApi Key is missing from .env";
        console.error("❌ " + lastError);
        return [];
    }

    try {
        const res = await axios.get('https://serpapi.com/search.json', {
            params: {
                engine: 'google_local',
                q: query,
                api_key: SERPAPI_KEY,
                hl: 'en',
                gl: 'in' // India locale
            }
        });

        if (!res.data || !res.data.local_results) return [];

        // Map SerpApi results to match the unified scraper object format
        return res.data.local_results.map(r => ({
            title: r.title,
            phone: r.phone,
            website: r.website || r.links?.website,
            categoryName: r.type || 'Business',
            city: r.address ? r.address.split(',').slice(-2)[0]?.trim() : 'Kerala',
            phoneUnformatted: r.phone // For backwards compatibility
        }));
    } catch (err) {
        lastError = "SerpApi Error: " + (err.response?.status ? `HTTP ${err.response.status}` : err.message);
        console.error("❌ " + lastError);
        return [];
    }
}

// 3. Process Leads and Send Messages
let isRunning = false;
let currentAudience = null;
let lastError = null;

async function executeSingleCycle(targetAudience) {
    try {
        const keywords = await generateKeywordsByAI(targetAudience);
        if (keywords.length === 0) return { success: false, message: "Add APIFY_API_TOKEN to .env first." };

        let totalContacted = 0;

        for (const query of keywords) {
            if (!isRunning) break; // Break early if stopped
            
            const places = await scrapeGoogleMaps(query);
            
            for (const place of places) {
                if (!isRunning) break; // Break early if stopped

                // Filter: Must have phone, must NOT have a website
                const rawPhone = place.phoneUnformatted || place.phone;
                if (!rawPhone || place.website) continue;
                
                // Clean phone (+91 98765 43210 -> 919876543210)
                let phone = rawPhone.replace(/\D/g, '');
                phone = phone.replace(/^0+/, ''); // Strip all leading zeros
                
                // If 10 digits, assume India and add 91 prefix
                if (phone.length === 10) phone = '91' + phone;
                
                if (phone.length < 10) continue;

                // Check if already in DB
                const exists = await Lead.findOne({ phone });
                if (exists) continue;

                // Save to DB
                console.log(`📡 [DEBUG-V3] Mapping lead: name="${place.title}", phone="${phone}", type="${place.categoryName || 'Business'}"`);
                const lead = await Lead.create({
                    name: place.title,
                    phone,
                    business_type: place.categoryName || 'Business',
                    city: place.city || 'Kerala',
                    status: 'pending',
                });

                console.log(`🌟 Found new lead: ${place.title} (${phone}) without a website!`);

                // Wait 2-5 seconds to speed up messaging (limited time to message)
                const delay = Math.floor(Math.random() * 3000) + 2000;
                await new Promise(res => setTimeout(res, delay));
                if (!isRunning) break;

                // AI Outbound Message
                const msg = await aiService.generateOutreachMessage(place.title, place.categoryName, place.city);
                
                // Send via WhatsApp Baileys
                await whatsappService.sendMessage(phone, msg);

                // Update DB (wrapped in try-catch to avoid crashing cycle if log fails)
                try {
                    await Conversation.create({
                        lead_id: lead._id,
                        direction: 'outbound',
                        message: msg,
                    });
                    await Lead.findByIdAndUpdate(lead._id, { status: 'contacted', message_sent: true });
                } catch (dbErr) {
                    console.error(`⚠️ Failed to record conversation for ${phone}:`, dbErr.message);
                }

                totalContacted++;
            }
        }
        
        return { success: true, message: `Cycle complete! Contacted ${totalContacted} new businesses.` };
    } catch (err) {
        console.error("❌ Campaign execution failed:", err);
        return { success: false, error: err.message };
    }
}

async function startCampaign(targetAudience) {
    if (isRunning) return { success: false, message: "A campaign is already running!" };
    
    isRunning = true;
    currentAudience = targetAudience;
    console.log(`🚀 Starting infinite AI campaign for: ${targetAudience}`);

    // Run in background intentionally without awaiting the loop return
    (async () => {
        while (isRunning) {
            console.log("\n--- Starting new AI Search Cycle ---");
            lastError = null;
            await executeSingleCycle(currentAudience);
            
            if (!isRunning) break;
            
            console.log("💤 Cycle finished. Waiting 30 minutes before searching again to avoid spam/bans...");
            // Sleep for 30 mins
            await new Promise(res => setTimeout(res, 30 * 60 * 1000));
        }
        console.log("🛑 Campaign has been officially stopped.");
    })();

    return { success: true, message: `Autonomous infinite campaign started for: ${targetAudience}.` };
}

function stopCampaign() {
    if (!isRunning) return { success: false, message: "No campaign is currently running." };
    isRunning = false;
    currentAudience = null;
    return { success: true, message: "Campaign stopping... (will finish the current 10-second wait step if active)" };
}

function getCampaignStatus() {
    return { isRunning, currentAudience, lastError };
}

module.exports = { startCampaign, stopCampaign, getCampaignStatus };
