const ContentModel = require('../models/content.model');

const upload = async ({ file, body, userId }) => {
  const { title, subject, description, start_time, end_time, rotation_duration } = body;

  // Determine file_url: S3 gives location, local gives filename
  const file_url = file.location || `/uploads/${file.filename}`;

  const content = await ContentModel.create({
    title,
    description,
    subject: subject.toLowerCase(),
    file_url,
    file_type: file.mimetype,
    file_size: file.size,
    uploaded_by: userId,
    start_time,
    end_time,
  });

  const saved = content.rows[0];

  if (start_time && end_time && rotation_duration) {
    const slotId = await ContentModel.getOrCreateSlot(subject.toLowerCase());
    await ContentModel.createSchedule(saved.id, slotId, parseInt(rotation_duration) || 5);
  }

  return saved;
};

const getMyContent = (userId) => ContentModel.findByTeacher(userId);

// Supports: status, subject, teacher_id, page, limit
const getAllContent = async ({ status, subject, teacher_id, page, limit }) => {
  const parsedLimit  = Math.min(parseInt(limit) || 20, 100);
  const parsedPage   = Math.max(parseInt(page) || 1, 1);
  const offset       = (parsedPage - 1) * parsedLimit;

  const filters = {
    status:     status     || null,
    subject:    subject    ? subject.toLowerCase() : null,
    teacher_id: teacher_id || null,
    limit:      parsedLimit,
    offset,
  };

  const [rows, count] = await Promise.all([
    ContentModel.findAll(filters),
    ContentModel.countAll(filters),
  ]);

  return {
    content: rows.rows,
    pagination: {
      total:       parseInt(count.rows[0].count),
      page:        parsedPage,
      limit:       parsedLimit,
      total_pages: Math.ceil(parseInt(count.rows[0].count) / parsedLimit),
    },
  };
};

const approve = (id, userId) => ContentModel.updateStatus(id, 'approved', userId);

const reject = (id, userId, rejection_reason) =>
  ContentModel.updateStatus(id, 'rejected', userId, { rejection_reason });

module.exports = { upload, getMyContent, getAllContent, approve, reject };
