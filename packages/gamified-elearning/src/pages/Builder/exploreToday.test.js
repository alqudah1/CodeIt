import { render, screen } from '@testing-library/react';
import Explore from './Explore';

// ── Today's build on Explore ────────────────────────────────────────────────
// The quest from every child's Home, and the games published from it today.

jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: ({ children, to, ...props }) => React.createElement('a', { href: to, ...props }, children),
    useNavigate: () => jest.fn(),
  };
}, { virtual: true });
jest.mock('../Header/Header', () => () => null);
jest.mock('../../config/api', () => ({ API_BASE_URL: 'http://codeit.test' }));
jest.mock('../../hooks/useSEO', () => ({ useSEO: jest.fn() }));
jest.mock('../../context/AuthContext', () => {
  const React = require('react');
  return { AuthContext: React.createContext({ user: null, token: null }) };
});
jest.mock('../../utils/trackEvent', () => ({ trackEvent: jest.fn(() => Promise.resolve(true)) }));

const QUEST = { text: 'Shoot the asteroids.', prompt: 'a ship that shoots asteroids and they get faster', day: '2026-11-02' };
const card = (over) => ({ id: 1, publicId: 'aaa111bbb222', title: 'Rock Blaster', projectType: 'game', creatorName: 'Maya', plays: 3, likes: 0, remixes: 0, ...over });

function feed(today) {
  global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: async () => ({ trending: [], newest: [], mostPlayed: [], mostRemixed: [], today }) }));
}

test('the quest is there with a door straight into building it, and real entries under it', async () => {
  feed({ quest: QUEST, count: 9, entries: [card(), card({ id: 2, publicId: 'ccc333ddd444', title: 'Space Dodge' })] });
  render(<Explore />);
  expect(await screen.findByRole('heading', { name: 'Shoot the asteroids.' })).toBeInTheDocument();
  // The count is the server's, not the number of cards shown.
  expect(screen.getByText('9 made today. Play them, then make yours.')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Build it' })).toHaveAttribute('href', `/build?prompt=${encodeURIComponent(QUEST.prompt)}`);
  expect(screen.getAllByText('Rock Blaster').length).toBeGreaterThan(0);
});

test('a day with none says so, with no invented count', async () => {
  feed({ quest: QUEST, count: 0, entries: [] });
  render(<Explore />);
  expect(await screen.findByText('Nobody has published one today yet. Yours could be the first.')).toBeInTheDocument();
  expect(screen.queryByText(/0 made/)).toBeNull();
});

test('an older server without it: nothing shown, nothing broken', async () => {
  feed(undefined);
  render(<Explore />);
  await screen.findByRole('heading', { level: 1 });
  expect(screen.queryByText("Today's build")).toBeNull();
});
