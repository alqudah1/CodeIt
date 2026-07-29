const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { JWT_SECRET } = require('../config');
const { ready: legacyParentReviewReady } = require('../legacyParentReview');
const { getActivitySummary } = require('../userActivity');

const router = express.Router();

async function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Admin authentication required.' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const [[account]] = await pool.query(
      'SELECT role, is_admin FROM Users WHERE user_id = ? LIMIT 1',
      [payload.user_id]
    );
    const isAdmin = account
      && ((account.role || '').toLowerCase() === 'admin' || Number(account.is_admin) === 1);
    if (!isAdmin) return res.status(403).json({ error: 'Admin access required.' });
    req.admin = { userId: payload.user_id };
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired admin session.' });
  }
}

router.use(requireAdmin);

router.get('/evidence', async (_req, res) => {
  try {
    const activity = await getActivitySummary();
    const [[totals]] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM Users) AS accounts,
        (SELECT COUNT(*) FROM Students) AS student_profiles,
        (SELECT COUNT(*) FROM Students WHERE total_xp > 0) AS learners_with_xp,
        (SELECT COALESCE(SUM(total_xp), 0) FROM Students) AS total_xp,
        (SELECT COUNT(*) FROM Student_Lesson_Progress) AS lesson_completions,
        (SELECT COUNT(DISTINCT user_id) FROM Student_Lesson_Progress) AS lesson_learners,
        (SELECT COUNT(*) FROM Student_Quiz_Attempt) AS quiz_attempts,
        (SELECT COUNT(DISTINCT student_id) FROM Student_Quiz_Attempt) AS quiz_learners,
        (SELECT COUNT(*) FROM Student_Puzzle_Progress) AS puzzle_completions,
        (SELECT COUNT(DISTINCT user_id) FROM Student_Puzzle_Progress) AS puzzle_learners,
        (SELECT COUNT(*) FROM ai_projects) AS saved_projects,
        (SELECT COUNT(DISTINCT user_id) FROM ai_projects) AS project_creators,
        (SELECT COUNT(*) FROM ai_projects WHERE is_public = 1) AS public_projects,
        (SELECT MIN(DATE(created_at)) FROM Users) AS first_account_date,
        (SELECT MAX(DATE(created_at)) FROM Users) AS latest_account_date,
        (SELECT MAX(last_active_date) FROM Students) AS latest_recorded_activity
    `);

    const [lessonReach] = await pool.query(`
      SELECT lesson_id, COUNT(DISTINCT user_id) AS learners
      FROM Student_Lesson_Progress
      GROUP BY lesson_id
      ORDER BY lesson_id
    `);

    const [xpDistribution] = await pool.query(`
      SELECT
        CASE
          WHEN total_xp = 0 THEN '0 XP'
          WHEN total_xp < 100 THEN '1–99 XP'
          WHEN total_xp < 500 THEN '100–499 XP'
          WHEN total_xp < 1000 THEN '500–999 XP'
          ELSE '1,000+ XP'
        END AS bucket,
        COUNT(*) AS learners
      FROM Students
      GROUP BY bucket
      ORDER BY MIN(total_xp)
    `);

    res.json({
      totals,
      activity,
      lessonReach,
      xpDistribution,
      caveat: 'Historical product activity. These records are not verified paying customers and may include internal or test accounts.',
      loginTracking: 'Historical login counts were not recorded. New signed-in activity is measured from this release forward.',
    });
  } catch (error) {
    console.error('admin/evidence:', error.code || error.message);
    res.status(500).json({ error: 'Could not load product evidence.' });
  }
});

router.get('/overview', async (_req, res) => {
  try {
    const activity = await getActivitySummary();
    const [[totals]] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM Users) AS total_users,
        (SELECT COUNT(*) FROM Users WHERE DATE(created_at) = CURRENT_DATE()) AS signups_today,
        (SELECT COUNT(*) FROM Users WHERE created_at >= NOW() - INTERVAL 7 DAY) AS signups_week,
        (SELECT COALESCE(SUM(total_xp), 0) FROM Students) AS total_xp_earned,
        (SELECT COUNT(*) FROM Student_Lesson_Progress) AS total_lesson_completions,
        (SELECT COUNT(*) FROM Student_Quiz_Attempt) AS total_quiz_attempts,
        (SELECT COUNT(*) FROM Student_Puzzle_Progress WHERE puzzle_id >= 100) AS journey_puzzle_completions,
        (SELECT COUNT(*) FROM User_Character) AS avatars_customised,
        (SELECT COUNT(*) FROM Students WHERE current_streak > 0) AS students_with_streak,
        (SELECT COALESCE(MAX(longest_streak), 0) FROM Students) AS longest_active_streak
    `);
    const [recentSignups] = await pool.query(`
      SELECT u.user_id, u.username, u.name, u.email, u.role, u.created_at,
             COALESCE(s.total_xp, 0) AS xp
      FROM Users u
      LEFT JOIN Students s ON s.user_id = u.user_id
      ORDER BY u.created_at DESC
      LIMIT 10
    `);
    res.json({ totals, recentSignups, activity });
  } catch (error) {
    console.error('admin/overview:', error.code || error.message);
    res.status(500).json({ error: 'Could not load admin overview.' });
  }
});

