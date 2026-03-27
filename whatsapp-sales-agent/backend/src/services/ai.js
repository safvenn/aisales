const axios = require('axios');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'openrouter/auto';

async function classifyIntent(message) {
  const res = await axios.post(BASE_URL, {
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: `Classify the customer message into EXACTLY one of these: Interested, Not Interested, Price Inquiry, Need Details, Call Request. Reply with ONLY the category name.`,
      },
      { role: 'user', content: message },
    ],
  }, {
    headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
  });
  return res.data.choices[0].message.content.trim();
}

async function generateReply(leadName, message, intent) {
  const systemPrompt = `You are SalesSync, a friendly AI sales assistant for a web development agency in Kerala. 
The customer's name is "${leadName}". Their intent is "${intent}". 
Write a short, natural WhatsApp reply (max 3 sentences). 
If they ask about price, mention affordable packages starting from ₹4999. 
If they want details, share a demo link: https://salon-demo.vercel.app
If they want a call, say the admin will call within 24 hours.
Never use formal language. Use emojis sparingly.`;

  const res = await axios.post(BASE_URL, {
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message },
    ],
  }, {
    headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
  });
  return res.data.choices[0].message.content.trim();
}

async function generateOutreachMessage(businessName, businessType, city) {
  const res = await axios.post(BASE_URL, {
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: `You are SalesSync. Write a short, friendly WhatsApp outreach message to a ${businessType} called "${businessName}" in ${city}, Kerala. Say you noticed they don't have a website and offer a free demo. Max 2 sentences. No hashtags.`,
      },
    ],
  }, {
    headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
  });
  return res.data.choices[0].message.content.trim();
}

module.exports = { classifyIntent, generateReply, generateOutreachMessage };
