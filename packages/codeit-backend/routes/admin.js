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
      'SELECT role, is_admin, email FROM Users WHERE user_id = ? LIMIT 1',
      [payload.user_id]
    );
    // The bootstrap: is_admin lives in the database, and on a fresh production
    // database nobody can set it - the only path to the database is the admin
    // panel the flag guards. ADMIN_BOOTSTRAP_EMAIL breaks the circle: the
    // owner names their own email in an environment variable only they can
    // set, and the account signed in with that email is admin. Unset, this
    // clause does not exist.
    const bootstrapEmail = String(process.env.ADMIN_BOOTSTRAP_EMAIL || '').trim().toLowerCase();
    const isBootstrapOwner = bootstrapEmail
      && String(account?.email || '').trim().toLowerCase() === bootstrapEmail;
    const isAdmin = account
      && ((account.role || '').toLowerCase() === 'admin' || Number(account.is_admin) === 1 || isBootstrapOwner);
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

// ── Where we actually lose people ───────────────────────────────────────────
//
// Every number below is already collected; nothing new is measured and nothing
// is estimated. What was missing was the ORDER — thirteen stat tiles cannot
// answer "is our problem discovery, activation, or retention?", and that
// question was being answered by opinion.
//
// The steps are the real sequence a learner goes through, each counted as
// DISTINCT LEARNERS (not events), so the drop between two steps is a number of
// people, not a ratio of activity. A step that counts nobody reports zero
// rather than being hidden.
router.get('/funnel/activation', async (_req, res) => {
  try {
    const [[row]] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM Users) AS signed_up,
        (SELECT COUNT(DISTINCT user_id) FROM User_Character) AS made_an_avatar,
        (SELECT COUNT(DISTINCT user_id) FROM ai_projects) AS made_a_project,
        (SELECT COUNT(DISTINCT user_id) FROM ai_projects WHERE is_public = 1) AS published_one,
        (SELECT COUNT(DISTINCT user_id) FROM Student_Lesson_Progress) AS finished_a_lesson,
        (SELECT COUNT(*) FROM Students WHERE current_streak > 1) AS came_back_twice,
        (SELECT COUNT(DISTINCT user_id) FROM understanding_records) AS explained_their_code
    `);

    const signedUp = Number(row.signed_up) || 0;
    const step = (label, value, note) => ({
      label,
      learners: Number(value) || 0,
      pctOfSignups: signedUp ? Math.round((Number(value) || 0) / signedUp * 1000) / 10 : 0,
      note,
    });

    const steps = [
      step('Signed up', row.signed_up, 'every account, including parents and admins'),
      step('Made an avatar', row.made_an_avatar, 'opened the character lab and saved a look'),
      step('Made a project', row.made_a_project, 'the activation moment: they built something'),
      step('Published one', row.published_one, 'made it public, so it can be shared'),
      step('Finished a lesson', row.finished_a_lesson, 'completed at least one of the 31 lessons'),
      step('Came back a second day', row.came_back_twice, 'streak above 1, so not a one-visit account'),
      step('Explained their own code', row.explained_their_code, 'the evidence loop: earned at least one sentence'),
    ];

    // The biggest single drop, named. This is the sentence the admin page
    // exists to produce.
    let biggestDrop = null;
    for (let i = 1; i < steps.length; i += 1) {
      const lost = steps[i - 1].learners - steps[i].learners;
      if (lost > 0 && (!biggestDrop || lost > biggestDrop.lost)) {
        biggestDrop = { from: steps[i - 1].label, to: steps[i].label, lost };
      }
    }

    res.json({ success: true, steps, biggestDrop });
  } catch (error) {
    console.error('admin/funnel/activation:', error.message);
    res.status(500).json({ error: 'Could not measure activation.' });
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

// ── The lesson retention funnel, measured rather than argued ────────────────
//
// "230 started and 11 finished" circulated as a claim with no query behind
// it. This is the query, run on demand against the live tables. "Started" is
// a learner who left any trace inside the lesson (a step-XP row) or finished
// it; "finished" is a completion row. Read-only.
router.get('/funnel/lessons', async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT l.id, l.title,
        (SELECT COUNT(DISTINCT u.user_id) FROM (
           SELECT user_id FROM lesson_step_xp WHERE lesson_id = l.id
           UNION
           SELECT user_id FROM Student_Lesson_Progress WHERE lesson_id = l.id
         ) u) AS started,
        (SELECT COUNT(*) FROM Student_Lesson_Progress p WHERE p.lesson_id = l.id) AS finished
      FROM lessons l
      ORDER BY l.id
    `);
    const lessons = rows.map(row => ({
      id: row.id,
      title: row.title,
      started: Number(row.started) || 0,
      finished: Number(row.finished) || 0,
    }));
    res.json({ success: true, lessons });
  } catch (error) {
    console.error('admin/funnel/lessons:', error.message);
    res.status(500).json({ error: 'Could not measure the funnel.' });
  }
});

