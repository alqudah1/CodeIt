const express = require('express');
const pool = require('../db');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const { publicLeaderboardRows } = require('../leaderboardIdentity');

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

// GET /api/rewards/progress-percentages  (requires auth — user-specific data)
router.get('/progress-percentages', authenticateToken, async (req, res) => {
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

// GET /api/rewards/leaderboard (signed-in students only)
// XP = quiz XP + lesson XP + puzzle XP (computed live).
// Real names and database IDs never leave the server.
router.get('/leaderboard', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        u.user_id AS student_id,
        (
          COALESCE(q.quiz_xp, 0) +
          COALESCE(l.lesson_xp, 0) +
          COALESCE(p.puzzle_xp, 0)
        ) AS xp_points
      FROM Users u
      LEFT JOIN (
        SELECT student_id, SUM(best_xp) AS quiz_xp
        FROM (
          SELECT student_id, quiz_id, MAX(xp_earned) AS best_xp
          FROM Student_Quiz_Attempt
          GROUP BY student_id, quiz_id
        ) quiz_best
        GROUP BY student_id
      ) q ON q.student_id = u.user_id
      LEFT JOIN (
        SELECT user_id, SUM(best_xp) AS lesson_xp
        FROM (
          SELECT user_id, lesson_id, MAX(xp_earned) AS best_xp
          FROM Student_Lesson_Progress
          GROUP BY user_id, lesson_id
        ) lesson_best
        GROUP BY user_id
      ) l ON l.user_id = u.user_id
      LEFT JOIN (
        SELECT user_id, SUM(best_xp) AS puzzle_xp
        FROM (
          SELECT user_id, puzzle_id, MAX(xp_earned) AS best_xp
          FROM Student_Puzzle_Progress
          GROUP BY user_id, puzzle_id
        ) puzzle_best
        GROUP BY user_id
      ) p ON p.user_id = u.user_id
      WHERE u.role = 'student'
      HAVING xp_points > 0
      ORDER BY xp_points DESC
    `);
    res.json(publicLeaderboardRows(rows, req.user.user_id));
  } catch (err) {
    console.error('❌ Error fetching leaderboard:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
