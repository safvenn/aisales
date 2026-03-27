const express = require('express');
const router = express.Router();
const { startCampaign, stopCampaign, getCampaignStatus } = require('../services/automation');

// GET /api/campaigns/status
router.get('/status', (req, res) => {
    res.json(getCampaignStatus());
});

// POST /api/campaigns/start
router.post('/start', async (req, res) => {
    const { targetAudience } = req.body;
    if (!targetAudience) {
        return res.status(400).json({ error: "Missing targetAudience" });
    }

    const result = await startCampaign(targetAudience);
    res.json(result);
});

// POST /api/campaigns/stop
router.post('/stop', (req, res) => {
    const result = stopCampaign();
    res.json(result);
});

module.exports = router;
