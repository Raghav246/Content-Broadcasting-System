const AnalyticsService = require('../services/analytics.service');

const getSubjectAnalytics = async (req, res) => {
  try {
    const data = await AnalyticsService.getSubjectAnalytics();
    res.json({ analytics: data });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getContentAnalytics = async (req, res) => {
  try {
    const data = await AnalyticsService.getContentAnalytics();
    res.json({ analytics: data });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getSubjectAnalytics, getContentAnalytics };
