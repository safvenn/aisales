const express = require('express');
const router = express.Router();
const pool = require('../db');
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
    const leadResult = await pool.query('SELECT * FROM leads WHERE phone = $1', [phone]);
    const lead = leadResult.rows[0];

    if (!lead) {
      console.log(`⚠️ Unknown sender: ${phone}`);
      return;
    }

    // Save inbound message
    await pool.query(
      `INSERT INTO conversations (lead_id, direction, message) VALUES ($1, 'inbound', $2)`,
      [lead.id, text]
    );

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
    await pool.query(`UPDATE leads SET status = $1 WHERE id = $2`, [newStatus, lead.id]);

    if (intent === 'Not Interested') return;

    // Generate and send AI reply
    const reply = await aiService.generateReply(lead.name, text, intent);
    await whatsappService.sendMessage(phone, reply);

    // Save outbound message
    await pool.query(
      `INSERT INTO conversations (lead_id, direction, message, intent) VALUES ($1, 'outbound', $2, $3)`,
      [lead.id, reply, intent]
    );

  } catch (err) {
    console.error('❌ Webhook error:', err.message);
  }
});

module.exports = router;
