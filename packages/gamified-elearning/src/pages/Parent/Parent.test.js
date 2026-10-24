import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Parent, { dayOf, headlineFor } from './Parent';

// ── The parent's week ───────────────────────────────────────────────────────
//
// What was made (playable), what was learned in plain words, what is next,
// the price. An honest headline when nothing was made. Paying parents see
// the renewal date in place of the price.

jest.mock('react-router-dom', () => {
  const React = require('react');
  return { Link: ({ children, to, state, ...props }) => React.createElement('a', { href: to, ...props }, children) };
}, { virtual: true });
jest.mock('../Header/Header', () => () => null);
jest.mock('../../config/api', () => ({ API_BASE_URL: 'http://codeit.test' }));
jest.mock('../../hooks/useSEO', () => ({ useSEO: jest.fn() }));
const mockCheckout = jest.fn(() => Promise.resolve('https://checkout'));
const mockPortal = jest.fn(() => Promise.resolve('https://portal'));
let mockBilling = { billingEnabled: true, canSubscribe: true, plan: 'free', status: null };
jest.mock('../../utils/billing', () => ({
  fetchBillingStatus: () => Promise.resolve(mockBilling),
  isPlusMember: (s) => s.plan === 'plus',
  startCheckout: (...a) => mockCheckout(...a),
  openBillingPortal: (...a) => mockPortal(...a),
}));
jest.mock('../../context/AuthContext', () => { const React = require('react'); return { AuthContext: React.createContext({ user: null, token: null }) }; });
const { AuthContext } = require('../../context/AuthContext');
const mount = (auth) => render(<AuthContext.Provider value={auth}><Parent /></AuthContext.Provider>);

const EVIDENCE = { success: true, weekCount: 2, powers: [{ slug: 'numbers', name: 'Numbers', does: 'change how fast' }], nextPower: { slug: 'words', name: 'Words', does: 'name things' },
  projects: [{ id: 1, title: 'Carrot Rain', prompt: 'a bunny that catches carrots', code: '<!DOCTYPE html><html><body>game</body></html>', updatedAt: '2026-10-21T10:00:00Z' }, { id: 2, title: 'Star Dodge', prompt: 'x', code: '', updatedAt: '2026-10-19T10:00:00Z' }],
  lessonsDone: [], understood: [{ projectTitle: 'Carrot Rain', skills: ['how many times a loop runs'] }] };

function serve(ev = EVIDENCE, children = [{ id: 4, username: 'maya', progressEmailsEnabled: true }]) {
  global.fetch = jest.fn((url) => {
    const u = String(url);
    if (u.endsWith('/api/family')) return Promise.resolve({ ok: true, json: async () => ({ success: true, status: { children } }) });
    if (/\/api\/family\/children\/\d+\/evidence$/.test(u)) return Promise.resolve({ ok: true, json: async () => ev });
    return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
  });
}

beforeEach(() => { mockCheckout.mockClear(); mockPortal.mockClear(); mockBilling = { billingEnabled: true, canSubscribe: true, plan: 'free', status: null }; });

test('the words: headline and date', () => {
  expect(headlineFor('Maya', 0)).toBe('Maya has not built this week yet.');
  expect(headlineFor('Maya', 1)).toBe('Maya made 1 game this week.');
  expect(headlineFor('Maya', 3)).toBe('Maya made 3 games this week.');
  expect(dayOf('2026-10-21T10:00:00Z')).toMatch(/Wednesday/);
  expect(dayOf(null)).toBe('');
});

