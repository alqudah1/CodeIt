const express = require('express');
const pool = require('../db');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

// Middleware to verify JWT and set req.user
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

router.use(authenticateToken);

// Helper: map correct_option letter to text value
function correctText(row) {
  const map = {
    A: row.option_a,
    B: row.option_b,
    C: row.option_c,
    D: row.option_d,
  };
  return map[(row.correct_option || '').toUpperCase()] || null;
}

// GET /:quizId/questions — does NOT expose correct answer to client
router.get('/:quizId/questions', async (req, res) => {
  const { quizId } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT question_id, question_text, option_a, option_b, option_c, option_d FROM Quiz_Questions WHERE quiz_id = ? LIMIT 10',
      [quizId]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'No questions found for this quiz' });
    }

    const questions = rows.map((row) => ({
      id: row.question_id,
      question: row.question_text,
      options: [row.option_a, row.option_b, row.option_c, row.option_d].filter(Boolean),
    }));

    res.json(questions);
  } catch (err) {
    console.error('❌ Error fetching questions:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /check — validate a single answer; returns correct + correctAnswerText
// Called after the user picks an option, so the answer is only revealed post-selection.
router.post('/check', async (req, res) => {
  const { questionId, answer } = req.body;
  if (!questionId || answer === undefined) {
    return res.status(400).json({ error: 'Missing questionId or answer' });
  }
  try {
    const [rows] = await pool.query(
      'SELECT option_a, option_b, option_c, option_d, correct_option FROM Quiz_Questions WHERE question_id = ?',
      [questionId]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Question not found' });
    }
    const row = rows[0];
    const ct = correctText(row);
    res.json({ correct: answer === ct, correctAnswerText: ct });
  } catch (err) {
    console.error('❌ Error checking answer:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /submit — batch submit; validate all answers server-side
router.post('/submit', async (req, res) => {
  console.log('📩 POST /api/quiz/submit');
  const studentId = req.user.user_id;
  const { quizId, answers } = req.body;

  if (!quizId || !answers || typeof answers !== 'object') {
    return res.status(400).json({ error: 'Missing required fields: quizId, answers' });
  }

  try {
    // Check if user is a student
    const [studentCheck] = await pool.query(
      'SELECT user_id FROM Students WHERE user_id = ?',
      [studentId]
    );
    const isStudent = studentCheck.length > 0;

    // Fetch all questions + correct_option for this quiz
    const [questionRows] = await pool.query(
      'SELECT question_id, option_a, option_b, option_c, option_d, correct_option FROM Quiz_Questions WHERE quiz_id = ? LIMIT 10',
      [quizId]
    );

    if (questionRows.length === 0) {
      return res.status(404).json({ error: 'No questions found for this quiz' });
    }

    let totalXp = 0;
    let correctCount = 0;

    for (const row of questionRows) {
      const qId = String(row.question_id);
      const submitted = answers[qId];
      const ct = correctText(row);
      const isCorrect = submitted !== undefined && ct !== null && submitted === ct;
      if (isCorrect) {
        correctCount++;
        totalXp += 10;
      }
    }

    if (isStudent) {
      // Record the attempt
      await pool.query(
        'INSERT INTO Student_Quiz_Attempt (student_id, quiz_id, correct_count, total_questions, xp_earned) VALUES (?, ?, ?, ?, ?)',
        [studentId, quizId, correctCount, questionRows.length, totalXp]
      );
      // Award XP
      await pool.query(
        'UPDATE Students SET total_xp = total_xp + ? WHERE user_id = ?',
        [totalXp, studentId]
      );
      console.log(`✅ Student ${studentId}: +${totalXp} XP for quiz ${quizId} (${correctCount}/${questionRows.length})`);
    }

    const totalQuestions = questionRows.length;
    const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    res.json({
      message: 'Quiz submitted!',
      correctCount,
      totalQuestions,
      percentage,
      xpEarned: totalXp,
    });
  } catch (err) {
    console.error('❌ Error submitting quiz:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
