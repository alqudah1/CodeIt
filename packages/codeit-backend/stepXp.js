'use strict';

// ── XP for a step inside a lesson ────────────────────────────────────────────
//
// The browser asks for an amount, but the browser is not trusted: anyone can
// open dev tools and post {xp: 999999} at this endpoint. Two things keep that
// harmless.
//
// First, the amount is clamped to what a real step is worth. The lesson types
// pay 5 (watch it run) to 20 (challenge), so anything outside 5..20 is either a
// bug or an attempt, and either way it becomes 10.
//
// Second, and more importantly, a step pays once. The unique constraint on
// (user_id, lesson_id, step_index) means replaying a step, refreshing, or
// firing a thousand requests all collapse to one row. The ceiling on what a
// student can earn is therefore the number of steps that actually exist, not
// the number of requests they can send.

const MIN_STEP_XP = 5;
const MAX_STEP_XP = 20;
const DEFAULT_STEP_XP = 10;

// A lesson with more steps than this is a data error, not a curriculum.
const MAX_STEP_INDEX = 40;

function clampStepXp(requested) {
  // null and '' both become 0 under Number(), which would silently clamp to the
  // minimum and look like a deliberate five-XP step. A missing value is missing,
  // not zero.
  if (requested === null || requested === undefined || requested === '') return DEFAULT_STEP_XP;
  const value = Number(requested);
  if (!Number.isFinite(value)) return DEFAULT_STEP_XP;
  const whole = Math.round(value);
  if (whole < MIN_STEP_XP) return MIN_STEP_XP;
  if (whole > MAX_STEP_XP) return MAX_STEP_XP;
  return whole;
}

// Accepts a whole number however it arrived — a JSON client may send 3 or "3" —
// but nothing else. An empty or absent value is not step zero.
function isValidStepIndex(stepIndex) {
  if (stepIndex === null || stepIndex === undefined || stepIndex === '') return false;
  const value = Number(stepIndex);
  return Number.isInteger(value) && value >= 0 && value <= MAX_STEP_INDEX;
}

/**
 * Bank XP for one step, once.
 *
 * Returns { xpEarned } — zero when this step was already paid for, so the
 * lesson can tell the difference between "well done" and "you did this before"
 * without guessing.
 */
async function awardStepXp(userId, lessonId, stepIndex, requestedXp) {
  if (!isValidStepIndex(stepIndex)) return { xpEarned: 0, alreadyEarned: false };
  const xp = clampStepXp(requestedXp);

  // Required here rather than at module load: the clamping rules above are pure
  // and worth testing without a database connection or a full env.
  const pool = require('./db');

  const [result] = await pool.query(
    `INSERT INTO lesson_step_xp (user_id, lesson_id, step_index, xp_earned)
     VALUES (?, ?, ?, ?)
     ON CONFLICT (user_id, lesson_id, step_index) DO NOTHING`,
    [userId, lessonId, stepIndex, xp]
  );

  if (result.affectedRows === 0) return { xpEarned: 0, alreadyEarned: true };

  // Students carry a running total used by the header and level bar. A learner
  // account that is not a student row simply has no total to bump — the
  // lesson_step_xp row is still the record, so nothing is lost.
  await pool.query(
    'UPDATE Students SET total_xp = total_xp + ? WHERE user_id = ?',
    [xp, userId]
  ).catch(error => console.error('Step XP total update failed:', error.message));

  return { xpEarned: xp, alreadyEarned: false };
}

module.exports = {
  DEFAULT_STEP_XP,
  MAX_STEP_INDEX,
  MAX_STEP_XP,
  MIN_STEP_XP,
  awardStepXp,
  clampStepXp,
  isValidStepIndex,
};
