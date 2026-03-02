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

// GET /api/puzzles — list all puzzles
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, emoji, difficulty, xp FROM Puzzles ORDER BY id');
    res.json({ puzzles: rows });
  } catch (err) {
    console.error('❌ Error fetching puzzles:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/puzzles/:id — single puzzle
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT id, name, emoji, difficulty, xp FROM Puzzles WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Puzzle not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('❌ Error fetching puzzle:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/puzzles/:id/complete — mark puzzle complete, award XP (once per user, auth required)
router.post('/:id/complete', authenticateToken, async (req, res) => {
  const userId = req.user.user_id;
  const puzzleId = req.params.id;

  try {
    const [puzzleRows] = await pool.query('SELECT id, xp FROM Puzzles WHERE id = ?', [puzzleId]);
    if (!puzzleRows.length) return res.status(404).json({ error: 'Puzzle not found' });
    const xpReward = puzzleRows[0].xp;

    const [studentCheck] = await pool.query('SELECT user_id FROM Students WHERE user_id = ?', [userId]);
    const isStudent = studentCheck.length > 0;

    const [result] = await pool.query(
      'INSERT IGNORE INTO Student_Puzzle_Progress (user_id, puzzle_id, xp_earned) VALUES (?, ?, ?)',
      [userId, puzzleId, xpReward]
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
    console.error('❌ Error completing puzzle:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
