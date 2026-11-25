// A quiz a visitor finished, kept until there is an account to save it to.
//
// A visitor can take a quiz now (before 25 November 2026 it was a page that
// said it needs an account). The score a visitor sees is real: every answer
// was checked by the server one at a time. What a visitor does not have is
// anywhere to keep it. So the answers wait here, on the device, and the first
// time the quiz is opened signed in they are handed to the account through
// the same call a signed-in quiz makes. The server marks them again and
// decides the XP; nothing here is trusted.
//
// One quiz at a time, and not for long: on a shared computer a score left
// behind by one child must not turn up on the next child's account.
const KEY = 'codeit.guest.quiz';
export const KEEP_FOR_MS = 60 * 60 * 1000;

export function rememberGuestQuiz(quizId, answers, now = Date.now(), storage = window.localStorage) {
  const id = Number(quizId);
  if (!Number.isInteger(id) || id <= 0 || !answers || typeof answers !== 'object') return;
  try { storage.setItem(KEY, JSON.stringify({ quizId: id, answers, at: now })); } catch (e) { /* the score is still on screen */ }
}

/** The waiting answers for this quiz, or null. Anything old or for another quiz is not it. */
export function waitingGuestQuiz(quizId, now = Date.now(), storage = window.localStorage) {
  try {
    const saved = JSON.parse(storage.getItem(KEY) || 'null');
    if (!saved || Number(saved.quizId) !== Number(quizId)) return null;
    if (!Number.isFinite(saved.at) || now - saved.at > KEEP_FOR_MS || now < saved.at) return null;
    if (!saved.answers || typeof saved.answers !== 'object') return null;
    return saved.answers;
  } catch (e) {
    return null;
  }
}

export function forgetGuestQuiz(storage = window.localStorage) {
  try { storage.removeItem(KEY); } catch (e) { /* nothing to tidy */ }
}
