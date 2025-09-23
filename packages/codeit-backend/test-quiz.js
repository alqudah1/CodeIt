const express = require('express');
const cors = require('cors');
const quizRoutes = require('./routes/quiz');
const authRoutes = require('./routes/auth');

const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

app.use('/api/quiz', quizRoutes);
app.use('/api', authRoutes);

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});