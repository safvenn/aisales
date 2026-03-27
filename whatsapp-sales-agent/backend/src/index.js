// backend/src/index.js
require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const { connectToWhatsApp } = require('./services/whatsapp');

const app = express();

app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.use('/api/leads', require('./routes/leads'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/campaigns', require('./routes/campaigns'));

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`[startup] Backend API listening on port ${PORT}`);
  console.log('[startup] Health check available at /health');
  console.log('[startup] Initializing WhatsApp connection');
  connectToWhatsApp().catch((err) => console.error('[startup] Failed to start WhatsApp:', err));
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[startup] Port ${PORT} is already in use. Stop the existing process or set a different PORT.`);
    return;
  }

  console.error('[startup] Server failed to start:', err);
});
