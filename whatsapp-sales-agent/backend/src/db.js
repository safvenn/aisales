const { Pool } = require('pg');

const databaseUrl = process.env.DATABASE_URL;
const isLocalDatabase =
  databaseUrl &&
  /localhost|127\.0\.0\.1/i.test(databaseUrl);

const useSsl =
  process.env.PGSSLMODE === 'require' ||
  process.env.PG_SSL === 'true' ||
  (!!databaseUrl && !isLocalDatabase);

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});

pool.on('connect', () => console.log('[db] Connected to PostgreSQL'));
pool.on('error', (err) => console.error('[db] Pool error:', err));

module.exports = pool;
