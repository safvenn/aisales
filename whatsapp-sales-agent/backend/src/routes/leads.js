const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const Conversation = require('../models/Conversation');

// GET all leads with pagination
router.get('/', async (req, res) => {
  try {
    const { status, city, limit = 50, offset = 0 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (city) where.city = new RegExp(city, 'i');

    const leads = await Lead.find(where)
      .sort({ created_at: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .lean({ virtuals: true });

    const count = await Lead.countDocuments(where);
    res.json({ leads, count });
  } catch (err) {
    console.error('[leads] Failed to load leads:', err);
    res.status(500).json({ error: err.message || 'Failed to load leads' });
  }
});

// GET single lead with conversation history
router.get('/:id/conversations', async (req, res) => {
  try {
    const { id } = req.params;
    const convs = await Conversation.find({ lead_id: id })
      .sort({ created_at: 1 })
      .lean({ virtuals: true });
    res.json(convs);
  } catch (err) {
    console.error('[leads] Failed to load conversations:', err);
    res.status(500).json({ error: err.message || 'Failed to load conversations' });
  }
});

// PATCH lead status (manual admin override)
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['pending', 'contacted', 'interested', 'hot', 'dead', 'converted'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    await Lead.findByIdAndUpdate(id, { status });
    res.json({ success: true, id, status });
  } catch (err) {
    console.error('[leads] Failed to update lead status:', err);
    res.status(500).json({ error: err.message || 'Failed to update lead status' });
  }
});

// POST create a lead manually
router.post('/', async (req, res) => {
  try {
    const { name, phone, business_type, city } = req.body;
    const lead = await Lead.create({ name, phone, business_type, city });
    res.status(201).json(lead.toJSON());
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Phone already exists' });
    if (err.code === 11000) return res.status(409).json({ error: 'Phone already exists' });
    console.error('[leads] Failed to create lead:', err);
    res.status(500).json({ error: err.message || 'Failed to create lead' });
  }
});

module.exports = router;
