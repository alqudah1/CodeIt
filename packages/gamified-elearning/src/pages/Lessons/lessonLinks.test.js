import { render, screen, fireEvent } from '@testing-library/react';
import LessonMap from './LessonMap';
import { TOTAL_LESSONS } from './lessonRegistry';
import { AuthContext } from '../../context/AuthContext';

// ── Is there a way in? ───────────────────────────────────────────────────────
//
// Thirty-one lesson pages are generated at build time and all thirty-one are in
// the sitemap, so search engines are told they exist. Nothing on the site
// linked to a single one of them: the cards on /lessons were divs with an
// onClick that called navigate(), and no lesson page linked to any other.
//
// A crawler does not run onClick handlers. Nor does a middle click, or "open in
// new tab", or a child on a train with the connection dropping. A page a
// sitemap declares and nothing links to is a page nothing vouches for.
//
// These tests are about the href existing. Whether a child is *allowed* in is a
// separate question, answered by the gate on the lesson itself, and the last
// test here checks that the gate did not quietly come off.

// react-router-dom is not resolvable under this jest setup, so it is mocked
// the same way the Builder suite mocks it. Link becomes a real anchor, which is
// the whole point of these tests: the href has to survive into the DOM.
jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: React.forwardRef(({ children, to, ...props }, ref) =>
      React.createElement('a', { href: to, ref, ...props }, children)),
    useNavigate: () => jest.fn(),
  };
}, { virtual: true });

jest.mock('../Header/Header', () => () => null);

function renderMap(token = null) {
  return render(
    <AuthContext.Provider value={{ token, user: null }}>
      <LessonMap />
    </AuthContext.Provider>
  );
}

test('every lesson on the map is a real link', () => {
  renderMap();
  const hrefs = [...document.querySelectorAll('a[href^="/lesson/"]')]
    .map(a => a.getAttribute('href'));
  expect(hrefs).toHaveLength(TOTAL_LESSONS);
  expect(hrefs).toContain('/lesson/1');
  expect(hrefs).toContain(`/lesson/${TOTAL_LESSONS}`);
});

test('the locked ones are linked too', () => {
  // A visitor with no account has every lesson but the first locked, and those
  // are exactly the fifteen that were reported as invisible. If only unlocked
  // lessons carried an href, a crawler arriving logged out would find one link.
  renderMap();
  const locked = [...document.querySelectorAll('.lm-card--locked')];
  expect(locked.length).toBeGreaterThan(10);
  for (const card of locked) {
    expect(card.tagName).toBe('A');
    expect(card.getAttribute('href')).toMatch(/^\/lesson\/\d+$/);
  }
});

test('the links are in lesson order, so the chain reads forwards', () => {
  renderMap();
  const ids = [...document.querySelectorAll('a[href^="/lesson/"]')]
    .map(a => Number(a.getAttribute('href').split('/').pop()));
  expect(ids).toEqual([...ids].sort((a, b) => a - b));
});

test('an href is not a way past the gate', () => {
  // The href is for the crawler and the middle click. Tapping a locked lesson
  // must still be refused, and must say why rather than doing nothing.
  renderMap();
  const locked = document.querySelector('.lm-card--locked');
  fireEvent.click(locked);
  expect(screen.getByText(/Complete Lesson \d+ to unlock this one/)).toBeInTheDocument();
});