test('a parent sees what was made, playable, what was learned in plain words, what is next, and the price', async () => {
  serve();
  mount({ user: { name: 'Mr Q', role: 'Educator' }, token: 't' });
  expect(await screen.findByText('Maya made 2 games this week.')).toBeInTheDocument();
  expect(document.querySelector('.pa__frame iframe').getAttribute('srcdoc')).toContain('game');
  expect(screen.getByText('Carrot Rain')).toBeInTheDocument();
  expect(screen.getByText(/a bunny that catches carrots/)).toBeInTheDocument();
  expect(screen.getByText('Also: Star Dodge.')).toBeInTheDocument();
  expect(screen.getByText('Numbers: change how fast')).toBeInTheDocument();
  expect(screen.getByText('how many times a loop runs (in Carrot Rain)')).toBeInTheDocument();
  expect(screen.getByText(/Next:/)).toHaveTextContent('Next: Words, name things.');
  expect(screen.getByText('CA$12/month')).toBeInTheDocument();
  expect(screen.getByText(/On\. This page goes to your inbox/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Start Plus' }));
  await waitFor(() => expect(mockCheckout).toHaveBeenCalledWith('t'));
});

test('nothing made this week is said plainly, and a paying parent sees the renewal date', async () => {
  mockBilling = { billingEnabled: true, canSubscribe: true, plan: 'plus', status: 'active', currentPeriodEnd: '2026-11-20T00:00:00Z', cancelAtPeriodEnd: false };
  serve({ ...EVIDENCE, weekCount: 0, projects: [], powers: [], understood: [], nextPower: { slug: 'numbers', name: 'Numbers', does: 'change how fast' } });
  mount({ user: { name: 'Mr Q', role: 'Educator' }, token: 't' });
  expect(await screen.findByText('Maya has not built this week yet.')).toBeInTheDocument();
  expect(screen.getByText(/No games yet\./)).toBeInTheDocument();
  expect(screen.getByText('Nothing yet. Learning starts with the first power.')).toBeInTheDocument();
  expect(await screen.findByText(/Renews/)).toHaveTextContent('Renews');
  expect(screen.queryByText('CA$12/month')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Manage' }));
  await waitFor(() => expect(mockPortal).toHaveBeenCalledWith('t'));
});

test('no linked child, a signed-out visitor, and a child each get the right door', async () => {
  serve(EVIDENCE, []);
  mount({ user: { name: 'Mr Q', role: 'Educator' }, token: 't' });
  expect(await screen.findByText('No child profile linked yet.')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Add a child' })).toHaveAttribute('href', '/profile#family-controls');
  mount({ user: null, token: null });
  expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
  mount({ user: { name: 'Maya', role: 'student' }, token: 'k' });
  expect(screen.getByText('This page is for grown-ups.')).toBeInTheDocument();
});

test('signed out, a parent sees an example week built from real parts, flagged, naming no child', () => {
  mount({ user: null, token: null });
  expect(screen.getByText('Example week')).toBeInTheDocument();
  expect(screen.getByText(/Yours shows your own child/)).toBeInTheDocument();
  const game = document.querySelector('.pa__frame iframe').getAttribute('srcdoc');
  expect(game).toContain("let gameTitle  = 'Bunny Game';");
  expect(game).toContain("let treasure   = 'carrot';");
  expect(screen.getByText('Numbers: change how fast')).toBeInTheDocument();
  expect(screen.getByText('Loops: make waves')).toBeInTheDocument();
  expect(screen.getByText(/Next:/)).toHaveTextContent('Next: Words, name things.');
  expect(screen.getByText('Nothing is sold to your child')).toBeInTheDocument();
  expect(screen.getByText(/Plus is CA\$12\/month/)).toBeInTheDocument();
  expect(document.body.textContent).not.toMatch(/Maya|Leo|Omar/);
  expect(screen.getByRole('link', { name: 'Make an account' })).toHaveAttribute('href', '/register');
});

test('offline, a parent is not told to add a child they already added, and the page fills in when it can', async () => {
  global.fetch = jest.fn(() => Promise.resolve({ ok: false, status: 502, json: async () => { throw new Error('not json'); } }));
  mount({ user: { name: 'Sam', role: 'Parent' }, token: 't' });
  expect(await screen.findByText('This week cannot load right now.')).toBeInTheDocument();
  expect(screen.getByText(/their games and powers are kept/)).toBeInTheDocument();
  expect(screen.queryByText('No child profile linked yet.')).not.toBeInTheDocument();
  serve();
  fireEvent.click(screen.getByRole('button', { name: 'Try again now' }));
  expect(await screen.findByText('Carrot Rain')).toBeInTheDocument();
  expect(screen.queryByText('This week cannot load right now.')).not.toBeInTheDocument();
});

test('a child\'s games that fail to load offer a retry, and arrive on it', async () => {
  let evidenceUp = false;
  global.fetch = jest.fn((url) => {
    const u = String(url);
    if (u.endsWith('/api/family')) return Promise.resolve({ ok: true, json: async () => ({ success: true, status: { children: [{ id: 4, username: 'maya' }] } }) });
    if (u.endsWith('/evidence')) return evidenceUp ? Promise.resolve({ ok: true, json: async () => EVIDENCE }) : Promise.reject(new TypeError('Failed to fetch'));
    return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
  });
  mount({ user: { name: 'Sam', role: 'Parent' }, token: 't' });
  expect(await screen.findByText(/Could not reach Maya's games just now/)).toBeInTheDocument();
  evidenceUp = true;
  fireEvent.click(screen.getByRole('button', { name: 'Try now' }));
  expect(await screen.findByText('Carrot Rain')).toBeInTheDocument();
});
