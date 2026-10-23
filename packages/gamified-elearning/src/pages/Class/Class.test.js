import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Join, { tidyCode } from './Join';
import Teach, { ago, roomNumbers, spaceCode } from './Teach';

// ── Join and Teach ──────────────────────────────────────────────────────────
//
// A child types the code as read out (any case, with a space) and a first
// name, and lands on Home signed in. A teacher makes a class and gets its
// code; the board shows the room; a site without the tables says so.

const mockNavigate = jest.fn();
let mockParams = {};
let mockSearch = '';
jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: ({ children, to, state, ...props }) => React.createElement('a', { href: to, ...props }, children),
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
    useLocation: () => ({ search: mockSearch, pathname: '/join' }),
  };
}, { virtual: true });
jest.mock('../Header/Header', () => () => null);
jest.mock('../../config/api', () => ({ API_BASE_URL: 'http://codeit.test' }));
jest.mock('../../hooks/useSEO', () => ({ useSEO: jest.fn() }));
jest.mock('../../context/AuthContext', () => {
  const React = require('react');
  return { AuthContext: React.createContext({ user: null, token: null, login: () => {} }) };
});
const { AuthContext } = require('../../context/AuthContext');

const login = jest.fn();
const mount = (el, auth = { user: null, token: null, login }) => render(<AuthContext.Provider value={auth}>{el}</AuthContext.Provider>);

beforeEach(() => { mockNavigate.mockClear(); login.mockClear(); mockParams = {}; mockSearch = ''; });

test('the room\'s three numbers: building, with a game, and stuck after ten minutes without one', () => {
  const now = Date.now();
  const m = (name, games, minutesAgo) => ({ name, games, joinedAt: new Date(now - minutesAgo * 60000).toISOString() });
  const n = roomNumbers([m('Maya', 2, 30), m('Leo', 0, 3), m('Sam', 0, 12), m('Noor', 0, 40)], now);
  expect(n.made).toBe(1);
  expect(n.building).toBe(1);
  expect(n.stuck.map((x) => x.name)).toEqual(['Sam', 'Noor']);
});

test('the helpers: codes are tidied and spaced, time reads in classroom words', () => {
  expect(tidyCode(' rocket-42 ')).toBe('ROCKET42');
  expect(spaceCode('ROCKET42')).toBe('ROCKET 42');
  expect(ago(new Date(Date.now() - 5 * 60000).toISOString())).toBe('5 min ago');
  expect(ago(new Date(Date.now() - 3 * 3600000).toISOString())).toBe('3 h ago');
});

test('a child joins with the code and a first name and is signed in on Home', async () => {
  global.fetch = jest.fn(() => Promise.resolve({ ok: true, status: 201, json: () => Promise.resolve({ joined: true, token: 'tok', user: { id: 9, name: 'Maya' }, class: { code: 'ROCKET42', name: 'Year 5' } }) }));
  mount(<Join />);
  const join = screen.getByRole('button', { name: 'Join' });
  expect(join).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Class code'), { target: { value: 'rocket 42' } });
  expect(screen.getByLabelText('Class code')).toHaveValue('ROCKET42');
  fireEvent.change(screen.getByLabelText('Your first name'), { target: { value: 'Maya' } });
  expect(join).not.toBeDisabled();
  fireEvent.click(join);
  await waitFor(() => expect(login).toHaveBeenCalledWith({ user: { id: 9, name: 'Maya' }, token: 'tok' }));
  expect(global.fetch.mock.calls[0][0]).toBe('http://codeit.test/api/class/ROCKET42/join');
  expect(JSON.parse(global.fetch.mock.calls[0][1].body)).toEqual({ first_name: 'Maya' });
  expect(mockNavigate).toHaveBeenCalledWith('/home', expect.objectContaining({ replace: true }));
});

