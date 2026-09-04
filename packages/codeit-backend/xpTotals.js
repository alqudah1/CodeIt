'use strict';

// ── One definition of a learner's XP ─────────────────────────────────────────
//
// Three places used to add up a child's XP, and no two agreed. The leaderboard
// summed five tables; the journey map summed four of them and left out the
// lesson steps; the header and the profile read a stats object from an
// endpoint that did not exist and showed nothing at all. A child could be on
// one number in the ranking and another on their own map.
//
// This is the sum. Everything that shows a total reads it from here.
//
// ── What the numbers say we value ────────────────────────────────────────────
//
// Our own parent guide argues, in public, that "lessons completed and levels
// cleared are attendance records. They say the child was present. They do not
// say what the child could do with their own program." If the XP paid most
// for opening things, we would be the product that page criticises.
//
// So the biggest single award is for a first-attempt-correct answer to a
// question generated from the learner's OWN file: the one signal we collect
// that means anything, and the one no competitor can copy without rebuilding
// their product. Everything else is visibly smaller, so that a child can tell,
// from the numbers alone, what this thing actually values.
//
//   explained a line of their own code, first try     50 each
//   made a project / published a project              25 each (projectRewards.js)
//   finished a lesson                                 the lesson's own value
//   a quiz question right                             10 (routes/quiz.js)
//   a lesson step                                     5 to 20 (stepXp.js)
//
// Nothing is paid for time on the page, for opening a lesson, for logging in
// on consecutive days, or for a click.
const UNDERSTANDING_XP = 50;

// Per-user total. `?` placeholders, one per table, in this order.
const TOTAL_XP_SQL = `
  COALESCE((SELECT SUM(best_xp) FROM (
      SELECT MAX(xp_earned) AS best_xp FROM Student_Quiz_Attempt
       WHERE student_id = ? GROUP BY quiz_id) quiz_best), 0) +
  COALESCE((SELECT SUM(best_xp) FROM (
      SELECT MAX(xp_earned) AS best_xp FROM Student_Lesson_Progress
       WHERE user_id = ? GROUP BY lesson_id) lesson_best), 0) +
  COALESCE((SELECT SUM(xp_earned) FROM lesson_step_xp WHERE user_id = ?), 0) +
  COALESCE((SELECT SUM(best_xp) FROM (
      SELECT MAX(xp_earned) AS best_xp FROM Student_Puzzle_Progress
       WHERE user_id = ? GROUP BY puzzle_id) puzzle_best), 0) +
  COALESCE((SELECT SUM(xp_earned) FROM ai_project_xp_awards WHERE user_id = ?), 0) +
  COALESCE((SELECT SUM(jsonb_array_length(skills)) * ${UNDERSTANDING_XP}
              FROM understanding_records WHERE user_id = ?), 0)
`;
const TOTAL_XP_PARAMS = 6;

async function totalXpFor(pool, userId) {
  const [[row]] = await pool.query(
    `SELECT (${TOTAL_XP_SQL}) AS total_xp`,
    Array.from({ length: TOTAL_XP_PARAMS }, () => userId)
  );
  return Number(row?.total_xp) || 0;
}

// The same sum as a LEFT JOIN block, for queries that rank every learner at
// once. `u` must be the Users alias in the outer query.
const UNDERSTANDING_XP_JOIN = `
  LEFT JOIN (
    SELECT user_id, SUM(jsonb_array_length(skills)) * ${UNDERSTANDING_XP} AS understanding_xp
    FROM understanding_records
    GROUP BY user_id
  ) ux ON ux.user_id = u.user_id`;

module.exports = { UNDERSTANDING_XP, TOTAL_XP_SQL, TOTAL_XP_PARAMS, totalXpFor, UNDERSTANDING_XP_JOIN };
