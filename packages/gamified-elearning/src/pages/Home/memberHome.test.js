import { render, screen } from '@testing-library/react';
import MemberHome from './MemberHome';

// ── The signed-in home is a shelf, not a landing page (rounds 66 and 67) ────
//
//   - Their stuff, big, running, first.
//   - Avatar and level visible beside it.
//   - Three live starter games when the shelf is empty.
//   - No headline question, no paragraph, two text links at most.

jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: ({ children, to, onClick, ...props }) => React.createElement('a', { href: to, onClick, ...props }, children),
    useNavigate: () => jest.fn(),
    useLocation: () => ({ pathname: '/' }),
  };
}, { virtual: true });
jest.mock('../Header/Header', () => () => null);
jest.mock('./RecentProjects', () => () => null);
jest.mock('../../utils/trackEvent', () => ({ trackEvent: jest.fn() }));

const user = { id: 3, name: 'David' };

function show(props = {}) {
  return render(<MemberHome user={user} token="t" shelf={[]} latestProject={null} {...props} />);
}

test('day one: three starters run live on the shelf, at the size their own project will appear at', () => {
  show();
  expect(screen.getByText('Pick one and it is yours')).toBeInTheDocument();
  const frames = document.querySelectorAll('.shelf iframe');
  expect(frames).toHaveLength(3);
  for (const f of frames) {
    expect(f.getAttribute('sandbox')).toBe('allow-scripts');
    expect(f.getAttribute('srcdoc')).toMatch(/<canvas|<script/);
  }
  // And the row below offers different games, not the same three again.
  const shelfLinks = [...document.querySelectorAll('.shelf a')].map((a) => a.getAttribute('href'));
  const rowLinks = [...document.querySelectorAll('.member__picks a')].map((a) => a.getAttribute('href'));
  expect(rowLinks).toHaveLength(3);
  for (const href of rowLinks) expect(shelfLinks).not.toContain(href);
});

test('no headline question, no paragraph', () => {
  show();
  const h1 = screen.getByRole('heading', { level: 1 });
  expect(h1.textContent).not.toMatch(/\?/);
  expect(h1.textContent).toMatch(/Welcome back, David/);
  expect(document.querySelectorAll('main p')).toHaveLength(0);
});

test('two text links at most', () => {
  show();
  expect(document.querySelectorAll('.studio-hero__textlink')).toHaveLength(2);
});

test('the avatar is at size, with the level and what unlocks next beside it', () => {
  show();
  const you = document.querySelector('.member__you');
  expect(you).not.toBeNull();
  expect(you.querySelector('svg')).not.toBeNull();
  expect(you.textContent).toMatch(/Level \d/);
  expect(you.textContent).toMatch(/XP to level \d/);
  expect(you.querySelector('.member__bar-fill')).not.toBeNull();
});

test('every game card on the page shows the game running', () => {
  show();
  for (const card of document.querySelectorAll('.member__pick')) {
    expect(card.querySelector('iframe')).not.toBeNull();
  }
});

test('a saved project on the account runs on the shelf once its code arrives', async () => {
  global.fetch = jest.fn(() => Promise.resolve({
    ok: true,
    json: async () => ({ success: true, project: { id: 42, title: 'Mission Control Quiz', generated_code: '<!doctype html><html><body><script>var x=1;</script></body></html>', project_type: 'quiz', updated_at: '2026-09-01T00:00:00Z' } }),
  }));
  show({ latestProject: { id: 42, title: 'Mission Control Quiz' } });
  expect(await screen.findByText('Your project is here')).toBeInTheDocument();
  const hero = document.querySelector('.shelf__hero');
  expect(hero.getAttribute('href')).toBe('/builder?project=42');
  expect(hero.querySelector('iframe').getAttribute('srcdoc')).toMatch(/var x=1/);
  // The guest note about "make a free account" is not shown to an account.
  expect(screen.queryByText(/Make a free account/)).not.toBeInTheDocument();
  delete global.fetch;
});
