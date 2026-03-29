const express = require('express');
const router = express.Router();
const { getConnectionState } = require('../services/whatsapp');

router.get('/status', (req, res) => {
  res.json({ status: getConnectionState() });
});

module.exports = router;
