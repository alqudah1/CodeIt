const express = require('express');
const pool = require('../db'); 
const router = express.Router();
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'yaan*23AUG';

// Middleware to verify JWT and set req.user
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 

  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user; 
    console.log('Decoded User from Token:', req.user); 
    next();
  });
};


router.use(authenticateToken);

// Get quiz questions for a quiz
router.get('/:quizId/questions', async (req, res) => {
  const { quizId } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT question_id, question_text, option_a, option_b, option_c, option_d, correct_answer FROM Quiz_Questions WHERE quiz_id = ?',
      [quizId]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'No questions found for this quiz' });
    }

    res.json(rows);
  } catch (err) {
    console.error('❌ Error fetching questions:', err);
    res.status(500).json({ error: err.message });
  }
});

// Submit an MCQ answer
router.post('/submit', async (req, res) => {
  console.log('📩 Received POST request to /api/quiz/submit');
  console.log('Request Body:', req.body);
  console.log('Authenticated User:', req.user); 

  
  const studentId = req.body.studentId || req.user.user_id; // Use user_id from token
  const { questionId, answer } = req.body;

  console.log('🔍 Debug Info:');
  console.log('  - studentId from body:', req.body.studentId);
  console.log('  - studentId from token:', req.user.user_id);
  console.log('  - final studentId:', studentId);
  console.log('  - studentId type:', typeof studentId);

  if (!studentId || !questionId || !answer) {
    return res.status(400).json({ error: 'Missing required fields: studentId, questionId, answer' });
  }

  try {
    // Check if student exists
    console.log('🔍 Checking if student exists for user_id:', studentId);
    const [studentCheck] = await pool.query(
      'SELECT user_id FROM Students WHERE user_id = ?',
      [studentId]
    );

    console.log('🔍 Student check result:', studentCheck);
    console.log('🔍 Student check length:', studentCheck.length);

    //Fetching the question details first
    const [questionRows] = await pool.query(
      'SELECT quiz_id, correct_answer FROM Quiz_Questions WHERE question_id = ?',
      [questionId]
    );

    if (questionRows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const { quiz_id, correct_answer } = questionRows[0];

    if (studentCheck.length === 0) {
      console.log('ℹ️ User is not a student - will skip attempt logging and XP updates');
      // Return early for non-students - don't proceed with database operations
      return res.json({
        isCorrect: answer === correct_answer,
        feedback: answer === correct_answer ? 'Correct!' : 'Try again',
        xpEarned: 0,
        quizCompleted: true
      });
    } else {
      console.log('✅ Student record found - proceeding with full tracking');
    }

    //Check if the answer is correct
    const isCorrect = answer === correct_answer;
    const xp = isCorrect ? 10 : 0;

    // Log quiz attempt and update XP (we know user is a student at this point)
    console.log('✅ User is a student - proceeding with attempt logging');
    try {
      //Log the quiz attempt
      await pool.query(
        'INSERT INTO Student_Quiz_Attempt (student_id, quiz_id, score, attempt_date) VALUES (?, ?, ?, NOW())',
        [studentId, quiz_id, xp]
      );
      console.log('✅ Quiz attempt logged for student');

      //Update student's XP
      await pool.query(
        'UPDATE Students SET total_xp = total_xp + ? WHERE user_id = ?',
        [xp, studentId]
      );
      console.log('✅ Student XP updated');
    } catch (dbError) {
      console.error('❌ Database error during student operations:', dbError);
      throw dbError;
    }

    //Check if the quiz is completed
    const [[{ count: totalQuestions }]] = await pool.query(
      'SELECT COUNT(*) AS count FROM Quiz_Questions WHERE quiz_id = ?',
      [quiz_id]
    );

    const [[{ count: answeredQuestions }]] = await pool.query(
      'SELECT COUNT(*) AS count FROM Student_Quiz_Attempt WHERE student_id = ? AND quiz_id = ?',
      [studentId, quiz_id]
    );

    const completed = totalQuestions === answeredQuestions;

    res.json({
      isCorrect,
      feedback: isCorrect ? 'Correct!' : 'Try again',
      xpEarned: xp,
      quizCompleted: completed
    });
  } catch (err) {
    console.error('❌ Error submitting answer:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;