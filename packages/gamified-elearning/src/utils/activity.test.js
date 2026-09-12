import {
  ACTIVITY_COMPLETIONS, ACTIVITY_STARTS, resetActivityMemory,
  trackActivityComplete, trackActivityStart, trackGuestLessonComplete,
} from './activity';
import { trackEvent } from './trackEvent';

jest.mock('./trackEvent', () => ({ trackEvent: jest.fn(() => Promise.resolve(true)) }));

// ── Did a family actually use it (12 September 2026) ─────────────────────────

beforeEach(() => { sessionStorage.clear(); localStorage.clear(); resetActivityMemory(); trackEvent.mockReset(); trackEvent.mockResolvedValue(true); });

test('an engaged start is sent once per session, however many times it happens', async () => {
  expect(await trackActivityStart('python-run')).toBe(true);
  expect(await trackActivityStart('python-run')).toBe(false);
  expect(await trackActivityStart('python-run')).toBe(false);
  expect(await trackActivityStart('game-play')).toBe(true);
  expect(trackEvent.mock.calls).toEqual([
    ['activity_start', 'python-run', null],
    ['activity_start', 'game-play', null],
  ]);
});

test('a completion is sent once per activity per session', async () => {
  expect(await trackActivityComplete('python-change-message', 't')).toBe(true);
  expect(await trackActivityComplete('python-change-message', 't')).toBe(false);
  expect(await trackActivityComplete('game-changed-tested')).toBe(true);
  expect(trackEvent).toHaveBeenCalledTimes(2);
  expect(trackEvent).toHaveBeenCalledWith('activity_complete', 'python-change-message', 't');
});

test('only allowlisted words leave the browser: never a lesson title, a prompt or a message', async () => {
  expect(await trackActivityStart('print("my secret")')).toBe(false);
  expect(await trackActivityComplete('lesson-7')).toBe(false);
  expect(trackEvent).not.toHaveBeenCalled();
  expect(ACTIVITY_STARTS).toEqual(['python-run', 'game-play']);
  expect(ACTIVITY_COMPLETIONS).toEqual(['python-first-run', 'python-change-message', 'game-changed-tested']);
});

test('a guest lesson completion is sent for guests only, once per lesson, with no meta', async () => {
  expect(await trackGuestLessonComplete(1, 'a-token')).toBe(false);
  expect(await trackGuestLessonComplete(1, null)).toBe(true);
  expect(await trackGuestLessonComplete(1, null)).toBe(false);
  expect(await trackGuestLessonComplete(2, null)).toBe(true);
  expect(await trackGuestLessonComplete('nope', null)).toBe(false);
  expect(trackEvent.mock.calls).toEqual([
    ['guest_lesson_complete', null, null],
    ['guest_lesson_complete', null, null],
  ]);
});

test('memory lives in sessionStorage only: nothing persistent, nothing across tabs', async () => {
  await trackActivityStart('python-run');
  expect(Object.keys(sessionStorage).some((k) => k.startsWith('codeit_activity:'))).toBe(true);
  expect(Object.keys(localStorage)).toEqual([]);
  expect(document.cookie).toBe('');
});
