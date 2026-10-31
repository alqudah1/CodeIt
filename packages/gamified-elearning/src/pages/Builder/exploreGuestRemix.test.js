import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Explore from './Explore';
import { trackEvent } from '../../utils/trackEvent';

// ── A guest's Remix on Explore opens the studio, not a sign-in page ─────────
//
// Seen live on 31 October 2026: the project page's "Remix this" took a guest
// straight to the studio, but the Remix button on the Explore card, the same
// promise one page earlier, still sent them to log in.

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: ({ children, to, ...props }) => React.createElement('a', { href: to, ...props }, children),
    useNavigate: () => mockNavigate,
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

const GAME = `<!doctype html><html><body><canvas id="c"></canvas><script>${'let score = 0; '.repeat(12)}</script></body></html>`;

function feed(codeOk = true, publicId = 'abc123def456') {
  global.fetch = jest.fn((url) => {
    if (String(url).includes('/api/builder/pub/')) {
      return Promise.resolve({ ok: codeOk, json: async () => ({ project: { generated_code: GAME } }) });
    }
    return Promise.resolve({
      ok: true,
      json: async () => ({
        trending: [{ publicId, title: 'Star Catcher', projectType: 'game', creatorName: 'Maya', plays: 4, likes: 1, remixes: 0 }],
        newest: [], mostPlayed: [], mostRemixed: [],
      }),
    });
  });
}

beforeEach(() => { mockNavigate.mockClear(); trackEvent.mockClear(); localStorage.clear(); sessionStorage.clear(); });

test('the game goes on this browser\'s shelf and the studio opens with it', async () => {
  feed();
  render(<Explore />);
  const [remix] = await screen.findAllByRole('button', { name: 'Remix' });
  fireEvent.click(remix);
  await waitFor(() => expect(mockNavigate).toHaveBeenCalled());
  const target = mockNavigate.mock.calls[0][0];
  expect(target).toMatch(/^\/builder\?shelf=/);
  const shelf = JSON.parse(localStorage.getItem('codeit.shelf.v1'));
  expect(shelf[0]).toMatchObject({ title: 'Star Catcher', code: GAME });
  expect(target).toBe(`/builder?shelf=${shelf[0].id}`);
  expect(trackEvent).toHaveBeenCalledWith('guest_remix', 'game');
});

test('if the code cannot be read, the old sign-in road is still there', async () => {
  // A different project: Explore keeps the code it has read for the page's life.
  feed(false, 'fff000fff000');
  render(<Explore />);
  const [remix] = await screen.findAllByRole('button', { name: 'Remix' });
  fireEvent.click(remix);
  await waitFor(() => expect(mockNavigate).toHaveBeenCalled());
  expect(mockNavigate.mock.calls[0][0]).toBe('/login');
  expect(trackEvent).not.toHaveBeenCalledWith('guest_remix', expect.anything());
});
