const ContentModel = require('../models/content.model');
const UserModel = require('../models/user.model');
const cache = require('../utils/cache');

const CACHE_TTL = parseInt(process.env.REDIS_CACHE_TTL) || 30;

const getLive = async (teacherId, subject) => {
  const teacher = await UserModel.findTeacherById(teacherId);
  if (!teacher.rows.length) return null;

  // Redis cache key — per teacher + optional subject filter
  const cacheKey = `live:${teacherId}:${subject || 'all'}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const now = new Date();
  const result = await ContentModel.findLive(teacherId, now, subject ? subject.toLowerCase() : null);
  if (!result.rows.length) return null;

  // Group by subject
  const bySubject = {};
  for (const row of result.rows) {
    if (!bySubject[row.subject]) bySubject[row.subject] = [];
    bySubject[row.subject].push(row);
  }

  const activeContent = [];

  for (const items of Object.values(bySubject)) {
    const scheduled = items
      .filter(i => i.rotation_order !== null)
      .sort((a, b) => a.rotation_order - b.rotation_order);

    if (scheduled.length === 0) {
      activeContent.push(format(items[0]));
      continue;
    }

    const totalMs = scheduled.reduce((sum, i) => sum + i.duration * 60 * 1000, 0);
    const anchor = scheduled.reduce(
      (min, i) => (new Date(i.start_time) < min ? new Date(i.start_time) : min),
      new Date(scheduled[0].start_time)
    );

    const elapsed = (now - anchor) % totalMs;
    let cursor = 0;
    let active = scheduled[0];
    for (const item of scheduled) {
      const slotMs = item.duration * 60 * 1000;
      if (elapsed >= cursor && elapsed < cursor + slotMs) {
        active = item;
        break;
      }
      cursor += slotMs;
    }
    activeContent.push(format(active));
  }

  if (!activeContent.length) return null;

  // Cache result
  await cache.set(cacheKey, activeContent, CACHE_TTL);

  // Log access for analytics (fire-and-forget)
  for (const item of activeContent) {
    ContentModel.logAccess(item.id, teacherId, item.subject).catch(() => {});
  }

  return activeContent;
};

const format = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  subject: row.subject,
  file_url: row.file_url,
  file_type: row.file_type,
  start_time: row.start_time,
  end_time: row.end_time,
  rotation_order: row.rotation_order,
  duration: row.duration,
});

module.exports = { getLive };
