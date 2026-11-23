// ── Where a lesson was left, and whose place it is ──────────────────────────
//
// A lesson remembers its place in the browser so a refresh does not send a
// child back to step 1. Two things were wrong with only that (a teacher's
// question, 22 November 2026: on another computer do pupils "not have any
// progress"?).
//
// 1. The place belonged to the computer, not the child. In a computer room
//    the next pupil to open Lesson 1 found it at the last pupil's step, with
//    the last pupil's steps ticked. The place now carries whose it is, and
//    is only given back to them.
//
// 2. On another computer there was no place at all. The server already holds
//    one row for every step a signed-in learner passes, so the lesson asks
//    for them (GET /api/lessons/:id/steps) and opens where they stopped.
//
// A visitor's place is still the browser's: there is nowhere else to keep it.

export const stepStateKey = (lessonId) => `codeit.lesson.${lessonId}.steps`;

// Who is signed in, read where the session is kept, because the first render
// happens before the session has been handed to the page.
export function signedInId(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  try {
    if (!storage || !storage.getItem('token')) return null;
    const user = JSON.parse(storage.getItem('user') || 'null');
    const id = Number(user?.id ?? user?.user_id);
    return Number.isInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

/**
 * The saved place, if it is this person's.
 *
 *   - Saved by this account: theirs.
 *   - Saved by a visitor, read by a visitor: theirs.
 *   - Saved by a visitor, read by an account: theirs. That is the child who
 *     started as a visitor and then joined the class on the same computer.
 *   - Saved by one account, read by another, or by a visitor after that
 *     account signed out: not theirs.
 *   - Saved before places carried a name: a visitor may have it, an account
 *     may not. An account's own steps are on the server; a place nobody
 *     signed is as likely to be the last pupil's.
 */
export function loadStepState(lessonId, userId, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  try {
    const raw = storage.getItem(stepStateKey(lessonId));
    const saved = raw ? JSON.parse(raw) : null;
    if (!saved || typeof saved !== 'object') return null;
    const unsigned = !Object.prototype.hasOwnProperty.call(saved, 'owner');
    const owner = unsigned || saved.owner == null ? null : Number(saved.owner);
    if (userId) {
      if (unsigned) return null;
      if (owner !== null && owner !== Number(userId)) return null;
    } else if (owner !== null) {
      return null;
    }
    return {
      stepIdx:   Number(saved.stepIdx) || 0,
      stepsDone: saved.stepsDone && typeof saved.stepsDone === 'object' ? saved.stepsDone : {},
      picks:     saved.picks && typeof saved.picks === 'object' ? saved.picks : {},
    };
  } catch {
    // Private browsing, a full quota, a corrupted value: none of which should
    // stop the lesson from opening.
    return null;
  }
}

export function saveStepState(lessonId, state, userId, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  try {
    storage.setItem(stepStateKey(lessonId), JSON.stringify({ ...state, owner: userId || null }));
  } catch {
    // Nothing to do: this is a convenience, not the record.
  }
}

/**
 * What the server's list of passed steps means for a lesson of `total` steps.
 *
 * The server only hears about the steps that are answered (a step that is
 * only read is not sent), and a step cannot be reached without passing the
 * ones before it, so everything up to the furthest answered step is done.
 * The lesson opens on the step after it.
 */
export function placeFromServer(steps, total) {
  const passed = (Array.isArray(steps) ? steps : [])
    .map(Number)
    .filter((n) => Number.isInteger(n) && n >= 0 && n < total);
  if (!passed.length || total < 1) return null;
  const furthest = Math.max(...passed);
  const stepsDone = {};
  for (let i = 0; i <= furthest; i += 1) stepsDone[i] = true;
  return { stepIdx: Math.min(furthest + 1, total - 1), stepsDone };
}
