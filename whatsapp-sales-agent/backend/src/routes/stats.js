const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'pending')    AS pending,
        COUNT(*) FILTER (WHERE status = 'contacted')  AS contacted,
        COUNT(*) FILTER (WHERE status = 'interested') AS interested,
        COUNT(*) FILTER (WHERE status = 'hot')        AS hot,
        COUNT(*) FILTER (WHERE status = 'dead')       AS dead,
        COUNT(*) FILTER (WHERE status = 'converted')  AS converted,
        COUNT(*)                                       AS total
      FROM leads
    `);
    const convs = await pool.query(`SELECT COUNT(*) AS total_messages FROM conversations`);
    res.json({
      leads: result.rows[0],
      messages: convs.rows[0].total_messages,
    });
  } catch (err) {
    console.error('[stats] Failed to load stats:', err);
    res.status(500).json({ error: err.message || 'Failed to load stats' });
  }
});

module.exports = router;
