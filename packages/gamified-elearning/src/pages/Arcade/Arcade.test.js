import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Arcade, { ordinal, rankGames } from './Arcade';

// ── The arcade ──────────────────────────────────────────────────────────────
//
// In a class: the room's published games ranked by plays, this week or all
// time, the child's rows lit and their rank said in one line. No class: the
// public feed in the same shape, with the door to /join.

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const React = require('react');
  return { Link: ({ children, to, ...props }) => React.createElement('a', { href: to, ...props }, children), useNavigate: () => mockNavigate };
}, { virtual: true });
jest.mock('../Header/Header', () => () => null);
jest.mock('../../config/api', () => ({ API_BASE_URL: 'http://codeit.test' }));
jest.mock('../../hooks/useSEO', () => ({ useSEO: jest.fn() }));
jest.mock('../../context/AuthContext', () => { const React = require('react'); return { AuthContext: React.createContext({ user: null, token: null }) }; });
const { AuthContext } = require('../../context/AuthContext');
const mount = (auth) => render(<AuthContext.Provider value={auth}><Arcade /></AuthContext.Provider>);
const now = new Date().toISOString(); const old = '2026-01-01T00:00:00Z';

test('ranks and ordinals', () => {
  expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 101].map(ordinal)).toEqual(['1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd', '101st']);
  const games = [{ id: 1, plays: 2, thisWeek: true, createdAt: now }, { id: 2, plays: 9, thisWeek: false, createdAt: old }, { id: 3, plays: 2, thisWeek: true, createdAt: old }];
  expect(rankGames(games, 'all').map((g) => [g.id, g.rank])).toEqual([[2, 1], [1, 2], [3, 3]]);
  expect(rankGames(games, 'week').map((g) => g.id)).toEqual([1, 3]);
});

test('a child in a class sees the room ranked, their own row lit, and their rank', async () => {
  global.fetch = jest.fn((url) => {
    const u = String(url);
    if (u.endsWith('/api/class/joined')) return Promise.resolve({ ok: true, status: 200, json: async () => ({ ready: true, classes: [{ code: 'ROCKET42', name: 'Year 5' }] }) });
    if (u.endsWith('/api/class/ROCKET42/arcade')) return Promise.resolve({ ok: true, status: 200, json: async () => ({ ready: true, class: { code: 'ROCKET42', name: 'Year 5' }, me: 9, games: [
      { id: 1, userId: 5, title: 'Spike Dodge', publicId: 'a', plays: 41, by: 'Omar', createdAt: now, thisWeek: true },
      { id: 2, userId: 9, title: 'Star Dodge', publicId: 'b', plays: 12, by: 'Maya', createdAt: now, thisWeek: true },
      { id: 3, userId: 7, title: 'Old Gold', publicId: 'c', plays: 99, by: 'Lina', createdAt: old, thisWeek: false },
    ] }) });
    return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
  });
  mount({ user: { name: 'Maya' }, token: 't' });
  expect(await screen.findByText('Year 5')).toBeInTheDocument();
  expect(screen.getByText("You're 2nd")).toBeInTheDocument();
  expect(document.querySelectorAll('.ar__row')).toHaveLength(2);
  expect(document.querySelector('.ar__row.is-mine .ar__who')).toHaveTextContent('Maya · Star Dodge');
  expect(screen.getByRole('link', { name: /Omar/ })).toHaveAttribute('href', '/project/a');
  fireEvent.click(screen.getByRole('button', { name: 'All time' }));
  expect(screen.getByText("You're 3rd")).toBeInTheDocument();
  expect(document.querySelector('.ar__row .ar__who')).toHaveTextContent('Lina · Old Gold');
  expect(screen.queryByRole('link', { name: /In a class\? Join it/ })).toBeNull();
});

test('a guest gets everyone\'s arcade from the explore feed and the door to join', async () => {
  global.fetch = jest.fn((url) => {
    if (String(url).endsWith('/api/explore')) return Promise.resolve({ ok: true, status: 200, json: async () => ({ trending: [{ id: 1, title: 'Lava Run', publicId: 'x', plays: 38, creatorName: 'Lina', createdAt: now, primaryColor: '#123456' }], newest: [{ id: 1, title: 'Lava Run', publicId: 'x', plays: 38, creatorName: 'Lina', createdAt: now }, { id: 2, title: 'Coin Run', publicId: 'y', plays: 2, creatorName: 'Noor', createdAt: old }], mostPlayed: [] }) });
    return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
  });
  mount({ user: null, token: null });
  expect(await screen.findByText('Everyone')).toBeInTheDocument();
  await waitFor(() => expect(document.querySelectorAll('.ar__row')).toHaveLength(1));
  expect(screen.getByRole('link', { name: /Lina/ })).toHaveAttribute('href', '/project/x');
  fireEvent.click(screen.getByRole('button', { name: 'All time' }));
  expect(document.querySelectorAll('.ar__row')).toHaveLength(2);
  expect(screen.getByRole('link', { name: /In a class\? Join it/ })).toHaveAttribute('href', '/join');
  fireEvent.click(screen.getByRole('button', { name: 'Surprise me' }));
  expect(mockNavigate).toHaveBeenCalledWith(expect.stringMatching(/^\/project\/(x|y)$/));
});

test('a quiet week shows all time and says so, and short lists end with examples to build', async () => {
  global.fetch = jest.fn((url) => {
    if (String(url).endsWith('/api/explore')) return Promise.resolve({ ok: true, status: 200, json: async () => ({ trending: [{ id: 2, title: 'Coin Run', publicId: 'y', plays: 2, creatorName: 'Noor', createdAt: old }], newest: [], mostPlayed: [] }) });
    return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
  });
  mount({ user: null, token: null });
  expect(await screen.findByText('Nothing new this week yet, so here is all time.')).toBeInTheDocument();
  expect(document.querySelectorAll('.ar__row')).toHaveLength(1);
  expect(screen.getByText('Make one and it can be here')).toBeInTheDocument();
  expect(document.querySelectorAll('.ex__card')).toHaveLength(4);
});

test('offline, the arcade says the games are kept, comes back on retry, and offers building meanwhile', async () => {
  global.fetch = jest.fn(() => Promise.reject(new TypeError('Failed to fetch')));
  mount({ user: null, token: null });
  expect(await screen.findByText('The arcade cannot load right now.')).toBeInTheDocument();
  expect(screen.getByText(/Every game and every play is kept/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Build a game' })).toHaveAttribute('href', '/build');
  expect(screen.getByText('Build one while you wait')).toBeInTheDocument();
  global.fetch = jest.fn((url) => String(url).endsWith('/api/explore')
    ? Promise.resolve({ ok: true, status: 200, json: async () => ({ trending: [{ id: 1, title: 'Star Dodge', publicId: 'b', plays: 3, creatorName: 'Maya', createdAt: now }] }) })
    : Promise.resolve({ ok: false, status: 404, json: async () => ({}) }));
  fireEvent.click(screen.getByRole('button', { name: 'Try again now' }));
  expect(await screen.findByText(/Star Dodge/)).toBeInTheDocument();
  expect(screen.queryByText('The arcade cannot load right now.')).not.toBeInTheDocument();
});
