// Load .env
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && v.length) process.env[k.trim()] = v.join('=').trim();
  });
}

const express = require('express');
const cors = require('cors');
const quizRoutes = require('./routes/quiz');
const authRoutes = require('./routes/auth');
const rewardsRoutes = require('./routes/rewards');
const lessonsRoutes = require('./routes/lessons');
const puzzlesRoutes = require('./routes/puzzles');
const journeyRoutes = require('./routes/journey');
const builderRoutes = require('./routes/builder');
const exploreRoutes = require('./routes/explore');
const analyticsRoutes = require('./routes/analytics');

const app = express();
app.set('trust proxy', 1);
app.get('/health', (req, res) => {
  res.json({ ok: true });
});
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});
app.use(cors({
  origin: true, // Reflect request origin — allows deployed server IP and localhost
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());

app.use('/api/quiz', quizRoutes);
app.use('/api', authRoutes);
app.use('/api/rewards', rewardsRoutes);
app.use('/api/lessons', lessonsRoutes);
app.use('/api/puzzles', puzzlesRoutes);
app.use('/api/journey', journeyRoutes);
app.use('/api/builder', builderRoutes);
app.use('/api/explore', exploreRoutes);
app.use('/api/analytics', analyticsRoutes);

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
