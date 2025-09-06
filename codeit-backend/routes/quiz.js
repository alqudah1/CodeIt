const express = require('express');
const { sql, poolPromise } = require('../db');
const router = express.Router();

// Get quiz questions for a quiz (MCQs only)
router.get('/:quizId/questions', async (req, res) => {
  const { quizId } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('quizId', sql.Int, quizId)
      .query('SELECT question_id, question_text, option_a, option_b, option_c, option_d, correct_answer FROM Quiz_Questions WHERE quiz_id = @quizId');
    
    console.log('Quiz ID:', quizId);
    console.log('Result Recordset:', result.recordset);

    if (!result.recordset || result.recordset.length === 0) {
      return res.status(404).json({ error: 'No questions found for this quiz' });
    }

    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching questions:', err);
    res.status(500).json({ error: err.message });
  }
});

// Submit an MCQ answer
router.post('/submit', async (req, res) => {
  console.log('Received POST request to /api/quiz/submit'); // Add this for debugging
  console.log('Request Body:', req.body);

  const { studentId, questionId, answer } = req.body;

  // Validate input
  if (!studentId || !questionId || !answer) {
    return res.status(400).json({ error: 'Missing required fields: studentId, questionId, answer' });
  }

  try {
    const pool = await poolPromise;

    // Fetch the question details
    const question = await pool.request()
      .input('questionId', sql.Int, questionId)
      .query('SELECT quiz_id, correct_answer FROM Quiz_Questions WHERE question_id = @questionId');

    if (!question.recordset[0]) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const { quiz_id, correct_answer } = question.recordset[0];

    // Check if the answer is correct
    const isCorrect = answer === correct_answer;
    const xp = isCorrect ? 10 : 0;

    // Log the quiz attempt
    await pool.request()
      .input('studentId', sql.Int, studentId)
      .input('quizId', sql.Int, quiz_id)
      .input('score', sql.Int, xp)
      .query('INSERT INTO Student_Quiz_Attempt(student_id, quiz_id, score, attempt_date) VALUES (@studentId, @quizId, @score, GETDATE())');

    // Update student's XP
    await pool.request()
      .input('studentId', sql.Int, studentId)
      .input('xp', sql.Int, xp)
      .query('UPDATE Students SET total_xp = total_xp + @xp WHERE user_id = @studentId');

    // Check for rewards based on total XP (commented out for now)
    /*
    const student = await pool.request()
      .input('studentId', sql.Int, studentId)
      .query('SELECT total_xp FROM Students WHERE user_id = @studentId');

    const totalXP = student.recordset[0].total_xp;
    const rewards = await pool.request()
      .input('xp', sql.Int, totalXP)
      .query('SELECT reward_id FROM Rewards WHERE xp_required <= @xp AND reward_id NOT IN (SELECT reward_id FROM Student_Rewards WHERE student_id = @studentId)');

    if (rewards.recordset.length > 0) {
      for (const reward of rewards.recordset) {
        await pool.request()
          .input('rewardId', sql.Int, reward.reward_id)
          .input('studentId', sql.Int, studentId)
          .query('INSERT INTO Student_Rewards (reward_id, student_id, date_earned) VALUES (@rewardId, @studentId, GETDATE())');
      }
    }
    */

    // Check if the quiz is completed (all questions answered)
    const totalQuestions = await pool.request()
      .input('quizId', sql.Int, quiz_id)
      .query('SELECT COUNT(*) AS count FROM Quiz_Questions WHERE quiz_id = @quizId');

    const answeredQuestions = await pool.request()
      .input('studentId', sql.Int, studentId)
      .input('quizId', sql.Int, quiz_id)
      .query('SELECT COUNT(DISTINCT question_id) AS count FROM Student_Quiz_Attempt sqa JOIN Quiz_Questions qq ON sqa.quiz_id = qq.quiz_id WHERE sqa.student_id = @studentId AND sqa.quiz_id = @quizId');

    const total = totalQuestions.recordset[0].count;
    const answered = answeredQuestions.recordset[0].count;

    /*
    if (total === answered) {
      // Quiz is completed, notify the parent
      const studentData = await pool.request()
        .input('studentId', sql.Int, studentId)
        .query('SELECT parent_id FROM Students WHERE user_id = @studentId');

      const quizData = await pool.request()
        .input('quizId', sql.Int, quiz_id)
        .query('SELECT title FROM Quizzes WHERE quiz_id = @quizId');

      const parentId = studentData.recordset[0].parent_id;
      const quizTitle = quizData.recordset[0].title;

      await pool.request()
        .input('parentId', sql.Int, parentId)
        .input('studentId', sql.Int, studentId)
        .input('message', sql.Text, `Your child completed the quiz: ${quizTitle}!`)
        .query('INSERT INTO Notifications (parent_id, student_id, message, sent_at) VALUES (@parentId, @studentId, @message, GETDATE())');
    }
    */

    res.json({ isCorrect, feedback: isCorrect ? 'Correct!' : 'Try again', xpEarned: xp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;