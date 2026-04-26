const Redis = require('ioredis');

let client = null;

const getClient = () => {
  if (!process.env.REDIS_URL) return null;
  if (!client) {
    client = new Redis(process.env.REDIS_URL, { lazyConnect: true, enableOfflineQueue: false });
    client.on('error', () => { client = null; }); // silently disable if Redis unavailable
  }
  return client;
};

const get = async (key) => {
  try {
    const c = getClient();
    if (!c) return null;
    const val = await c.get(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
};

const set = async (key, value, ttlSeconds = 30) => {
  try {
    const c = getClient();
    if (!c) return;
    await c.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    // Redis unavailable — continue without cache
  }
};

const del = async (key) => {
  try {
    const c = getClient();
    if (!c) return;
    await c.del(key);
  } catch {}
};

module.exports = { get, set, del };
