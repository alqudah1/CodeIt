import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Profile from './Profile';

// ── Me ──────────────────────────────────────────────────────────────────────
//
// A child's /profile is the trophy room: real numbers from the same calls Home
// makes, the powers with the next one lit, the medal case, their games. The
// grown-up page is behind Settings, and nothing is invented: a fresh account
// shows zeros and "Nothing here yet".

const mockLogout = jest.fn();
let mockUser = { user_id: 8, name: 'Maya Q', username: 'maya', role: 'Student' };
jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: ({ children, to, ...props }) => React.createElement('a', { href: to, ...props }, children),
    useNavigate: () => jest.fn(),
  };
}, { virtual: true });
jest.mock('../Header/Header', () => () => null);
jest.mock('../../components/CharacterAvatar/CharacterAvatar', () => () => <div>Avatar</div>);
jest.mock('../../hooks/useSEO', () => ({ useSEO: jest.fn() }));
jest.mock('../../utils/trackEvent', () => ({ trackEvent: jest.fn() }));
jest.mock('../../config/api', () => ({ API_BASE_URL: 'http://codeit.test' }));
jest.mock('../../context/AuthContext', () => {
  const React = require('react');
  return { AuthContext: React.createContext({ get user() { return mockUser; }, token: 'tok', logout: (...a) => mockLogout(...a) }) };
});
jest.mock('../../context/CharacterContext', () => ({
  useCharacterDisplay: () => ({ character: {} }),
  useCharacter: () => ({ character: {}, stats: { totalXP: 0 } }),
}));

function serve(today, understanding = []) {
  global.fetch = jest.fn((url) => {
    const u = String(url);
    if (u.endsWith('/api/today')) return Promise.resolve({ ok: true, json: async () => today });
    if (u.endsWith('/api/powers')) return Promise.resolve({ ok: true, json: async () => ({ done: ['numbers', 'words'] }) });
    if (u.endsWith('/api/understanding')) return Promise.resolve({ ok: true, json: async () => ({ success: true, records: understanding }) });
    if (u.endsWith('/api/builder/projects')) return Promise.resolve({ ok: true, json: async () => ({ success: true, projects: [{ id: 1 }, { id: 2 }, { id: 3 }] }) });
    return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
  });
}

beforeEach(() => { localStorage.clear(); mockLogout.mockClear(); window.history.pushState({}, '', '/profile'); });

test('a child sees the numbers, the powers with the next lit, the medals, and the games', async () => {
  serve({ signedIn: true, streak: 4, level: { n: 4, title: 'Game Designer', xp: 420, next: 600, toNext: 180 }, games: [{ id: 7, title: 'Carrot Rain', plays: 7, publicId: 'p7' }, { id: 8, title: 'Star Dodge', plays: 0, publicId: null }], plays: 7 },
    [{ projectTitle: 'Carrot Rain', skills: ['how many times a loop runs'] }]);
  render(<Profile />);
  expect(await screen.findByText('Maya')).toBeInTheDocument();
  expect(await screen.findByText('Level 4 · Game Designer')).toBeInTheDocument();
  expect(document.querySelector('.ci-blk--coral .ci-num')).toHaveTextContent('4');
  expect(screen.getByText('420')).toBeInTheDocument();
  expect(screen.getByText('XP · 180 to level 5')).toBeInTheDocument();
  await waitFor(() => expect(document.querySelector('.ci-blk--ink .ci-num')).toHaveTextContent('3'));
  expect(screen.getByText('games made')).toBeInTheDocument();
  await waitFor(() => expect(document.querySelectorAll('.me__power.is-done')).toHaveLength(2));
  expect(document.querySelector('.me__power.is-next')).toHaveAttribute('href', '/powers/looks');
  expect(screen.getByText('2 of 12')).toBeInTheDocument();
  await waitFor(() => expect(document.querySelectorAll('.me__medal.is-won')).toHaveLength(1));
  expect(screen.getByText('1 of 5')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Carrot Rain/ })).toHaveAttribute('href', '/builder?project=7');
  expect(screen.getByText('7 plays · in the arcade')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/profile?settings=1');
  expect(screen.getByRole('link', { name: 'Change your look' })).toHaveAttribute('href', '/character');
  fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
  expect(mockLogout).toHaveBeenCalled();
});

test('a fresh account shows zeros and the honest empty states, never a made-up number', async () => {
  serve({ signedIn: true, streak: 0, level: { n: 1, title: 'Rookie', xp: 0, next: 100, toNext: 100 }, games: [], plays: 0 });
  global.fetch.mockImplementation((url) => {
    const u = String(url);
    if (u.endsWith('/api/today')) return Promise.resolve({ ok: true, json: async () => ({ signedIn: true, streak: 0, level: { n: 1, title: 'Rookie', xp: 0, next: 100, toNext: 100 }, games: [], plays: 0 }) });
    if (u.endsWith('/api/builder/projects')) return Promise.resolve({ ok: true, json: async () => ({ success: true, projects: [] }) });
    return Promise.resolve({ ok: true, json: async () => ({ success: true, done: [], records: [] }) });
  });
  render(<Profile />);
  expect(await screen.findByText('Level 1 · Rookie')).toBeInTheDocument();
  expect(screen.getByText(/Nothing here yet/)).toBeInTheDocument();
  expect(screen.getByText('0 of 12')).toBeInTheDocument();
  expect(screen.getByText('0 of 5')).toBeInTheDocument();
  expect(document.querySelector('.me__power.is-next')).toHaveAttribute('href', '/powers/numbers');
});

test('an adult still gets the family page, and a child gets it behind Settings', async () => {
  mockUser = { user_id: 9, name: 'Mr Q', role: 'Educator' };
  serve({});
  render(<Profile />);
  await waitFor(() => expect(document.querySelector('.profile-page')).not.toBeNull());
  expect(document.querySelector('.me')).toBeNull();
  mockUser = { user_id: 8, name: 'Maya Q', username: 'maya', role: 'Student' };
  window.history.pushState({}, '', '/profile?settings=1');
  const { container } = render(<Profile />);
  await waitFor(() => expect(container.querySelector('.profile-page')).not.toBeNull());
});
