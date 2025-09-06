const express = require('express');
const cors = require('cors');
const quizRoutes = require('./routes/quiz');

const app = express();

// Enable CORS for requests from http://localhost:3000
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow these HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow these headers
}));

// Parse JSON bodies
app.use(express.json());

// Mount the quiz routes
app.use('/api/quiz', quizRoutes);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});