const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const Conversation = require('../models/Conversation');
const whatsappService = require('../services/whatsapp');
const aiService = require('../services/ai');

// WhatsApp verification handshake
router.get('/', (req, res) => {
  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('✅ Webhook verified by Meta');
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// Incoming WhatsApp messages
router.post('/', async (req, res) => {
  try {
    res.sendStatus(200); // Always ACK immediately

    const entry = req.body?.entry?.[0];
    const change = entry?.changes?.[0]?.value;
    const message = change?.messages?.[0];

    if (!message || message.type !== 'text') return;

    const phone = message.from;
    const text = message.text.body;

    console.log(`📩 Message from ${phone}: ${text}`);

    // Find lead in DB
    const lead = await Lead.findOne({ phone });

    if (!lead) {
      console.log(`⚠️ Unknown sender: ${phone}`);
      return;
    }

    // Save inbound message
    await Conversation.create({
      lead_id: lead._id,
      direction: 'inbound',
      message: text,
    });

    // Classify intent with AI
    const intent = await aiService.classifyIntent(text);
    console.log(`🧠 Intent: ${intent}`);

    // Update lead status based on intent
    const statusMap = {
      'Interested': 'interested',
      'Price Inquiry': 'interested',
      'Need Details': 'interested',
      'Not Interested': 'dead',
      'Call Request': 'hot',
    };
    const newStatus = statusMap[intent] || 'contacted';
    await Lead.findByIdAndUpdate(lead._id, { status: newStatus });

    if (intent === 'Not Interested') return;

    // Generate and send AI reply
    const reply = await aiService.generateReply(lead.name, text, intent);
    await whatsappService.sendMessage(phone, reply);

    // Save outbound message
    await Conversation.create({
      lead_id: lead._id,
      direction: 'outbound',
      message: reply,
      intent,
    });

  } catch (err) {
    console.error('❌ Webhook error:', err.message);
  }
});

module.exports = router;
