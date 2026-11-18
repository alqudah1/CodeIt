'use strict';

// ── What a teacher can see of the Python lessons ────────────────────────────
//
// 18 November 2026, from a Head of Computing whose Year 9 group had just
// spent a lesson on the Python course: "I don't seem to get any progress in
// the classroom for the Python lessons. Should I be able to do this?"
//
// He should, and he could not. The class page showed games and the twelve
// powers. The lessons a class account finishes were recorded all along, like
// anyone's (Student_Lesson_Progress, lesson_step_xp, Student_Quiz_Attempt),
// and no page a teacher can open read them.
//
// Pure: rows in, what the page shows out, so it can be tested without a
// database. The route (routes/class.js) does the reading.

// Student_Lesson_Progress holds the Python lessons (1 to 100) and the powers
// (101 to 112, see powers.js). Lesson 0 in lesson_step_xp is the daily quest.
const FIRST_LESSON = 1;
const LAST_LESSON = 100;
const isLesson = (id) => Number.isInteger(Number(id)) && Number(id) >= FIRST_LESSON && Number(id) <= LAST_LESSON;

const time = (value) => {
  const at = value ? new Date(value).getTime() : NaN;
  return Number.isFinite(at) ? at : 0;
};
const iso = (ms) => (ms ? new Date(ms).toISOString() : null);
/** step_index counts from 0; a teacher counts from 1. */
const stepNumber = (furthest) => (Number.isInteger(Number(furthest)) && Number(furthest) >= 0 ? Number(furthest) + 1 : 1);

/**
 * For the board: each child's lessons in three facts.
 *
 * @param {Array<{user_id, lesson_id, completed_at}>} doneRows  finished lessons
 * @param {Array<{user_id, lesson_id, furthest, at}>} stepRows  the furthest step done, by child and lesson
 * @param {Map<number,string>|Object} titles                    lesson id to title
 * @returns {Map<number, { lessons: number, lastLessonAt: string|null, now: {id, title, step, at}|null }>}
 *   `now` is the lesson a child has started and not finished, the one touched
 *   most recently; null when there is none. `step` is the furthest step they
 *   have done in it, counted from 1. Not how many rows there are: a step that
 *   only explains something is never recorded, so a count would say a child
 *   on step 4 had done two.
 */
function lessonsByChild(doneRows = [], stepRows = [], titles = new Map()) {
  const title = (id) => (titles instanceof Map ? titles.get(Number(id)) : titles[id]) || '';
  const out = new Map();
  const child = (id) => {
    const key = Number(id);
    if (!out.has(key)) out.set(key, { done: new Set(), last: 0, now: null });
    return out.get(key);
  };
  for (const row of doneRows) {
    if (!isLesson(row.lesson_id)) continue;
    const c = child(row.user_id);
    c.done.add(Number(row.lesson_id));
    c.last = Math.max(c.last, time(row.completed_at));
  }
  for (const row of stepRows) {
    if (!isLesson(row.lesson_id)) continue;
    const c = child(row.user_id);
    if (c.done.has(Number(row.lesson_id))) continue;
    const at = time(row.at);
    if (!c.now || at > c.now.at) c.now = { id: Number(row.lesson_id), title: title(row.lesson_id), step: stepNumber(row.furthest), at };
  }
  const shaped = new Map();
  for (const [id, c] of out) {
    shaped.set(id, {
      lessons: c.done.size,
      lastLessonAt: iso(c.last),
      now: c.now ? { ...c.now, at: iso(c.now.at) } : null,
    });
  }
  return shaped;
}

const NOTHING = Object.freeze({ lessons: 0, lastLessonAt: null, now: null });

/**
 * For one child's page: every lesson finished, in order, the one in hand,
 * and the best score in each quiz taken.
 */
function lessonsForChild(doneRows = [], stepRows = [], quizRows = [], titles = new Map()) {
  const title = (id) => (titles instanceof Map ? titles.get(Number(id)) : titles[id]) || '';
  const finished = new Map();
  for (const row of doneRows) {
    if (!isLesson(row.lesson_id)) continue;
    const id = Number(row.lesson_id);
    if (!finished.has(id)) finished.set(id, { id, title: title(id), completedAt: iso(time(row.completed_at)) });
  }
  let now = null;
  for (const row of stepRows) {
    if (!isLesson(row.lesson_id) || finished.has(Number(row.lesson_id))) continue;
    const at = time(row.at);
    if (!now || at > now.at) now = { id: Number(row.lesson_id), title: title(row.lesson_id), step: stepNumber(row.furthest), at };
  }
  const best = new Map();
  for (const row of quizRows) {
    const id = Number(row.quiz_id);
    const right = Number(row.correct_count) || 0;
    const total = Number(row.total_questions) || 0;
    if (!Number.isInteger(id) || total <= 0) continue;
    const had = best.get(id);
    const tries = (had ? had.tries : 0) + 1;
    if (!had || right > had.right) best.set(id, { quizId: id, title: title(id), right, total, at: iso(time(row.completed_at)), tries });
    else had.tries = tries;
  }
  return {
    finished: [...finished.values()].sort((a, b) => a.id - b.id),
    now: now ? { ...now, at: iso(now.at) } : null,
    quizzes: [...best.values()].sort((a, b) => a.quizId - b.quizId),
  };
}

module.exports = { FIRST_LESSON, LAST_LESSON, NOTHING, lessonsByChild, lessonsForChild };