test('a wrong code shows the server\'s words and nobody is signed in', async () => {
  global.fetch = jest.fn(() => Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({ error: 'No class has that code. Check it on the board.' }) }));
  mockSearch = '?code=zzzz22';
  mount(<Join />);
  expect(screen.getByLabelText('Class code')).toHaveValue('ZZZZ22');
  fireEvent.change(screen.getByLabelText('Your first name'), { target: { value: 'Leo' } });
  fireEvent.click(screen.getByRole('button', { name: 'Join' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('No class has that code. Check it on the board.');
  expect(login).not.toHaveBeenCalled();
  expect(mockNavigate).not.toHaveBeenCalled();
});

test('a signed-in child joins as themselves with no name box', async () => {
  global.fetch = jest.fn(() => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ joined: true, existing: true, class: { code: 'ROCKET42', name: 'Year 5' } }) }));
  mount(<Join />, { user: { name: 'Sam' }, token: 't', login });
  expect(screen.queryByLabelText('Your first name')).toBeNull();
  expect(screen.getByText('Sam')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Class code'), { target: { value: 'ROCKET42' } });
  fireEvent.click(screen.getByRole('button', { name: 'Join' }));
  await waitFor(() => expect(mockNavigate).toHaveBeenCalled());
  expect(global.fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer t');
  expect(login).not.toHaveBeenCalled();
});

test('a teacher makes a class and is taken to its board', async () => {
  global.fetch = jest.fn((url, init) => {
    if (String(url).endsWith('/api/class/mine')) return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ ready: true, classes: [{ code: 'PANDA77', name: 'Room 12', members: 3 }] }) });
    if (init?.method === 'POST') return Promise.resolve({ ok: true, status: 201, json: () => Promise.resolve({ class: { code: 'ROCKET42', name: 'Year 5', members: 0 } }) });
    return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) });
  });
  mount(<Teach />, { user: { name: 'Mr Q' }, token: 't', login });
  expect(await screen.findByText('PANDA 77')).toBeInTheDocument();
  expect(screen.getByText('3 children')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Class name'), { target: { value: 'Year 5' } });
  fireEvent.click(screen.getByRole('button', { name: 'Make the class' }));
  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/teach/ROCKET42'));
});

test('a guest on /teach is asked to sign in and comes back here', () => {
  mount(<Teach />);
  expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
  expect(screen.getByText(/Make a class\. Read out the code\./)).toBeInTheDocument();
});

test('the board shows the code big, every child, and plays a published game on the stage', async () => {
  mockParams = { code: 'rocket42' };
  global.fetch = jest.fn((url) => {
    if (String(url).endsWith('/api/class/ROCKET42')) {
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ ready: true, owner: true, class: { code: 'ROCKET42', name: 'Year 5' }, members: [
        { id: 1, name: 'Maya', games: 2, plays: 3, joinedAt: new Date(Date.now() - 20 * 60000).toISOString(), newest: { title: 'Ship Game', publicId: 'pub1', createdAt: new Date().toISOString() } },
        { id: 2, name: 'Leo', games: 0, plays: 0, joinedAt: new Date(Date.now() - 20 * 60000).toISOString(), newest: null },
      ] }) });
    }
    if (String(url).endsWith('/api/builder/pub/pub1')) return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ project: { generated_code: '<!DOCTYPE html><html><body>ship</body></html>' } }) });
    return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) });
  });
  mount(<Teach />, { user: { name: 'Mr Q' }, token: 't', login });
  expect(await screen.findByText('ROCKET 42')).toBeInTheDocument();
  expect(screen.getByText('Maya')).toBeInTheDocument();
  expect(screen.getByText('2 games')).toBeInTheDocument();
  expect(screen.getByText('Joined')).toBeInTheDocument();
  expect(screen.getByText(/2 children in\. 2 games made\./)).toBeInTheDocument();
  expect(screen.getByText('stuck: Leo')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Maya/ }));
  await waitFor(() => expect(document.querySelector('.cl__stage iframe')).not.toBeNull());
  fireEvent.click(screen.getByRole('button', { name: 'Projector' }));
  expect(document.body.classList.contains('cl-projector')).toBe(true);
  expect(screen.getByRole('button', { name: 'Leave projector' })).toBeInTheDocument();
});

test('before the tables exist the board says so instead of breaking', async () => {
  mockParams = { code: 'ROCKET42' };
  global.fetch = jest.fn(() => Promise.resolve({ ok: false, status: 503, json: () => Promise.resolve({ ready: false }) }));
  mount(<Teach />, { user: { name: 'Mr Q' }, token: 't', login });
  expect(await screen.findByText('Not switched on here yet.')).toBeInTheDocument();
});
