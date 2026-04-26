require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/', (req, res) => res.json({ message: 'Content Broadcasting System App is running'}));

// Routes
app.use('/auth',      require('./routes/auth.routes'));
app.use('/content',   require('./routes/content.routes'));
app.use('/content',   require('./routes/broadcast.routes'));
app.use('/analytics', require('./routes/analytics.routes'));

// 404 handler
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// Global error handler
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: `File too large. Max size is ${process.env.MAX_FILE_SIZE_MB || 10}MB` });
  }
  if (err.message) return res.status(400).json({ message: err.message });
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
