const express = require('express');
const cors = require('cors');
const quizRoutes = require('./routes/quiz');
const authRoutes = require('./routes/auth');
const rewardsRoutes = require('./routes/rewards');

const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Add logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.use('/api/quiz', quizRoutes);
app.use('/api', authRoutes);
app.use('/api/rewards', rewardsRoutes);

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log('📊 Available routes:');
  console.log('  - GET /api/test');
  console.log('  - GET /api/rewards/test');
  console.log('  - GET /api/rewards/progress-percentages');
  console.log('  - POST /api/signup');
  console.log('  - POST /api/login');
});
