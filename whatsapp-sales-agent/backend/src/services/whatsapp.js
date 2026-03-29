const { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const NodeCache = require('node-cache');
const qrcode = require('qrcode-terminal');
const Lead = require('../models/Lead');
const Conversation = require('../models/Conversation');
const aiService = require('./ai');

const msgRetryCounterCache = new NodeCache();

let sock = null;
let connectionState = 'connecting'; // connecting | open | close

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('./baileys_auth_info');
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`using WA v${version.join('.')}, isLatest: ${isLatest}`);

  sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
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
      connectionState = 'close';
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('❌ Connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);
      if (shouldReconnect) {
        connectToWhatsApp();
      }
    } else if (connection === 'open') {
      connectionState = 'open';
      console.log('✅ WhatsApp Web connected!');
    } else if (connection === 'connecting') {
      connectionState = 'connecting';
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    if (m.type !== 'notify') return;

    for (const msg of m.messages) {
      if (msg.key.fromMe) continue;

      const remoteJid = msg.key.remoteJid;
      const phone = remoteJid.split('@')[0];
      const text =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        '';

      if (!text) continue;

      console.log(`📨 Message from ${phone}: ${text}`);

      try {
        const lead = await Lead.findOne({ phone });

        if (!lead) {
          console.log(`⚠️ Unknown sender: ${phone}.`);
          continue;
        }

        await Conversation.create({
          lead_id: lead._id,
          direction: 'inbound',
          message: text,
        });

        await sock.readMessages([msg.key]);

        const intent = await aiService.classifyIntent(text);
        console.log(`🧠 Intent: ${intent}`);

        const statusMap = {
          Interested: 'interested',
          'Price Inquiry': 'interested',
          'Need Details': 'interested',
          'Not Interested': 'dead',
          'Call Request': 'hot',
        };
        const newStatus = statusMap[intent] || 'contacted';
        await Lead.findByIdAndUpdate(lead._id, { status: newStatus });

        if (intent === 'Not Interested') continue;

        const reply = await aiService.generateReply(lead.name, text, intent);

        await sock.presenceSubscribe(remoteJid);
        await sock.sendPresenceUpdate('composing', remoteJid);
        const typingDurationMs = Math.min(Math.max(reply.length * 50, 2000), 5000);
        await new Promise((resolve) => setTimeout(resolve, typingDurationMs));
        await sock.sendPresenceUpdate('paused', remoteJid);

        await sock.sendMessage(remoteJid, { text: reply });

        await Conversation.create({
          lead_id: lead._id,
          direction: 'outbound',
          message: reply,
          intent,
        });
      } catch (err) {
        console.error('❌ Error handling message:', err.message);
      }
    }
  });
}

async function sendMessage(toPhone, textMsg) {
  if (!sock) throw new Error('WhatsApp socket not initialized');
  const jid = `${toPhone}@s.whatsapp.net`;

  await sock.presenceSubscribe(jid);
  await sock.sendPresenceUpdate('composing', jid);
  const typingDurationMs = Math.min(Math.max(textMsg.length * 50, 2000), 5000);
  await new Promise((resolve) => setTimeout(resolve, typingDurationMs));
  await sock.sendPresenceUpdate('paused', jid);

  await sock.sendMessage(jid, { text: textMsg });
  console.log(`✅ Message sent to ${toPhone}`);
}

function getConnectionState() {
  return connectionState;
}

module.exports = { connectToWhatsApp, sendMessage, getConnectionState };
