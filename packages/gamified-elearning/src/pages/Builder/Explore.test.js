import { render, screen } from '@testing-library/react';
import Explore from './Explore';

// ── Zeros are not statistics ─────────────────────────────────────────────────
//
// A brand-new project used to show "▶ 0  ♥ 0  ⤴ 0" — three zeros that make the
// whole community read as abandoned. A new project is not abandoned, it is
// new, so the card says that, and numbers appear only once there are numbers.

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

const project = (over = {}) => ({
  publicId: 'p-' + Math.random().toString(36).slice(2, 7),
  title: 'Star Catcher',
  projectType: 'game',
  creatorName: 'Maya',
  plays: 0,
  likes: 0,
  remixes: 0,
  liked: false,
  ...over,
});

describe('Explore card statistics', () => {
  beforeEach(() => {
    global.fetch = jest.fn(() => Promise.resolve({
      ok: true,
      json: async () => ({
        trending: [
          project({ title: 'Brand New Maze', createdAt: new Date().toISOString() }),
          project({ title: 'Played Snake', plays: 12, likes: 3, remixes: 1 }),
        ],
        newest: [], mostPlayed: [], mostRemixed: [],
      }),
    }));
  });

  test('a project nobody has touched says Just made, never a row of zeros', async () => {
    render(<Explore />);
    expect((await screen.findAllByText('Brand New Maze')).length).toBeGreaterThan(0);
    expect(screen.getByText(/Just made/)).toBeInTheDocument();
    // No zero counters anywhere on the fresh card.
    expect(screen.queryAllByText('0')).toHaveLength(0);
  });

  test('a project with real numbers shows them', async () => {
    render(<Explore />);
    expect((await screen.findAllByText('Played Snake')).length).toBeGreaterThan(0);
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
