// Lessons a guest finished go with them when they make an account.
import { GUEST_LESSONS_KEY, bankGuestLessons, guestLessonsDone, rememberGuestLesson } from './guestLessons';

beforeEach(() => localStorage.clear());

test('a finished lesson is remembered on the device, once, in order', () => {
  rememberGuestLesson(3); rememberGuestLesson(1); rememberGuestLesson('3'); rememberGuestLesson('frog'); rememberGuestLesson(0);
  expect(guestLessonsDone()).toEqual([1, 3]);
  expect(JSON.parse(localStorage.getItem(GUEST_LESSONS_KEY))).toEqual([1, 3]);
});

test('a list somebody has scribbled on is treated as empty, not as a crash', () => {
  localStorage.setItem(GUEST_LESSONS_KEY, '{not json');
  expect(guestLessonsDone()).toEqual([]);
  localStorage.setItem(GUEST_LESSONS_KEY, JSON.stringify({ a: 1 }));
  expect(guestLessonsDone()).toEqual([]);
});

test('signing in hands each one to the account, and the device forgets them', async () => {
  rememberGuestLesson(1); rememberGuestLesson(3);
  const complete = jest.fn(() => Promise.resolve({ success: true }));
  await expect(bankGuestLessons(complete)).resolves.toEqual([1, 3]);
  expect(complete.mock.calls).toEqual([[1], [3]]);
  expect(guestLessonsDone()).toEqual([]);
  // Nothing left, so nothing is sent the next time.
  await expect(bankGuestLessons(complete)).resolves.toEqual([]);
  expect(complete).toHaveBeenCalledTimes(2);
});

test('one that could not be saved stays for next time; the others are not sent again', async () => {
  rememberGuestLesson(1); rememberGuestLesson(2); rememberGuestLesson(3);
  const complete = jest.fn((id) => (id === 2 ? Promise.reject(new Error('offline')) : Promise.resolve({})));
  await expect(bankGuestLessons(complete)).resolves.toEqual([1, 3]);
  expect(guestLessonsDone()).toEqual([2]);
});

test('two pages asking at the same moment send each lesson once', async () => {
  rememberGuestLesson(4);
  const complete = jest.fn(() => new Promise((resolve) => setTimeout(resolve, 5)));
  const [a, b] = await Promise.all([bankGuestLessons(complete), bankGuestLessons(complete)]);
  expect(complete).toHaveBeenCalledTimes(1);
  expect(a).toEqual([4]);
  expect(b).toEqual([4]);
});
