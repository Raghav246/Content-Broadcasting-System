const express = require('express');
const router = express.Router();
const { getLiveContent } = require('../controllers/broadcast.controller');
const { broadcastLimiter } = require('../middlewares/rateLimit.middleware');

// Public endpoint — rate limited, no auth required
router.get('/live/:teacherId', broadcastLimiter, getLiveContent);

module.exports = router;
