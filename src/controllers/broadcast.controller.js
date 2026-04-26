const BroadcastService = require('../services/broadcast.service');

const getLiveContent = async (req, res) => {
  try {
    const activeContent = await BroadcastService.getLive(req.params.teacherId, req.query.subject);
    if (!activeContent) return res.json({ message: 'No content available' });
    res.json({ active_content: activeContent });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getLiveContent };
