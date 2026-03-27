// backend/src/index.js
require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const { connectToWhatsApp } = require('./services/whatsapp'); // CHANGED

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/leads', require('./routes/leads'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/campaigns', require('./routes/campaigns'));

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend API running on port ${PORT}`);
  console.log(`📡 V3.1 ACTIVE: ULTIMATE PHONE REPAIR & DB-SYNC`);
  // Initialize Baileys WhatsApp Connection
  connectToWhatsApp().catch(err => console.error("❌ Failed to start WhatsApp:", err));
});
