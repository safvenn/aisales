const mongoose = require('mongoose');

const databaseUrl = process.env.MONGODB_URI;

// Allow using local Mongo without TLS, default to TLS on cloud clusters
const useSsl =
  process.env.MONGODB_SSL === 'true' ||
  (!/localhost|127\\.0\\.0\\.1/i.test(databaseUrl || ''));

async function connectDb() {
  if (!databaseUrl) {
    console.error('[db] MONGODB_URI missing; cannot connect');
    throw new Error('MONGODB_URI is required');
  }

  await mongoose.connect(databaseUrl, {
    ssl: useSsl,
    sslValidate: false, // Render/Atlas friendly; tighten if custom CA is provided
  });

  console.log('[db] Connected to MongoDB');
}

mongoose.connection.on('error', (err) => {
  console.error('[db] Connection error:', err);
});

module.exports = { connectDb, mongoose };
