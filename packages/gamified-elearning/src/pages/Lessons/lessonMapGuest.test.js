import { render, screen, waitFor } from '@testing-library/react';
import LessonMap from './LessonMap';
import { TOTAL_LESSONS } from './lessonRegistry';
import { AuthContext } from '../../context/AuthContext';
import { guestLessonsDone, rememberGuestLesson } from '../../utils/guestLessons';
import { trackLessonCompletion } from '../../utils/progressTracker';

// ── The map forgot a guest ───────────────────────────────────────────────────
//
// A child with no account finished three lessons. The map said "0 / 31 done"
// and stood them on Lesson 1 again, because it only ever asked the server,
// and the server has never heard of a guest. The lessons a guest finishes are
// kept on the device; the map reads them.

jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: React.forwardRef(({ children, to, state, ...props }, ref) =>
      React.createElement('a', { href: to, ref, ...props }, children)),
    useNavigate: () => jest.fn(),
  };
}, { virtual: true });
jest.mock('../Header/Header', () => () => null);
jest.mock('../../utils/progressTracker', () => ({ trackLessonCompletion: jest.fn() }));

const renderMap = (auth) => render(
  <AuthContext.Provider value={auth}>
    <LessonMap />
  </AuthContext.Provider>
);

beforeEach(() => {
  localStorage.clear();
  trackLessonCompletion.mockImplementation(() => Promise.resolve({ success: true }));
});
afterEach(() => { delete global.fetch; });

test('a new guest sees nothing done and no line about where lessons are kept', () => {
  const { container } = renderMap({ token: null, user: null });
  expect(screen.getByText(`0 / ${TOTAL_LESSONS} done`)).toBeInTheDocument();
  expect(container.querySelector('.lm-kept')).toBeNull();
});

test('a guest who finished three lessons sees three done and stands on the fourth', () => {
  rememberGuestLesson(1); rememberGuestLesson(2); rememberGuestLesson(3);
  const { container } = renderMap({ token: null, user: null });
  expect(screen.getByText(`3 / ${TOTAL_LESSONS} done`)).toBeInTheDocument();
  expect(container.querySelectorAll('.lm-stop--completed:not(.lm-stop--castle)').length).toBe(3);
  // Says where they are kept, and what keeps them for good. Nothing is sold.
  const kept = container.querySelector('.lm-kept');
  expect(kept).toHaveTextContent('Kept on this device. A free account keeps them for good.');
  expect(kept.querySelector('a')).toHaveAttribute('href', '/register');
});

test('signed in, the lessons finished here as a guest reach the account before progress is read', async () => {
  rememberGuestLesson(2);
  const order = [];
  trackLessonCompletion.mockImplementation((id) => { order.push(`bank ${id}`); return Promise.resolve({ success: true }); });
  global.fetch = jest.fn((url) => {
    order.push(/progress/.test(url) ? 'read progress' : 'read lessons');
    return Promise.resolve({ ok: true, json: () => Promise.resolve(/progress/.test(url) ? { completedLessons: [1, 2] } : {}) });
  });
  const { container } = renderMap({ token: 'a-token', user: { id: 7, role: 'student' } });
  await waitFor(() => expect(screen.getByText(`2 / ${TOTAL_LESSONS} done`)).toBeInTheDocument());
  expect(order[0]).toBe('bank 2');
  expect(order).toContain('read progress');
  expect(guestLessonsDone()).toEqual([]);
  // An account's lessons are kept by the account: no line about the device.
  expect(container.querySelector('.lm-kept')).toBeNull();
});

// ── "Start" on a lesson already begun ────────────────────────────────────────
//
// The stop a child stands on said "Start" when they were several steps into
// it, on this computer or another. It says "Carry on".
describe('a lesson in hand', () => {
  const badge = (container) => container.querySelector('.lm-badge')?.textContent;

  test('a visitor who has passed a step of Lesson 1 on this device is told to carry on', () => {
    localStorage.setItem('codeit.lesson.1.steps', JSON.stringify({ stepIdx: 2, stepsDone: { 0: true, 1: true }, picks: {}, owner: null }));
    const { container } = renderMap({ token: null, user: null });
    expect(badge(container)).toBe('Carry on');
  });

  test('a visitor who has only opened it is still told to start', () => {
    localStorage.setItem('codeit.lesson.1.steps', JSON.stringify({ stepIdx: 0, stepsDone: {}, picks: {}, owner: null }));
    const { container } = renderMap({ token: null, user: null });
    expect(badge(container)).toBe('Start');
  });

  test('signed in, the server says which lesson is in hand, whatever this computer remembers', async () => {
    global.fetch = jest.fn((url) => Promise.resolve({
      ok: true,
      json: async () => (/progress/.test(url) ? { completedLessons: [1], inHand: { 2: 3 } } : { lessons: [] }),
    }));
    const { container } = renderMap({ token: 't', user: { id: 4, role: 'student' } });
    await waitFor(() => expect(badge(container)).toBe('Carry on'));
    expect(screen.getByText(`1 / ${TOTAL_LESSONS} done`)).toBeInTheDocument();
  });

  test('signed in with nothing in hand, the next lesson says start', async () => {
    global.fetch = jest.fn((url) => Promise.resolve({
      ok: true,
      json: async () => (/progress/.test(url) ? { completedLessons: [1], inHand: {} } : { lessons: [] }),
    }));
    const { container } = renderMap({ token: 't', user: { id: 4, role: 'student' } });
    await waitFor(() => expect(screen.getByText(`1 / ${TOTAL_LESSONS} done`)).toBeInTheDocument());
    expect(badge(container)).toBe('Start');
  });
});
