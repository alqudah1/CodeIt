import { render, screen, waitFor } from '@testing-library/react';
import KidHome, { xpPercent } from './KidHome';
import { streakFrom, levelFor, questFor } from './today';

// ── What do I do today ──────────────────────────────────────────────────────
//
// The page shows one quest, a streak, XP, the last games. Every number comes
// from the server for a signed-in child and from the shelf for a guest, and
// nothing on it is invented: a guest sees 0 XP and the honest reason.

jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: ({ children, to, ...props }) => React.createElement('a', { href: to, ...props }, children),
    NavLink: ({ children, to }) => React.createElement('a', { href: to }, children),
  };
}, { virtual: true });
jest.mock('../Header/Header', () => () => null);
jest.mock('../../config/api', () => ({ API_BASE_URL: 'http://codeit.test' }));
jest.mock('../../hooks/useSEO', () => ({ useSEO: jest.fn() }));
// The Python editor (CodeMirror) prints line numbers, which collide with the streak digits below.
jest.mock('../../components/CodeRunnerPython', () => () => null);
jest.mock('../../context/CharacterContext', () => ({ useCharacterDisplay: () => ({ character: {} }) }));

jest.mock('../../context/AuthContext', () => {
  const React = require('react');
  return { AuthContext: React.createContext({ user: null, token: null }) };
});
const { AuthContext } = require('../../context/AuthContext');
const mount = (auth) => render(<AuthContext.Provider value={auth}><KidHome /></AuthContext.Provider>);

beforeEach(() => { localStorage.clear(); });

test('the streak rule matches the server: weekends never break it, yesterday keeps it alive', () => {
  const mon = '2026-10-19T12:00:00Z';
  expect(streakFrom(['2026-10-16T12:00:00Z', '2026-10-19T09:00:00Z'], mon).streak).toBe(2);
  expect(streakFrom(['2026-10-20T16:00:00Z', '2026-10-19T10:00:00Z'], '2026-10-21T15:00:00Z')).toEqual({ streak: 2, builtToday: false });
  expect(streakFrom([], mon).streak).toBe(0);
  expect(levelFor(420)).toMatchObject({ n: 2, title: 'Explorer', toNext: 80 });
  expect(xpPercent(levelFor(420))).toBeCloseTo(((420 - 200) / (500 - 200)) * 100);
  expect(questFor('2026-10-21T08:00:00Z').text).toBe(questFor('2026-10-21T23:00:00Z').text);
});

test('a guest sees today\'s quest, a streak from the shelf, 0 XP with the honest reason, and the shelf games', async () => {
  global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ signedIn: false, quest: { text: 'Shoot the asteroids.', prompt: 'a ship that shoots asteroids' } }) }));
  const today = Date.now();
  localStorage.setItem('codeit.shelf.v1', JSON.stringify([{ id: 'pabc', title: 'Star Dodge', prompt: 'x', projectType: 'game', code: '<!DOCTYPE html><html><body><canvas id="screen"></canvas><script>let a = 1;</script></body></html>', savedAt: today, updatedAt: today }]));
  mount({ user: null, token: null });
  expect(await screen.findByText('Done. Build another?')).toBeInTheDocument();
  // The streak, in the panel tile and in the HUD chip.
  expect(document.querySelector('.pp-panel__tile--streak .ci-num').textContent).toBe('1');
  expect(document.querySelector('.kh__chip--streak').textContent.trim()).toBe('1');
  // The shelf game counts as today's game goal; the other two need an account.
  expect(document.querySelectorAll('.kh__badge.is-done')).toHaveLength(1);
  expect(screen.getByText('0 XP. Make an account to keep it.')).toBeInTheDocument();
  expect(screen.getByText('Star Dodge')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Keep your games for good/ })).toHaveAttribute('href', '/register');
});

test('a signed-in child sees the server\'s numbers and the quest opens Build pre-typed', async () => {
  global.fetch = jest.fn((url) => {
    if (String(url).endsWith('/api/today')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ signedIn: true, quest: { text: 'Catch carrots at night.', prompt: 'a bunny that catches carrots at night' }, streak: 3, builtToday: false, level: { n: 2, title: 'Explorer', xp: 420, next: 500, toNext: 80 }, games: [{ id: 7, title: 'Carrot Rain', type: 'game', publicId: 'pub7', plays: 7 }], plays: 12 }) });
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ project: { generated_code: '<!DOCTYPE html><html><body>game</body></html>' } }) });
  });
  mount({ user: { name: 'Maya Q' }, token: 't' });
  expect(await screen.findByText('Catch carrots at night.')).toBeInTheDocument();
  expect(screen.getByText('Hey Maya.')).toBeInTheDocument();
  expect(document.querySelector('.pp-panel__tile--streak .ci-num').textContent).toBe('3');
  expect(document.querySelector('.kh__chip--streak').textContent.trim()).toBe('3');
  expect(document.querySelector('.kh__chip--xp').textContent.trim()).toBe('420');
  expect(document.querySelector('.kh__hud-lv').textContent).toBe('2');
  expect(document.querySelector('.kh__goals-count').textContent).toBe('0/3');
  expect(screen.getByText('420 / 500 XP')).toBeInTheDocument();
  expect(screen.getByText('Level 2')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Build it' })).toHaveAttribute('href', '/build?prompt=a%20bunny%20that%20catches%20carrots%20at%20night');
  await waitFor(() => expect(document.querySelector('.kh__tile iframe')).not.toBeNull());
  expect(screen.getByText('7 plays')).toBeInTheDocument();
  expect(screen.getByText('12 plays')).toBeInTheDocument();
});

test('with a game of their own, the page is marked so a phone puts the examples after it; with none, the examples stay up top', async () => {
  global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ signedIn: false, quest: { text: 'Shoot the asteroids.', prompt: 'x' } }) }));
  const first = mount({ user: null, token: null });
  await screen.findByText('Ideas to build');
  expect(first.container.querySelector('.kh')).not.toHaveClass('kh--has-games');
  first.unmount();

  const now = Date.now();
  localStorage.setItem('codeit.shelf.v1', JSON.stringify([{ id: 'pabc', title: 'Bunny Catch', prompt: 'x', projectType: 'game', code: '<!DOCTYPE html><html><body><canvas id="screen"></canvas><script>let a = 1;</script></body></html>', savedAt: now, updatedAt: now }]));
  const second = mount({ user: null, token: null });
  await screen.findByText('More to try');
  expect(second.container.querySelector('.kh')).toHaveClass('kh--has-games');
  expect(second.container.querySelector('.kh__examples')).not.toBeNull();
});

test('a game nobody has played yet says nothing about plays, and one play is one play', async () => {
  global.fetch = jest.fn((url) => {
    if (String(url).endsWith('/api/today')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ signedIn: true, quest: { text: 'Q.', prompt: 'q' }, streak: 1, builtToday: true, level: { n: 1, title: 'Beginner', xp: 0, next: 200, toNext: 200 }, games: [{ id: 1, title: 'Bunny Catch', plays: 0 }, { id: 2, title: 'Star Rain', plays: 1 }] }) });
    return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
  });
  mount({ user: { name: 'sam_k5myi' }, token: 't' });
  expect(await screen.findByText('Bunny Catch')).toBeInTheDocument();
  expect(screen.queryByText('0 plays')).toBeNull();
  expect(screen.getByText('1 play')).toBeInTheDocument();
});
