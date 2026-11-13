'use strict';

// ── Erasing a learner, completely ───────────────────────────────────────────
//
// A parent can delete their child's managed profile, and a school's privacy
// reviewer will ask what that actually removes. The honest answer, until
// this file, was "most of it".
//
// Thirty tables in this database are keyed to a learner. Twenty of them
// carry a foreign key to Users with ON DELETE CASCADE, so deleting the
// Users row takes them, including the two that matter most: ai_projects,
// which is the child's own work, and understanding_records, which is what
// they answered about it. Seven more were deleted by name in
// familyAccounts.js.
//
// Two were in neither list, because they have no foreign key at all:
//
//   · ai_project_xp_awards  — which project earned this learner what
//   · user_activity_daily   — which days this learner was active
//
// Nothing erred loudly. The delete succeeded, the parent was told it was
// done, and a per-day record of when their child used the site stayed in
// the database. Proven rather than reasoned: seed a row in each, run the
// delete, count what is left.
//
// So the list lives here, in one place, used by every path that erases a
// learner, with a test that reads the schema rather than this list and
// fails when a new table keyed to a learner is not in it.

/**
 * Tables that must be cleared by name, because no foreign key clears them.
 *
 * Everything with ON DELETE CASCADE on Users is deliberately absent: adding
 * it here would be a second, drifting copy of what the schema already
 * guarantees. learnerErasure.pgtest.js is what proves the two lists together
 * cover every table.
 */
const ERASE_BY_NAME = [
  ['student_lesson_progress', 'user_id'],
  ['student_puzzle_progress', 'user_id'],
  ['student_quiz_attempt', 'student_id'],
  ['rewards', 'student_id'],
  ['ai_project_likes', 'user_id'],
  ['analytics_events', 'user_id'],
  ['founding_family_leads', 'user_id'],
];

/**
 * Remove every trace of one learner, inside a transaction the caller owns.
 *
 * The caller checks that it is allowed to do this — a parent for their own
 * managed child, a teacher for a student in their own class — and holds the
 * row lock that makes the check meaningful. This function only erases.
 */
async function eraseLearner(connection, userId) {
  for (const [table, column] of ERASE_BY_NAME) {
    await connection.query(`DELETE FROM ${table} WHERE ${column} = ?`, [userId]);
  }
  // Last, and the one that takes the twenty cascading tables with it.
  await connection.query('DELETE FROM Users WHERE user_id = ?', [userId]);
}

module.exports = { ERASE_BY_NAME, eraseLearner };