// ── One-time maintenance: the two changes production is waiting for ──────────
//
// The owner's machine has no psql and Vercel stores DATABASE_URL as a
// sensitive value that can never be read back, so the deployed backend is the
// only thing that can reach the production database. This applies EXACTLY the
// two reviewed changes in maintenanceSql.js — the understanding_records table
// and seven lesson descriptions — and nothing else. Idempotent: safe to press
// twice. Admin only, like everything on this router.
router.post('/maintenance/apply-pending', async (_req, res) => {
  const { CREATE_MONTHLY_DIGEST_LOG, CREATE_UNDERSTANDING_RECORDS, LESSON_DESCRIPTION_FIXES } = require('../maintenanceSql');
  try {
    // The first press in production taught us two things: the role in
    // DATABASE_URL may not be allowed to do DDL at all ("permission denied
    // for schema public"), and one failing step must not take the others
    // down with it. So each table is checked before it is created, a DDL
    // refusal is reported instead of thrown — the tables may already exist,
    // created from the Supabase SQL editor's privileged role — and the
    // description fixes ALWAYS get their turn, because they are plain
    // UPDATEs the app role can run.
    const tables = {};
    for (const [name, ddl] of [
      ['understanding_records', CREATE_UNDERSTANDING_RECORDS],
      ['monthly_digest_log', CREATE_MONTHLY_DIGEST_LOG],
    ]) {
      try {
        const [[probe]] = await pool.query(`SELECT to_regclass('public.${name}') AS reg`);
        if (probe && probe.reg) { tables[name] = 'already there'; continue; }
        for (const statement of ddl.split(';').map(s => s.trim()).filter(Boolean)) {
          if (pool.rawQuery) await pool.rawQuery(statement);
          else await pool.query(statement);
        }
        tables[name] = 'created';
      } catch (err) {
        tables[name] = /permission denied/i.test(err.message)
          ? 'blocked: the database role cannot create tables — run the migration once from the Supabase SQL editor'
          : `failed: ${err.message}`;
      }
    }
    let updated = 0;
    let descriptionsError = null;
    try {
      for (const [id, description] of LESSON_DESCRIPTION_FIXES) {
        const [result] = await pool.query('UPDATE lessons SET description = ? WHERE id = ?', [description, id]);
        updated += result.affectedRows || 0;
      }
    } catch (err) {
      descriptionsError = err.message;
    }
    const [rows] = await pool.query(
      'SELECT id, title, description FROM lessons WHERE id IN (3,5,6,7,8,9,10) ORDER BY id'
    );
    res.json({
      success: !descriptionsError,
      tables,
      understandingTable: tables.understanding_records,
      descriptionsUpdated: updated,
      descriptionsError,
      lessons: rows,
    });
  } catch (error) {
    console.error('admin/maintenance:', error.message);
    res.status(500).json({ error: `Maintenance failed: ${error.message}` });
  }
});

// ── The monthly evidence email ──────────────────────────────────────────────
//
// Preview first, always: the owner sees the exact rendered email for a real
// learner before anything is sent to a real family. Send is idempotent per
// learner per month (monthly_digest_log).
router.get('/digest/preview/:userId', async (req, res) => {
  const { previewMonthlyDigest } = require('../digestSender');
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId)) return res.status(400).json({ error: 'Numeric user id required.' });
  try {
    const preview = await previewMonthlyDigest(userId);
    if (!preview) return res.status(404).json({ error: 'No such learner.' });
    res.json({ success: true, ...preview });
  } catch (error) {
    console.error('admin/digest/preview:', error.message);
    res.status(500).json({ error: 'Could not build the preview.' });
  }
});

router.post('/digest/send', async (req, res) => {
  const { sendMonthlyDigests } = require('../digestSender');
  try {
    const outcome = await sendMonthlyDigests({ dryRun: req.query.dry === '1' });
    res.json({ success: true, ...outcome });
  } catch (error) {
    console.error('admin/digest/send:', error.message);
    res.status(500).json({ error: `Digest failed: ${error.message}` });
  }
});

module.exports = router;
