// Lessons finished on this device before there was an account.
//
// A guest can do a whole lesson. Finishing it used to leave nothing behind:
// the completion call needs an account and fails quietly. So a child who
// finished lesson 3, pressed "Start Quiz 3", was told a quiz needs an account
// and made one, came back to a page that said "Complete Lesson 3 first". They
// had, ten minutes ago, on the same screen.
//
// The numbers of the lessons a guest finishes are kept here, on the device and
// nowhere else. The first time a learner is signed in on it, each one is
// handed to the account through the same call a signed-in lesson makes, and
// the list is cleared. The server still decides what a lesson is worth and
// never pays twice.
const KEY = 'codeit.guest.lessons-done';

function read(storage) {
  try {
    const list = JSON.parse(storage.getItem(KEY) || '[]');
    return Array.isArray(list) ? list.map(Number).filter((n) => Number.isInteger(n) && n > 0) : [];
  } catch (e) {
    return [];
  }
}

/** The lessons finished on this device as a guest, lowest first. */
export function guestLessonsDone(storage = window.localStorage) {
  return Array.from(new Set(read(storage))).sort((a, b) => a - b);
}

/** Remember that a guest finished this lesson. */
export function rememberGuestLesson(lessonId, storage = window.localStorage) {
  const id = Number(lessonId);
  if (!Number.isInteger(id) || id <= 0) return;
  try {
    storage.setItem(KEY, JSON.stringify(Array.from(new Set([...read(storage), id])).sort((a, b) => a - b)));
  } catch (e) { /* a device that cannot save loses the head start, not the lesson */ }
}

let banking = null;

/**
 * Hand every remembered lesson to the account that is now signed in. `complete`
 * is the call a signed-in lesson makes. One that fails stays on the list for
 * next time. Resolves to the lessons that were banked. Safe to call twice at
 * once: the second caller waits for the first.
 */
export function bankGuestLessons(complete, storage = window.localStorage) {
  if (banking) return banking;
  const waiting = guestLessonsDone(storage);
  if (!waiting.length) return Promise.resolve([]);
  banking = (async () => {
    const banked = [];
    const left = [];
    for (const id of waiting) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await complete(id);
        banked.push(id);
      } catch (e) {
        left.push(id);
      }
    }
    try {
      if (left.length) storage.setItem(KEY, JSON.stringify(left));
      else storage.removeItem(KEY);
    } catch (e) { /* nothing to tidy on a device that cannot save */ }
    return banked;
  })().finally(() => { banking = null; });
  return banking;
}

export const GUEST_LESSONS_KEY = KEY;
