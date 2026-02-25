const express = require('express');
const pool = require('../db');
const router = express.Router();
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'Team42*';

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

// GET /api/lessons — list all lessons
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, title, description, xp FROM lessons ORDER BY id');
    res.json({ lessons: rows });
  } catch (err) {
    console.error('❌ Error fetching lessons:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/lessons/:id — single lesson
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT id, title, description, xp FROM lessons WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Lesson not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('❌ Error fetching lesson:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/lessons/:id/complete — mark lesson complete, award XP (once per user)
router.post('/:id/complete', async (req, res) => {
  const userId = req.user.user_id;
  const lessonId = req.params.id;

  try {
    // Look up lesson XP
    const [lessonRows] = await pool.query('SELECT id, xp FROM lessons WHERE id = ?', [lessonId]);
    if (!lessonRows.length) return res.status(404).json({ error: 'Lesson not found' });
    const xpReward = lessonRows[0].xp;

    // Check if student
    const [studentCheck] = await pool.query('SELECT user_id FROM Students WHERE user_id = ?', [userId]);
    const isStudent = studentCheck.length > 0;

    // INSERT IGNORE prevents duplicates (UNIQUE KEY uq_user_lesson)
    const [result] = await pool.query(
      'INSERT IGNORE INTO Student_Lesson_Progress (user_id, lesson_id, xp_earned) VALUES (?, ?, ?)',
      [userId, lessonId, xpReward]
    );

    const alreadyCompleted = result.affectedRows === 0;

    if (!alreadyCompleted && isStudent) {
      await pool.query('UPDATE Students SET total_xp = total_xp + ? WHERE user_id = ?', [xpReward, userId]);
    }

    res.json({
      success: true,
      alreadyCompleted,
      xpEarned: alreadyCompleted ? 0 : xpReward,
    });
  } catch (err) {
    console.error('❌ Error completing lesson:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
