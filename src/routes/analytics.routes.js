const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { getSubjectAnalytics, getContentAnalytics } = require('../controllers/analytics.controller');

// Principal only — analytics dashboard
router.get('/subjects', authenticate, authorize('principal'), getSubjectAnalytics);
router.get('/content',  authenticate, authorize('principal'), getContentAnalytics);

module.exports = router;
