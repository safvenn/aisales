const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const Conversation = require('../models/Conversation');

router.get('/', async (req, res) => {
  try {
    const statuses = ['pending', 'contacted', 'interested', 'hot', 'dead', 'converted'];
    const counts = Object.fromEntries(statuses.map((s) => [s, 0]));

    const grouped = await Lead.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    grouped.forEach(({ _id, count }) => {
      counts[_id] = count;
    });

    const total = await Lead.countDocuments();
    const messages = await Conversation.countDocuments();

    res.json({
      leads: { ...counts, total },
      messages,
    });
  } catch (err) {
    console.error('[stats] Failed to load stats:', err);
    res.status(500).json({ error: err.message || 'Failed to load stats' });
  }
});

module.exports = router;