router.get('/users', async (req, res) => {
  const search = String(req.query.search || '').trim();
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(200, Math.max(1, Number.parseInt(req.query.limit, 10) || 50));
  const offset = (page - 1) * limit;
  const params = [];
  let where = '';

  if (search) {
    where = 'WHERE u.name LIKE ? OR u.username LIKE ? OR u.email LIKE ?';
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  try {
    await legacyParentReviewReady;
    const [[count]] = await pool.query(`SELECT COUNT(*) AS total FROM Users u ${where}`, params);
    const [users] = await pool.query(`
      SELECT
        u.user_id, u.username, u.name, u.email, u.role, u.dob,
        u.parent_email, u.created_at, u.is_admin,
        COALESCE(s.total_xp, 0) AS total_xp,
        COALESCE(s.current_streak, 0) AS current_streak,
        COALESCE(s.longest_streak, 0) AS longest_streak,
        s.last_active_date,
        (SELECT COUNT(*) FROM Student_Lesson_Progress lp WHERE lp.user_id = u.user_id) AS lessons_done,
        (SELECT COUNT(DISTINCT qa.quiz_id) FROM Student_Quiz_Attempt qa WHERE qa.student_id = u.user_id) AS quizzes_done,
        (SELECT COUNT(*) FROM Student_Puzzle_Progress pp WHERE pp.user_id = u.user_id AND pp.puzzle_id >= 100) AS puzzles_done,
        (SELECT COUNT(*) FROM User_Character uc WHERE uc.user_id = u.user_id) AS has_avatar,
        CASE
          WHEN LOWER(u.role) <> 'student' OR u.dob IS NULL
            OR TIMESTAMPDIFF(YEAR, u.dob, CURRENT_DATE()) >= 13 THEN NULL
          WHEN EXISTS (
            SELECT 1
              FROM parent_child_links pcl
              JOIN Users adult ON adult.user_id = pcl.adult_user_id
              JOIN adult_email_verifications aev
                ON aev.user_id = adult.user_id
               AND aev.email = LOWER(adult.email)
               AND aev.verified_at IS NOT NULL
             WHERE pcl.child_user_id = u.user_id
          ) THEN 'managed'
          WHEN EXISTS (
            SELECT 1 FROM legacy_parent_reviews lpr
             WHERE lpr.child_user_id = u.user_id
               AND lpr.status = 'pending'
               AND lpr.expires_at > NOW()
          ) THEN 'review_sent'
          ELSE 'review_required'
        END AS family_status
      FROM Users u
      LEFT JOIN Students s ON s.user_id = u.user_id
      ${where}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);
    res.json({ total: count.total, page, limit, users });
  } catch (error) {
    console.error('admin/users:', error.code || error.message);
    res.status(500).json({ error: 'Could not load users.' });
  }
});

router.get('/users/:id', async (req, res) => {
  const userId = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(userId)) return res.status(400).json({ error: 'Invalid user ID.' });

  try {
    await legacyParentReviewReady;
    const [[users], [students], [characters], [lessons], [quizzes], [puzzles], [games], [achievements]] = await Promise.all([
      pool.query(`
        SELECT u.user_id, u.username, u.name, u.email, u.role, u.dob, u.parent_email,
               u.created_at, u.is_admin,
               CASE
                 WHEN LOWER(u.role) <> 'student' OR u.dob IS NULL
                   OR TIMESTAMPDIFF(YEAR, u.dob, CURRENT_DATE()) >= 13 THEN NULL
                 WHEN EXISTS (
                   SELECT 1
                     FROM parent_child_links pcl
                     JOIN Users adult ON adult.user_id = pcl.adult_user_id
                     JOIN adult_email_verifications aev
                       ON aev.user_id = adult.user_id
                      AND aev.email = LOWER(adult.email)
                      AND aev.verified_at IS NOT NULL
                    WHERE pcl.child_user_id = u.user_id
                 ) THEN 'managed'
                 WHEN EXISTS (
                   SELECT 1 FROM legacy_parent_reviews lpr
                    WHERE lpr.child_user_id = u.user_id
                      AND lpr.status = 'pending'
                      AND lpr.expires_at > NOW()
                 ) THEN 'review_sent'
                 ELSE 'review_required'
               END AS family_status
          FROM Users u WHERE u.user_id = ?`,
        [userId]
      ),
      pool.query('SELECT total_xp, weekly_xp, level_id, current_streak, longest_streak, last_active_date FROM Students WHERE user_id = ?', [userId]),
      pool.query('SELECT gender, skin_tone, hair_style, hair_color, outfit, accent, expression, nickname, updated_at FROM User_Character WHERE user_id = ?', [userId]),
      pool.query('SELECT lesson_id, xp_earned, completed_at FROM Student_Lesson_Progress WHERE user_id = ? ORDER BY lesson_id', [userId]),
      pool.query('SELECT quiz_id, correct_count, total_questions, xp_earned, completed_at FROM Student_Quiz_Attempt WHERE student_id = ? ORDER BY completed_at DESC', [userId]),
      pool.query('SELECT puzzle_id, xp_earned, completed_at FROM Student_Puzzle_Progress WHERE user_id = ? ORDER BY puzzle_id', [userId]),
      pool.query('SELECT game_key, high_score, updated_at FROM Student_Game_Score WHERE user_id = ? ORDER BY game_key', [userId]),
      pool.query('SELECT achievement_key, label, earned_at FROM Student_Achievement WHERE user_id = ? ORDER BY earned_at', [userId]),
    ]);
    if (!users.length) return res.status(404).json({ error: 'User not found.' });
    res.json({
      user: users[0],
      student: students[0] || null,
      character: characters[0] || null,
      lessons,
      quizAttempts: quizzes,
      puzzles,
      gameScores: games,
      achievements,
    });
  } catch (error) {
    console.error('admin/user:', error.code || error.message);
    res.status(500).json({ error: 'Could not load user details.' });
  }
});

router.get('/progress', async (_req, res) => {
  try {
    const [lessonStats] = await pool.query(`
      SELECT lp.lesson_id, l.title, COUNT(DISTINCT lp.user_id) AS completions,
             ROUND(COUNT(DISTINCT lp.user_id) * 100.0 / NULLIF((SELECT COUNT(*) FROM Students), 0), 1) AS pct
      FROM Student_Lesson_Progress lp
      LEFT JOIN lessons l ON l.id = lp.lesson_id
      GROUP BY lp.lesson_id, l.title
      ORDER BY lp.lesson_id
    `);
    const [quizStats] = await pool.query(`
      SELECT quiz_id, COUNT(*) AS attempts, COUNT(DISTINCT student_id) AS unique_students,
             ROUND(AVG(correct_count * 100.0 / NULLIF(total_questions, 0)), 1) AS avg_score_pct
      FROM Student_Quiz_Attempt
      WHERE quiz_id <= 16
      GROUP BY quiz_id
      ORDER BY quiz_id
    `);
    const [puzzleStats] = await pool.query(`
      SELECT puzzle_id, COUNT(DISTINCT user_id) AS completions
      FROM Student_Puzzle_Progress
      WHERE puzzle_id >= 100
      GROUP BY puzzle_id
      ORDER BY puzzle_id
    `);
    const [[dropoff]] = await pool.query(`
      SELECT
        (SELECT COUNT(DISTINCT user_id) FROM Student_Lesson_Progress WHERE lesson_id >= 1) AS reached_l1,
        (SELECT COUNT(DISTINCT user_id) FROM Student_Lesson_Progress WHERE lesson_id >= 3) AS reached_l3,
        (SELECT COUNT(DISTINCT user_id) FROM Student_Lesson_Progress WHERE lesson_id >= 5) AS reached_l5,
        (SELECT COUNT(DISTINCT user_id) FROM Student_Lesson_Progress WHERE lesson_id >= 10) AS reached_l10
    `);
    res.json({ lessonStats, quizStats, puzzleStats, dropoff });
  } catch (error) {
    console.error('admin/progress:', error.code || error.message);
    res.status(500).json({ error: 'Could not load progress.' });
  }
});

router.get('/avatars', async (_req, res) => {
  try {
    const [avatars] = await pool.query(`
      SELECT u.user_id, u.name, u.username, uc.gender, uc.skin_tone, uc.hair_style,
             uc.hair_color, uc.outfit, uc.accent, uc.expression, uc.nickname, uc.updated_at
      FROM User_Character uc
      JOIN Users u ON u.user_id = uc.user_id
      ORDER BY uc.updated_at DESC
    `);
    const [outfitDistribution] = await pool.query(
      'SELECT outfit, COUNT(*) AS n FROM User_Character GROUP BY outfit ORDER BY n DESC'
    );
    res.json({ avatars, outfitDistribution });
  } catch (error) {
    console.error('admin/avatars:', error.code || error.message);
    res.status(500).json({ error: 'Could not load avatars.' });
  }
});

router.get('/stats', async (_req, res) => {
  try {
    const [xpDistribution] = await pool.query(`
      SELECT CASE
        WHEN total_xp = 0 THEN '0 XP'
        WHEN total_xp < 100 THEN '1 – 99'
        WHEN total_xp < 500 THEN '100 – 499'
        WHEN total_xp < 1000 THEN '500 – 999'
        ELSE '1000+'
      END AS bucket, COUNT(*) AS n
      FROM Students
      GROUP BY bucket
      ORDER BY MIN(total_xp)
    `);
    const [streakDistribution] = await pool.query(`
      SELECT CASE
        WHEN current_streak = 0 THEN 'No streak'
        WHEN current_streak < 3 THEN '1 – 2 days'
        WHEN current_streak < 7 THEN '3 – 6 days'
        ELSE '7+ days'
      END AS bucket, COUNT(*) AS n
      FROM Students
      GROUP BY bucket
      ORDER BY MIN(current_streak)
    `);
    const [topLearners] = await pool.query(`
      SELECT u.user_id, u.name, u.username, s.total_xp, s.current_streak, s.longest_streak,
             (SELECT COUNT(*) FROM Student_Lesson_Progress lp WHERE lp.user_id = u.user_id) AS lessons_done,
             (SELECT COUNT(DISTINCT quiz_id) FROM Student_Quiz_Attempt qa WHERE qa.student_id = u.user_id) AS quizzes_done
      FROM Students s
      JOIN Users u ON u.user_id = s.user_id
      ORDER BY s.total_xp DESC
      LIMIT 20
    `);
    const [signupsByDay] = await pool.query(`
      SELECT DATE(created_at) AS day, COUNT(*) AS n
      FROM Users
      WHERE created_at >= NOW() - INTERVAL 30 DAY
      GROUP BY day
      ORDER BY day
    `);
    const [quizAccuracy] = await pool.query(`
      SELECT quiz_id, ROUND(AVG(correct_count * 100.0 / NULLIF(total_questions, 0)), 1) AS avg_pct
      FROM Student_Quiz_Attempt
      WHERE quiz_id <= 16
      GROUP BY quiz_id
      ORDER BY quiz_id
    `);
    res.json({ xpDistribution, streakDistribution, topLearners, signupsByDay, quizAccuracy });
  } catch (error) {
    console.error('admin/stats:', error.code || error.message);
    res.status(500).json({ error: 'Could not load statistics.' });
  }
});

module.exports = router;
