import { addSeconds, minutesToday, trackMinutes, secondsToday } from './minutesToday';

test('seconds add up under today, and yesterday is dropped', () => {
  localStorage.clear();
  const yesterday = Date.UTC(2026, 10, 1, 12), today = Date.UTC(2026, 10, 2, 12);
  addSeconds(localStorage, 600, yesterday);
  expect(minutesToday(localStorage, yesterday)).toBe(10);
  addSeconds(localStorage, 90, today);
  expect(minutesToday(localStorage, today)).toBe(1);
  expect(secondsToday(localStorage, yesterday)).toBe(0);
  expect(minutesToday(null)).toBe(0);
});

test('only visible time counts', () => {
  jest.useFakeTimers();
  localStorage.clear();
  const doc = { visibilityState: 'visible', listeners: {}, addEventListener(e, f) { this.listeners[e] = f; }, removeEventListener() {} };
  const stop = trackMinutes(localStorage, doc, window);
  jest.advanceTimersByTime(45 * 1000);
  expect(secondsToday(localStorage)).toBe(45);
  doc.visibilityState = 'hidden'; doc.listeners.visibilitychange();
  jest.advanceTimersByTime(60 * 1000);
  expect(secondsToday(localStorage)).toBe(45);
  doc.visibilityState = 'visible'; doc.listeners.visibilitychange();
  jest.advanceTimersByTime(15 * 1000);
  expect(secondsToday(localStorage)).toBe(60);
  stop();
  jest.useRealTimers();
});
