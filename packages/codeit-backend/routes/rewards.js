const express = require('express');
const pool = require('../db');
const router = express.Router();
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'Team42*';

const TOTAL_QUIZZES  = 10;
const TOTAL_LESSONS  = 10;
const TOTAL_GAMES    = 10;

// Middleware
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

// GET /api/rewards/progress-percentages
router.get('/progress-percentages', async (req, res) => {
  const userId = req.user.user_id;
  try {
    // Quizzes attempted (distinct)
    const [quizRows] = await pool.query(
      'SELECT COUNT(DISTINCT quiz_id) AS quiz_count FROM Student_Quiz_Attempt WHERE student_id = ?',
      [userId]
    );
    const quizCount = quizRows[0]?.quiz_count ?? 0;
    const quizPct = Math.min(100, Math.round((quizCount / TOTAL_QUIZZES) * 100));

    // Lessons completed (distinct)
    const [lessonRows] = await pool.query(
      'SELECT COUNT(DISTINCT lesson_id) AS lesson_count FROM Student_Lesson_Progress WHERE user_id = ?',
      [userId]
    );
    const lessonCount = lessonRows[0]?.lesson_count ?? 0;
    const lessonPct = Math.min(100, Math.round((lessonCount / TOTAL_LESSONS) * 100));

    // Puzzles completed (distinct)
    const [puzzleRows] = await pool.query(
      'SELECT COUNT(DISTINCT puzzle_id) AS puzzle_count FROM Student_Puzzle_Progress WHERE user_id = ?',
      [userId]
    );
    const puzzleCount = puzzleRows[0]?.puzzle_count ?? 0;
    const gamePct = Math.min(100, Math.round((puzzleCount / TOTAL_GAMES) * 100));

    res.json({
      success: true,
      progress: {
        lesson: lessonPct,
        quiz:   quizPct,
        game:   gamePct,
      },
    });
  } catch (err) {
    console.error('❌ Error fetching progress:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/rewards/leaderboard
// XP = quiz XP + lesson XP + puzzle XP (computed live, not from rewards cache table)
router.get('/leaderboard', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        u.user_id AS student_id,
        u.name,
        (
          COALESCE((SELECT SUM(xp_earned) FROM Student_Quiz_Attempt   WHERE student_id = u.user_id), 0) +
          COALESCE((SELECT SUM(xp_earned) FROM Student_Lesson_Progress WHERE user_id    = u.user_id), 0) +
          COALESCE((SELECT SUM(xp_earned) FROM Student_Puzzle_Progress WHERE user_id    = u.user_id), 0)
        ) AS xp_points
      FROM Users u
      WHERE u.role = 'student'
      HAVING xp_points > 0
      ORDER BY xp_points DESC
      LIMIT 20
    `);
    res.json({ leaderboard: rows });
  } catch (err) {
    console.error('❌ Error fetching leaderboard:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
