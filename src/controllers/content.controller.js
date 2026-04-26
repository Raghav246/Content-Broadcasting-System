const ContentService = require('../services/content.service');
const { validateUpload, validateReject } = require('../utils/validate');

const uploadContent = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'File is required' });
  const error = validateUpload(req.body);
  if (error) return res.status(400).json({ message: error });
  try {
    const content = await ContentService.upload({ file: req.file, body: req.body, userId: req.user.id });
    res.status(201).json({ message: 'Content uploaded successfully', content });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getMyContent = async (req, res) => {
  try {
    const result = await ContentService.getMyContent(req.user.id);
    res.json({ content: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Supports: ?status=pending&subject=maths&teacher_id=1&page=1&limit=20
const getAllContent = async (req, res) => {
  try {
    const result = await ContentService.getAllContent(req.query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const approveContent = async (req, res) => {
  try {
    const result = await ContentService.approve(req.params.id, req.user.id);
    if (!result.rows.length) return res.status(404).json({ message: 'Content not found or already processed' });
    res.json({ message: 'Content approved', content: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const rejectContent = async (req, res) => {
  const error = validateReject(req.body);
  if (error) return res.status(400).json({ message: error });
  try {
    const result = await ContentService.reject(req.params.id, req.user.id, req.body.rejection_reason);
    if (!result.rows.length) return res.status(404).json({ message: 'Content not found or already processed' });
    res.json({ message: 'Content rejected', content: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { uploadContent, getMyContent, getAllContent, approveContent, rejectContent };
