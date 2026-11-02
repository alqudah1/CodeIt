import { render, screen, fireEvent } from '@testing-library/react';
import Home, { CAME_FROM_GAME_KEY } from './Home';

// ── A child sent by a friend's game meets the game door first ───────────────
//
// The home page leads with Python for the parent deciding (leadsWithPython).
// A child who just played a friend's game on this browser came for a game.

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: ({ children, to, ...props }) => React.createElement('a', { href: to, ...props }, children),
    useNavigate: () => mockNavigate,
  };
}, { virtual: true });
jest.mock('../Header/Header', () => () => null);
jest.mock('../../components/BrandLogo/BrandLogo', () => () => null);
jest.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: null, token: null }) }));
jest.mock('../../config/api', () => ({ API_BASE_URL: 'http://codeit.test' }));
jest.mock('../../hooks/useSEO', () => ({ useSEO: jest.fn() }));
jest.mock('../../utils/trackEvent', () => ({ trackEvent: jest.fn(() => Promise.resolve(true)) }));

beforeEach(() => {
  localStorage.clear(); mockNavigate.mockClear();
  global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: async () => ({ projects: [] }) }));
});

test('a first visit is unchanged: Python first, no game door', () => {
  render(<Home />);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Write your first Python program.');
  expect(screen.queryByText('Make a game like that one.')).toBeNull();
  expect(screen.getAllByLabelText('What do you want to build?')).toHaveLength(1);
});

test('after a friend\'s game, the game door is first and builds what they type', () => {
  localStorage.setItem(CAME_FROM_GAME_KEY, '1');
  const { container } = render(<Home />);
  const door = screen.getByText('Make a game like that one.');
  const hero = screen.getByRole('heading', { level: 1 });
  // The door comes before the Python hero in the page.
  expect(door.compareDocumentPosition(hero) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  // One idea box on the page, not two.
  expect(container.querySelectorAll('form.say')).toHaveLength(1);
  fireEvent.change(screen.getByLabelText('What is your game?'), { target: { value: 'a cat that dodges bombs in the ocean' } });
  fireEvent.click(screen.getByRole('button', { name: /Make it/ }));
  expect(mockNavigate).toHaveBeenCalledWith(expect.stringMatching(/^\/build\?prompt=a%20cat/));
});
