import { render, screen } from '@testing-library/react';
import Profile from './Profile';
import { saveProject } from '../../utils/projectShelf';
import { rememberGuestLesson } from '../../utils/guestLessons';

// ── Me, for a visitor ───────────────────────────────────────────────────────
//
// The tab bar's "Me" sent a visitor to "WELCOME BACK. Sign in to your
// account" (an outside audit, 20 November 2026). A visitor has a "me": what is
// on this device. These hold that page, and that it never becomes the
// redirect again.

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: ({ children, to, state, ...props }) => React.createElement('a', { href: to, 'data-from': state?.from, ...props }, children),
    useNavigate: () => mockNavigate,
  };
}, { virtual: true });
jest.mock('../Header/Header', () => () => null);
jest.mock('../../components/CharacterAvatar/CharacterAvatar', () => () => <div>Avatar</div>);
jest.mock('../../hooks/useSEO', () => ({ useSEO: jest.fn() }));
jest.mock('../../utils/trackEvent', () => ({ trackEvent: jest.fn() }));
jest.mock('../../config/api', () => ({ API_BASE_URL: 'http://codeit.test' }));
jest.mock('../../context/AuthContext', () => {
  const React = require('react');
  return { AuthContext: React.createContext({ user: null, token: null, logout: jest.fn() }) };
});
jest.mock('../../context/CharacterContext', () => ({
  useCharacterDisplay: () => ({ character: {} }),
  useCharacter: () => ({ character: {}, stats: { totalXP: 0 } }),
}));

const GAME = '<!doctype html><html><head><title>Cat Catch</title></head><body><canvas></canvas><script>let speed = 2; let startLives = 3; function loop(){ requestAnimationFrame(loop); } loop();</script><p>A whole small game, long enough to be kept on the shelf of this device.</p></body></html>';

beforeEach(() => {
  localStorage.clear();
  mockNavigate.mockClear();
  global.fetch = jest.fn(() => Promise.reject(new Error('a visitor asks the server for nothing here')));
});

test('a visitor with nothing yet gets a page of their own, not a sign-in screen', () => {
  render(<Profile />);
  expect(mockNavigate).not.toHaveBeenCalled();
  expect(screen.getByRole('heading', { level: 1, name: 'You' })).toBeInTheDocument();
  expect(screen.getByText('Kept on this device')).toBeInTheDocument();
  expect(screen.queryByText(/welcome back/i)).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Make it yours' })).toBeInTheDocument();
  expect(screen.getByText(/Nothing here yet\./)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Build the first one' })).toHaveAttribute('href', '/build');
  // Nothing about the visitor is asked of the server. (The public price
  // list is fetched by the page this one shares a route with; it carries no
  // one's name.)
  for (const [url, options] of global.fetch.mock.calls) {
    expect(String(url)).toBe('http://codeit.test/api/billing/plan');
    expect(options?.headers?.Authorization).toBeUndefined();
  }
});

test('it shows what is on this device: the games, the lessons done, and a way back into each game', () => {
  const kept = saveProject(localStorage, { title: 'Cat Catch', prompt: 'a cat that catches falling fish', projectType: 'game', code: GAME });
  rememberGuestLesson(1, localStorage);
  rememberGuestLesson(2, localStorage);
  render(<Profile />);
  expect(screen.getByText('game made').previousSibling).toHaveTextContent('1');
  expect(screen.getByText(/of \d+ lessons done/).previousSibling).toHaveTextContent('2');
  expect(screen.getByRole('link', { name: /Cat Catch/ })).toHaveAttribute('href', `/builder?shelf=${kept.id}`);
  expect(screen.getByText('2 done on this device. Carry on.')).toBeInTheDocument();
});

test('the account is offered as the way to keep it, honestly, with a way in for someone who has one and no price', () => {
  saveProject(localStorage, { title: 'Cat Catch', prompt: 'a cat that catches falling fish', projectType: 'game', code: GAME });
  render(<Profile />);
  expect(screen.getByRole('heading', { name: 'Keep it for good' })).toBeInTheDocument();
  // Lessons are banked on sign-in; a game is kept when it is saved. The page says exactly that.
  expect(screen.getByText('What you make is saved on this device only. With a free account your lessons are kept for good, and so is every game you save.')).toBeInTheDocument();
  const make = screen.getByRole('link', { name: 'Make a free account' });
  expect(make).toHaveAttribute('href', '/register');
  expect(make).toHaveAttribute('data-from', '/profile');
  const have = screen.getByRole('link', { name: 'I already have one' });
  expect(have).toHaveAttribute('href', '/login');
  expect(have).toHaveAttribute('data-from', '/profile');
  expect(screen.getByText('Under 13? A parent or guardian sets it up with you.')).toBeInTheDocument();
  // Nothing is sold to a child.
  expect(document.body.textContent).not.toMatch(/\$|CA\$|a month|Plus|pricing/i);
});
