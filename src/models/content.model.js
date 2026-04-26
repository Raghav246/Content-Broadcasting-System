const pool = require('../utils/db');

const create = (fields) => {
  const { title, description, subject, file_url, file_type, file_size, uploaded_by, start_time, end_time } = fields;
  return pool.query(
    `INSERT INTO content (title, description, subject, file_url, file_type, file_size, uploaded_by, status, start_time, end_time)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'pending',$8,$9) RETURNING *`,
    [title, description || null, subject, file_url, file_type, file_size, uploaded_by, start_time || null, end_time || null]
  );
};

const findByTeacher = (uploaded_by) =>
  pool.query('SELECT * FROM content WHERE uploaded_by = $1 ORDER BY created_at DESC', [uploaded_by]);

// Supports filters: status, subject, teacher_id + pagination
const findAll = (filters = {}) => {
  let query = 'SELECT c.*, u.name AS teacher_name FROM content c JOIN users u ON c.uploaded_by = u.id WHERE 1=1';
  const params = [];

  if (filters.status)    { params.push(filters.status);     query += ` AND c.status = $${params.length}`; }
  if (filters.subject)   { params.push(filters.subject);    query += ` AND c.subject = $${params.length}`; }
  if (filters.teacher_id){ params.push(filters.teacher_id); query += ` AND c.uploaded_by = $${params.length}`; }

  query += ' ORDER BY c.created_at DESC';

  const limit  = parseInt(filters.limit)  || 20;
  const offset = parseInt(filters.offset) || 0;
  params.push(limit);  query += ` LIMIT $${params.length}`;
  params.push(offset); query += ` OFFSET $${params.length}`;

  return pool.query(query, params);
};

const countAll = (filters = {}) => {
  let query = 'SELECT COUNT(*) FROM content c WHERE 1=1';
  const params = [];
  if (filters.status)    { params.push(filters.status);     query += ` AND c.status = $${params.length}`; }
  if (filters.subject)   { params.push(filters.subject);    query += ` AND c.subject = $${params.length}`; }
  if (filters.teacher_id){ params.push(filters.teacher_id); query += ` AND c.uploaded_by = $${params.length}`; }
  return pool.query(query, params);
};

const updateStatus = (id, status, userId, extra = {}) => {
  if (status === 'approved') {
    return pool.query(
      `UPDATE content SET status='approved', approved_by=$1, approved_at=NOW(), rejection_reason=NULL
       WHERE id=$2 AND status='pending' RETURNING *`,
      [userId, id]
    );
  }
  return pool.query(
    `UPDATE content SET status='rejected', rejection_reason=$1, approved_by=$2, approved_at=NOW()
     WHERE id=$3 AND status='pending' RETURNING *`,
    [extra.rejection_reason, userId, id]
  );
};

const findLive = (teacherId, now, subject) => {
  let query = `
    SELECT c.*, cs.rotation_order, cs.duration, cs.slot_id
    FROM content c
    LEFT JOIN content_schedule cs ON cs.content_id = c.id
    WHERE c.uploaded_by = $1
      AND c.status = 'approved'
      AND c.start_time IS NOT NULL
      AND c.end_time IS NOT NULL
      AND c.start_time <= $2
      AND c.end_time >= $2
  `;
  const params = [teacherId, now];
  if (subject) {
    params.push(subject);
    query += ` AND c.subject = $${params.length}`;
  }
  query += ' ORDER BY c.subject, cs.rotation_order ASC NULLS LAST';
  return pool.query(query, params);
};

const getOrCreateSlot = async (subject) => {
  // Use INSERT ... ON CONFLICT to avoid race conditions
  await pool.query(
    'INSERT INTO content_slots (subject) VALUES ($1) ON CONFLICT (subject) DO NOTHING',
    [subject]
  );
  const slot = await pool.query('SELECT id FROM content_slots WHERE subject = $1', [subject]);
  return slot.rows[0].id;
};

const createSchedule = async (content_id, slotId, duration) => {
  const orderResult = await pool.query(
    'SELECT COALESCE(MAX(rotation_order), 0) + 1 AS next_order FROM content_schedule WHERE slot_id = $1',
    [slotId]
  );
  const nextOrder = orderResult.rows[0].next_order;
  return pool.query(
    'INSERT INTO content_schedule (content_id, slot_id, rotation_order, duration) VALUES ($1,$2,$3,$4)',
    [content_id, slotId, nextOrder, duration]
  );
};

// Analytics queries
const logAccess = (content_id, teacher_id, subject) =>
  pool.query(
    'INSERT INTO content_access_log (content_id, teacher_id, subject) VALUES ($1,$2,$3)',
    [content_id, teacher_id, subject]
  );

const getSubjectAnalytics = () =>
  pool.query(`
    SELECT
      subject,
      COUNT(*) AS total_hits,
      COUNT(DISTINCT content_id) AS unique_content_served,
      MAX(accessed_at) AS last_accessed
    FROM content_access_log
    GROUP BY subject
    ORDER BY total_hits DESC
  `);

const getContentAnalytics = () =>
  pool.query(`
    SELECT
      cal.content_id,
      c.title,
      c.subject,
      u.name AS teacher_name,
      COUNT(*) AS hit_count,
      MAX(cal.accessed_at) AS last_accessed
    FROM content_access_log cal
    JOIN content c ON c.id = cal.content_id
    JOIN users u ON u.id = cal.teacher_id
    GROUP BY cal.content_id, c.title, c.subject, u.name
    ORDER BY hit_count DESC
    LIMIT 50
  `);

module.exports = {
  create, findByTeacher, findAll, countAll, updateStatus,
  findLive, getOrCreateSlot, createSchedule,
  logAccess, getSubjectAnalytics, getContentAnalytics,
};
