const rateLimit = require('express-rate-limit');

// Rate limit for public broadcast endpoint — 60 requests per minute per IP
const broadcastLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

module.exports = { broadcastLimiter };
