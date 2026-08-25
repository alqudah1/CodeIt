import { API_BASE_URL } from '../config/api';

// ── Which lessons end in a quiz, and which just end ──────────────────────────
//
// The curriculum grew from 16 lessons to 31 and the questions did not. Quizzes
// 17 to 31 have no rows in the database, so every one of those lessons finished
// with a button reading "Complete Lesson. Unlock Quiz 17" that led to a page
// saying "No questions found for this quiz".
//
// That is fifteen lessons — half the course — ending in a wall, at the exact
// moment a child has just finished half an hour of work and is owed something.
// Worse, the wall reads like they broke it.
//
// So the frontend asks which quizzes exist and offers the next lesson instead
// when there is no quiz to offer.
//
// ── Why "we do not know" is a real answer ────────────────────────────────────
//
// The three states here are not two. `null` means the question has not been
// answered — the request is in flight, or it failed — and it is deliberately
// NOT the same as "there is no quiz".
//
// If a failed request read as "no quiz", a network blip would silently hide the
// quizzes that do exist from the sixteen lessons that have them. Hiding
// something real is worse than showing something empty, so unknown behaves like
// "probably yes" at the call sites.

let cache = null;          // null = not known yet, array = the ids that exist
let inFlight = null;

/**
 * The quiz ids that have questions, or null if we could not find out.
 *
 * Cached for the page's lifetime. The set changes only when someone writes
 * questions into the database, which is not something that happens while a
 * child is reading a lesson.
 */
async function loadQuizIds() {
  if (cache !== null) return cache;
  if (inFlight) return inFlight;

  inFlight = fetch(`${API_BASE_URL}/api/quiz/available`)
    .then(res => (res.ok ? res.json() : null))
    .then(data => {
      const ids = data && Array.isArray(data.quizIds) ? data.quizIds : null;
      cache = ids;
      return ids;
    })
    .catch(() => null)
    .finally(() => { inFlight = null; });

  return inFlight;
}

/**
 * Does this lesson have a quiz?
 *
 * Returns true when we know it does, false when we know it does not, and true
 * when we do not know — because offering a quiz that turns out to be empty is a
 * smaller harm than hiding one that is really there.
 */
function hasQuiz(quizIds, lessonId) {
  if (!Array.isArray(quizIds)) return true;      // not known: do not hide it
  return quizIds.includes(Number(lessonId));
}

/** Forget what we learned. Tests only. */
function resetQuizCache() {
  cache = null;
  inFlight = null;
}

export { hasQuiz, loadQuizIds, resetQuizCache };
