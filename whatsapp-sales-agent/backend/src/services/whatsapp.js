const { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const NodeCache = require('node-cache');
const qrcode = require('qrcode-terminal');
const pool = require('../db');
const aiService = require('./ai');

// cache for messages to handle retries
const msgRetryCounterCache = new NodeCache();

let sock = null;

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('./baileys_auth_info');
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`using WA v${version.join('.')}, isLatest: ${isLatest}`);

  sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }), // change to 'info' for debugging
    auth: state,
    msgRetryCounterCache,
    generateHighQualityLinkPreviews: true,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
        qrcode.generate(qr, { small: true });
        console.log('📱 Scan the QR code above with your WhatsApp app.');
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('❌ Connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect);
      if (shouldReconnect) {
        connectToWhatsApp();
      }
    } else if (connection === 'open') {
      console.log('✅ WhatsApp Web connected!');
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    // only process new messages, and ignore our own outbound messages
    if (m.type !== 'notify') return;
    
    for (const msg of m.messages) {
      if (msg.key.fromMe) continue;
      
      const remoteJid = msg.key.remoteJid;
      // Extract pure phone number assuming JID like 919876543210@s.whatsapp.net
      const phone = remoteJid.split('@')[0];
      
      // Extract text content from various message types message could take
      const text = msg.message?.conversation || 
                   msg.message?.extendedTextMessage?.text || 
                   '';

      if (!text) continue; // ignore non-text messages like images/stickers
      
      console.log(`📩 Message from ${phone}: ${text}`);

      try {
        // Find lead in DB
        const leadResult = await pool.query('SELECT * FROM leads WHERE phone = $1', [phone]);
        const lead = leadResult.rows[0];

        if (!lead) {
            console.log(`⚠️ Unknown sender: ${phone}. Storing as raw inbound message without lead context if needed...`);
            continue; // Could insert a raw log here, but let's ignore to just engage valid leads
        }

        // Save inbound message
        await pool.query(
          `INSERT INTO conversations (lead_id, direction, message) VALUES ($1, 'inbound', $2)`,
          [lead.id, text]
        );

        // Anti-ban mark as read
        await sock.readMessages([msg.key]);

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

        if (intent === 'Not Interested') continue;

        // Generate AI reply
        const reply = await aiService.generateReply(lead.name, text, intent);
        
        // Anti-Ban Mimic typing delay based on reply length (approx human speed)
        await sock.presenceSubscribe(remoteJid);
        await sock.sendPresenceUpdate('composing', remoteJid);
        const typingDurationMs = Math.min(Math.max(reply.length * 50, 2000), 5000); // between 2-5 seconds mostly
        await new Promise(resolve => setTimeout(resolve, typingDurationMs));
        await sock.sendPresenceUpdate('paused', remoteJid);

        // Send Reply
        await sock.sendMessage(remoteJid, { text: reply });

        // Save outbound message
        await pool.query(
          `INSERT INTO conversations (lead_id, direction, message, intent) VALUES ($1, 'outbound', $2, $3)`,
          [lead.id, reply, intent]
        );

      } catch (err) {
        console.error('❌ Error handling message:', err.message);
      }
    }
  });
}

// Helper function used by other scheduled outbound campaigns (like n8n triggering API)
async function sendMessage(toPhone, textMsg) {
    if (!sock) throw new Error("WhatsApp socket not initialized");
    const jid = `${toPhone}@s.whatsapp.net`;
    
    // Anti-ban measure for outbound initiated messages
    await sock.presenceSubscribe(jid);
    await sock.sendPresenceUpdate('composing', jid);
    const typingDurationMs = Math.min(Math.max(textMsg.length * 50, 2000), 5000);
    await new Promise(resolve => setTimeout(resolve, typingDurationMs));
    await sock.sendPresenceUpdate('paused', jid);

    await sock.sendMessage(jid, { text: textMsg });
    console.log(`✅ Message sent to ${toPhone}`);
}

module.exports = { connectToWhatsApp, sendMessage };
