const express = require('express');
const cors = require('cors');
const quizRoutes = require('./routes/quiz');
const authRoutes = require('./routes/auth');
const rewardsRoutes = require('./routes/rewards');
const lessonsRoutes = require('./routes/lessons');
const puzzlesRoutes = require('./routes/puzzles');

const app = express();
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

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
