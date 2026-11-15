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
