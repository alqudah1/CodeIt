const express = require('express');
const cors = require('cors');
const quizRoutes = require('./routes/quiz');
const authRoutes = require('./routes/auth');
// const rewardsRoutes = require('./routes/rewards');

const app = express();
app.get('/health', (req, res) => {
  res.json({ ok: true });
});
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'], // Allow both main app and puzzle app
  methods: ['GET', 'POST', 'PUT', 'DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
}));

app.use(express.json());

app.use('/api/quiz', quizRoutes);
app.use('/api', authRoutes);
// app.use('/api/rewards', rewardsRoutes); // enable when rewards routes are added

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
