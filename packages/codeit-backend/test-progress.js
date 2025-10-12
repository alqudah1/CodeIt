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

app.use('/api/quiz', quizRoutes);
app.use('/api', authRoutes);
app.use('/api/rewards', rewardsRoutes);

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log('📊 Progress API endpoint: http://localhost:8080/api/rewards/progress-percentages');
  console.log('🔑 Make sure to include Authorization header with Bearer token');
});
