const express = require('express');
const pool = require('../db');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

const SLOT_LABEL = { 1: 'A', 2: 'B', 3: 'BOSS' };

function pidToStr(numId) {
  const lesson = Math.floor(numId / 100);
  const slot   = SLOT_LABEL[numId % 100];
  return slot ? `${lesson}${slot}` : null;
}

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

// GET /api/journey/progress
// Returns total XP (authoritative sum from all three activity tables, same
// formula as /api/rewards/leaderboard) plus completed-item arrays.
router.get('/progress', authenticateToken, async (req, res) => {
  const userId = req.user.user_id;
  try {
    // Total XP — recalculate from source tables (same as leaderboard)
    const [[xpRow]] = await pool.query(`
      SELECT
        COALESCE((SELECT SUM(xp_earned) FROM Student_Quiz_Attempt   WHERE student_id = ?), 0) +
        COALESCE((SELECT SUM(xp_earned) FROM Student_Lesson_Progress WHERE user_id    = ?), 0) +
        COALESCE((SELECT SUM(xp_earned) FROM Student_Puzzle_Progress WHERE user_id    = ?), 0)
        AS total_xp
    `, [userId, userId, userId]);

    // Completed lessons
    const [lessonRows] = await pool.query(
      'SELECT lesson_id FROM Student_Lesson_Progress WHERE user_id = ? ORDER BY lesson_id',
      [userId]
    );

    // Completed quizzes (split into mini ≤10 and big >10)
    const [quizRows] = await pool.query(
      'SELECT DISTINCT quiz_id FROM Student_Quiz_Attempt WHERE student_id = ? ORDER BY quiz_id',
      [userId]
    );

    const completedMiniQuizzes = quizRows.filter(r => r.quiz_id <= 10).map(r => r.quiz_id);
    const completedBigQuizzes  = quizRows.filter(r => r.quiz_id > 10).map(r => r.quiz_id);

    // Completed journey puzzles — convert numeric IDs to string labels ("1A", "1B", "1BOSS")
    const [puzzleRows] = await pool.query(
      'SELECT DISTINCT puzzle_id FROM Student_Puzzle_Progress WHERE user_id = ? ORDER BY puzzle_id',
      [userId]
    );
    const completedPuzzles = puzzleRows
      .map(r => pidToStr(r.puzzle_id))
      .filter(Boolean);

    res.json({
      success: true,
      xp:                   Number(xpRow.total_xp) || 0,
      completedLessons:     lessonRows.map(r => r.lesson_id),
      completedMiniQuizzes,
      completedBigQuizzes,
      completedPuzzles,
    });
  } catch (err) {
    console.error('❌ Error fetching journey progress:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
