'use strict';

const express    = require('express');
const router     = express.Router();
const pool       = require('../db');
const jwt        = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const { SHOWCASE_PROJECTS, findShowcaseProject } = require('../showcaseProjects');
const { questFor } = require('../today');
const { isClassAccountSql } = require('../classAccounts');

function optionalAuth(req, res, next) {
  const header = req.headers['authorization'];
  const token  = header && header.split(' ')[1];
  if (!token) return next();
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (!err) req.user = user;
    next();
  });
}

function extractColors(code) {
  const s = code || '';
  return {
    primary: s.match(/--primary:\s*(#[\da-fA-F]{3,8})/)?.[1] || '#FF7A00',
    accent:  s.match(/--accent:\s*(#[\da-fA-F]{3,8})/)?.[1]  || '#A855F7',
  };
}

function formatProject(row, likedSet) {
  const { primary, accent } = extractColors(row.code_sample || '');
  const out = {
    id:           row.id,
    title:        row.title,
    projectType:  row.project_type,
    publicId:     row.public_id,
    plays:        row.view_count  || 0,
    likes:        row.like_count  || 0,
    remixes:      row.remix_count || 0,
    creatorName:  row.creator_name || 'CodeIt Creator',
    createdAt:    row.created_at,
    primaryColor: primary,
    accentColor:  accent,
    liked:        likedSet ? likedSet.has(row.id) : false,
    isShowcase:   Boolean(row.is_showcase),
  };
  if (row.gender) {
    out.creator = {
      gender:     row.gender,
      skinTone:   row.skin_tone,
      hairStyle:  row.hair_style,
      hairColor:  row.hair_color,
      outfit:     row.outfit,
      accent:     row.accent_chr,
      expression: row.expression,
    };
  }
  return out;
}

// ── GET /api/explore ──────────────────────────────────────────────
//
// The public gallery: anyone, signed in or not, sees every project here.
// It listed everything published, which included every game a child made
// in a classroom. In a lesson, Publish is how a game reaches the projector
// and the class arcade, so all twelve lesson plans have every child press
// it; and every one of those games then appeared in this gallery's "newest"
// row, with its title and the first 800 characters of its code, for any
// stranger browsing. A class account's work is for its class. It is shown
// there, and never here.
router.get('/', optionalAuth, async (req, res) => {
  const limit  = Math.min(parseInt(req.query.limit) || 12, 20);
  const userId = req.user?.user_id || null;

  const base = `
    SELECT p.id, p.title, p.project_type, p.public_id,
           p.view_count, p.like_count, p.remix_count,
           p.creator_name, p.created_at,
           LEFT(p.generated_code, 800) AS code_sample,
           uc.gender, uc.skin_tone, uc.hair_style, uc.hair_color,
           uc.outfit, uc.accent AS accent_chr, uc.expression
    FROM ai_projects p
    LEFT JOIN User_Character uc ON p.user_id = uc.user_id
    WHERE p.is_public = 1
      AND NOT ${isClassAccountSql('p.user_id')}
  `;

  // ── Today's build ─────────────────────────────────────────────────────
  // The quest on every child's Home (today.js), and the games children
  // published from it today: the same sentence, made today, public. Real
  // entries only; no top-up, so an empty day says so.
  const quest = questFor();
  const dayStart = new Date(`${quest.day}T00:00:00Z`);

  try {
    const [
      [trending],
      [newest],
      [mostPlayed],
      [mostRemixed],
      [todayRows],
      [[todayCount]],
    ] = await Promise.all([
      pool.query(base + ` ORDER BY (p.view_count + p.like_count * 3) DESC LIMIT ?`, [limit]),
      pool.query(base + ` ORDER BY p.created_at DESC LIMIT ?`,                       [limit]),
      pool.query(base + ` ORDER BY p.view_count DESC LIMIT ?`,                       [limit]),
      pool.query(base + ` ORDER BY p.remix_count DESC, p.view_count DESC LIMIT ?`,   [limit]),
      pool.query(base + ` AND LOWER(TRIM(p.prompt)) = ? AND p.created_at >= ? ORDER BY p.created_at DESC LIMIT 4`, [quest.prompt.toLowerCase(), dayStart]),
      // The count is its own query: "4 made today" must not mean "at least 4".
      pool.query(`SELECT COUNT(*) AS made FROM ai_projects p WHERE p.is_public = 1 AND NOT ${isClassAccountSql('p.user_id')} AND LOWER(TRIM(p.prompt)) = ? AND p.created_at >= ?`, [quest.prompt.toLowerCase(), dayStart]),
    ]);

    // Collect liked project ids for the current user in one query
    let likedSet = null;
    if (userId) {
      const allIds = [...new Set([
        ...trending.map(r => r.id),
        ...newest.map(r => r.id),
        ...mostPlayed.map(r => r.id),
        ...mostRemixed.map(r => r.id),
        ...todayRows.map(r => r.id),
      ])];
      if (allIds.length) {
        // One placeholder per id, not `IN (?)` with an array.
        //
        // `IN (?)` bound to an array is a mysql2 convenience: the driver expands
        // it client-side. Postgres has no such thing, and our compatibility
        // layer only rewrites ? into $n — so on production this threw, the
        // catch below turned it into a 500, and every signed-in visitor saw
        // "Could not load explore feed." while signed-out visitors saw a
        // working page (userId is null, so this block never ran for them).
        //
        // Explicit placeholders are valid in both drivers.
        const idSlots = allIds.map(() => '?').join(', ');
        const [likes] = await pool.query(
          `SELECT project_id FROM ai_project_likes WHERE user_id = ? AND project_id IN (${idSlots})`,
          [userId, ...allIds]
        );
        likedSet = new Set(likes.map(l => l.project_id));
      }
    }

    const studioRows = SHOWCASE_PROJECTS.map((project) => ({
      ...project,
      code_sample: project.generated_code,
    }));
    // Real projects first, always - but a feed of three cards reads as an
    // abandoned site, so thin feeds are topped up with the studio's own
    // playable showcase projects until the community outgrows them.
    const withStudioTopUp = (rows) => {
      if (rows.length >= 8) return rows;
      const have = new Set(rows.map(row => row.public_id));
      return [...rows, ...studioRows.filter(row => !have.has(row.public_id))].slice(0, 12);
    };

    res.json({
      success:     true,
      trending:    withStudioTopUp(trending).map(r    => formatProject(r, likedSet)),
      newest:      withStudioTopUp(newest).map(r      => formatProject(r, likedSet)),
      mostPlayed:  withStudioTopUp(mostPlayed).map(r  => formatProject(r, likedSet)),
      mostRemixed: withStudioTopUp(mostRemixed).map(r => formatProject(r, likedSet)),
      today: {
        quest: { text: quest.text, prompt: quest.prompt, day: quest.day },
        entries: todayRows.map(r => formatProject(r, likedSet)),
        count: Number(todayCount?.made) || 0,
      },
    });
  } catch (err) {
    console.error('Explore feed error:', err.message);
    res.status(500).json({ error: 'Could not load explore feed.' });
  }
});

// ── POST /api/explore/like/:publicId ─────────────────────────────
router.post('/like/:publicId', optionalAuth, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Please log in to like projects.' });

  const { publicId } = req.params;
  const userId = req.user.user_id;

  try {
    if (findShowcaseProject(publicId)) {
      return res.status(400).json({ error: 'Studio examples are ready to remix instead.' });
    }
    const [rows] = await pool.query(
      'SELECT id FROM ai_projects WHERE public_id = ? AND is_public = 1',
      [publicId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Project not found.' });
    const projectId = rows[0].id;

    const [existing] = await pool.query(
      'SELECT id FROM ai_project_likes WHERE project_id = ? AND user_id = ?',
      [projectId, userId]
    );

    if (existing.length) {
      await pool.query(
        'DELETE FROM ai_project_likes WHERE project_id = ? AND user_id = ?',
        [projectId, userId]
      );
      await pool.query(
        'UPDATE ai_projects SET like_count = GREATEST(like_count - 1, 0) WHERE id = ?',
        [projectId]
      );
      return res.json({ liked: false });
    }

    await pool.query(
      'INSERT INTO ai_project_likes (project_id, user_id) VALUES (?, ?)',
      [projectId, userId]
    );
    await pool.query(
      'UPDATE ai_projects SET like_count = like_count + 1 WHERE id = ?',
      [projectId]
    );
    return res.json({ liked: true });
  } catch (err) {
    console.error('Like error:', err.message);
    res.status(500).json({ error: 'Could not process like.' });
  }
});

module.exports = router;
