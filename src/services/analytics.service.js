const ContentModel = require('../models/content.model');

const getSubjectAnalytics = async () => {
  const result = await ContentModel.getSubjectAnalytics();
  return result.rows;
};

const getContentAnalytics = async () => {
  const result = await ContentModel.getContentAnalytics();
  return result.rows;
};

module.exports = { getSubjectAnalytics, getContentAnalytics };
