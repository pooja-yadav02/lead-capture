require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const leadsRouter = require('./routes/leads');
const adminAuth = require('./middleware/adminAuth');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lead-capture';

// --- Security & parsing middleware ---
app.use(
  helmet({
    contentSecurityPolicy: false // keep simple for a small static frontend; tighten if needed
  })
);
app.use(express.json({ limit: '20kb' }));

// Rate limit the public submission endpoint to deter spam/abuse
const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many submissions. Please try again later.' }
});
app.use('/api/leads', (req, res, next) => {
  if (req.method === 'POST') return submitLimiter(req, res, next);
  next();
});

// --- Static files ---
app.use(express.static(path.join(__dirname, 'public')));

// --- Admin page + admin API protection ---
app.get('/admin', adminAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.use('/api/leads', (req, res, next) => {
  // Only GET (list) and PATCH (status update) are admin actions.
  // POST (new submission) stays public — that's the whole point of the form.
  if (req.method === 'GET' || req.method === 'PATCH') {
    return adminAuth(req, res, next);
  }
  next();
});

app.use('/api/leads', leadsRouter);

app.get('/health', (req, res) => res.json({ ok: true }));

// --- DB connection then start server ---
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
