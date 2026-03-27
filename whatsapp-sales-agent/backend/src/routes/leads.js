const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all leads with pagination
router.get('/', async (req, res) => {
  try {
    const { status, city, limit = 50, offset = 0 } = req.query;
    let query = 'SELECT * FROM leads WHERE 1=1';
    const params = [];

    if (status) { params.push(status); query += ` AND status = $${params.length}`; }
    if (city)   { params.push(city);   query += ` AND city ILIKE $${params.length}`; }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);
    res.json({ leads: result.rows, count: result.rowCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single lead with conversation history
router.get('/:id/conversations', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM conversations WHERE lead_id = $1 ORDER BY created_at ASC',
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH lead status (manual admin override)
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['pending', 'contacted', 'interested', 'hot', 'dead', 'converted'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    await pool.query('UPDATE leads SET status = $1 WHERE id = $2', [status, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create a lead manually
router.post('/', async (req, res) => {
  try {
    const { name, phone, business_type, city } = req.body;
    const result = await pool.query(
      `INSERT INTO leads (name, phone, business_type, city) VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, phone, business_type, city]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Phone already exists' });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
