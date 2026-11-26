const express = require('express');
const { recordEvent } = require('../analytics');
const { normalizeJourneyId } = require('../analyticsEvents');
const pool = require('../db');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const { recordMilestoneAndNotify } = require('../progressNotifications');
const { stepsDoneFor } = require('../stepXp');

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

// GET /api/lessons/progress — list completed lesson IDs for this user (auth required)
router.get('/progress', authenticateToken, async (req, res) => {
  const userId = req.user.user_id;
  try {
    const [rows] = await pool.query(
      'SELECT lesson_id, completed_at FROM Student_Lesson_Progress WHERE user_id = ? ORDER BY lesson_id',
      [userId]
    );
    const completedLessons = rows.map(r => r.lesson_id);
    // When the last of them was finished: the date on the certificate.
    const times = rows.map(r => new Date(r.completed_at).getTime()).filter(Number.isFinite);
    const finishedAt = times.length ? new Date(Math.max(...times)).toISOString() : null;
    // Lessons begun and not finished, with the furthest step answered, so the
    // map can say "Carry on" where it used to say "Start" to a child who was
    // halfway through. Read apart from the rest: if it fails the map still
    // has every finished lesson, and says "Start", as it did before.
    const inHand = {};
    try {
      const [steps] = await pool.query(
        'SELECT lesson_id, MAX(step_index) AS furthest FROM lesson_step_xp WHERE user_id = ? AND lesson_id >= 1 GROUP BY lesson_id',
        [userId]
      );
      const done = new Set(completedLessons.map(Number));
      for (const row of steps || []) {
        const id = Number(row.lesson_id);
        const furthest = Number(row.furthest);
        if (Number.isInteger(id) && Number.isInteger(furthest) && furthest >= 0 && !done.has(id)) inHand[id] = furthest;
      }
    } catch (err) {
      console.error(`lesson progress: the lessons in hand could not be read (${err.message})`);
    }
    res.json({ success: true, completedLessons, finishedAt, inHand });
  } catch (err) {
    console.error('❌ Error fetching lesson progress:', err);
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

// GET /api/lessons/:id/steps — the steps of this lesson the learner has passed
//
// So a lesson started on one computer opens at the same place on another.
// A failure here is an empty list, never an error on the child's screen: the
// lesson then opens at the start, which is what it did before this existed.
router.get('/:id/steps', authenticateToken, async (req, res) => {
  try {
    const steps = await stepsDoneFor((sql, values) => pool.query(sql, values), req.user.user_id, req.params.id);
    res.json({ steps });
  } catch (err) {
    console.error(`lesson steps: could not be read (${err.message})`);
    res.json({ steps: [], unread: true });
  }
});

// POST /api/lessons/:id/complete — mark lesson complete, award XP (once per user, auth required)
router.post('/:id/complete', authenticateToken, async (req, res) => {
  const userId = req.user.user_id;
  const lessonId = req.params.id;

  try {
    // Look up lesson XP
    const [lessonRows] = await pool.query('SELECT id, title, xp FROM lessons WHERE id = ?', [lessonId]);
    if (!lessonRows.length) return res.status(404).json({ error: 'Lesson not found' });
    const xpReward = lessonRows[0].xp;

    // Check if student
    const [studentCheck] = await pool.query('SELECT user_id FROM Students WHERE user_id = ?', [userId]);
    const isStudent = studentCheck.length > 0;

    // INSERT IGNORE prevents duplicates (UNIQUE KEY uq_user_lesson)
    const [result] = await pool.query(
      'INSERT INTO Student_Lesson_Progress (user_id, lesson_id, xp_earned) VALUES (?, ?, ?) ON CONFLICT (user_id, lesson_id) DO NOTHING',
      [userId, lessonId, xpReward]
    );

    const alreadyCompleted = result.affectedRows === 0;

    if (!alreadyCompleted && isStudent) {
      await pool.query('UPDATE Students SET total_xp = total_xp + ? WHERE user_id = ?', [xpReward, userId]);
      void recordMilestoneAndNotify({
        userId,
        eventType: 'lesson_completed',
        eventKey: String(lessonId),
        title: lessonRows[0].title || `Lesson ${lessonId}`,
        detail: `Earned ${xpReward} XP`,
      }).catch(error => console.error('Lesson milestone error:', error.message));

      // The milestone table counts lesson completions by reading
      // Student_Lesson_Progress, which can say how many but never when, and
      // never in relation to anything else. Without an event, the question
      // "did this learner reach the studio after finishing a lesson" has no
      // answer even in principle. Fired only on a first completion, so a
      // repeat visit to a finished lesson does not inflate it.
      // With the session journey, so the campaign report can say which
      // tagged visit ended in a finished lesson. Without it (before 11
      // September) the event existed but joined to nothing.
      void recordEvent('lesson_complete', {
        userId,
        journeyId: normalizeJourneyId(req.get('X-CodeIt-Journey')),
      }).catch(() => {});
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
