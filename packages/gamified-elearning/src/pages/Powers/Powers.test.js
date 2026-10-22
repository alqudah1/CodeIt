import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PowersMap, { readDone, rememberDone } from './PowersMap';
import Power, { codeFor, recipeFromSettings } from './Power';
import { POWERS, readSettings } from './powers';

// ── The map and a power ─────────────────────────────────────────────────────
//
// The map shows twelve blocks with exactly one next. A power rebuilds the
// child's own game, lights one line, moves on when the value changes and the
// game is run, and the check passes with the server's rule and remembers it.

const mockNavigate = jest.fn();
let mockParams = {};
jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: ({ children, to, ...props }) => React.createElement('a', { href: to, ...props }, children),
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
  };
}, { virtual: true });
jest.mock('../Header/Header', () => () => null);
jest.mock('../../config/api', () => ({ API_BASE_URL: 'http://codeit.test' }));
jest.mock('../../hooks/useSEO', () => ({ useSEO: jest.fn() }));
jest.mock('../../context/AuthContext', () => {
  const React = require('react');
  return { AuthContext: React.createContext({ user: null, token: null }) };
});
const { AuthContext } = require('../../context/AuthContext');
const mount = (el, auth = { user: null, token: null }) => render(<AuthContext.Provider value={auth}>{el}</AuthContext.Provider>);

beforeEach(() => { localStorage.clear(); mockNavigate.mockClear(); mockParams = {}; });

test('the browser remembers passed powers without an account', () => {
  expect(readDone(localStorage)).toEqual([]);
  rememberDone(localStorage, 'numbers');
  rememberDone(localStorage, 'numbers');
  expect(readDone(localStorage)).toEqual(['numbers']);
  localStorage.setItem('codeit.powers.v1', '{bad');
  expect(readDone(localStorage)).toEqual([]);
});

test('the map: twelve blocks, the learned ones green, one next, the rest not links', async () => {
  global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ done: ['numbers'], powers: [] }) }));
  rememberDone(localStorage, 'words');
  mount(<PowersMap />, { user: { name: 'Maya' }, token: 't' });
  await waitFor(() => expect(document.querySelectorAll('.pw__blk.is-done')).toHaveLength(2));
  expect(document.querySelectorAll('.pw__blk')).toHaveLength(12);
  expect(document.querySelector('.pw__count b')).toHaveTextContent('2');
  expect(document.querySelectorAll('.pw__blk.is-next')).toHaveLength(1);
  expect(document.querySelector('.pw__blk.is-next')).toHaveAttribute('href', '/powers/looks');
  expect(screen.queryByRole('link', { name: /Boss/ })).toBeNull();
  expect(screen.getByRole('link', { name: 'Start Looks' })).toHaveAttribute('href', '/powers/looks');
});

test('a power rebuilds the shelf game, lights its line, and the steps move on when the value changes and the game runs', async () => {
  const shelfCode = `<!DOCTYPE html><html><body><script>\nlet gameKind   = 'catch';\nlet gameTitle  = 'Carrot Rain';\nlet playerLook = 'hero';\nlet enemyLook  = 'bomb';\nlet treasure   = 'carrot';\nlet skyLook    = 'day';\nlet speed      = 2;\nlet startLives = 3;\nlet winAt      = 15;\nlet twist      = 'none';\n</script></body></html>`;
  localStorage.setItem('codeit.shelf.v1', JSON.stringify([{ id: 'p1', title: 'Carrot Rain', prompt: 'x', projectType: 'game', code: shelfCode, savedAt: Date.now(), updatedAt: Date.now() }]));
  global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ passed: true, stored: false, xp: 0 }) }));
  mockParams = { slug: 'loops' };
  mount(<Power />);
  expect(await screen.findByText('Loops. Make waves.')).toBeInTheDocument();
  expect(screen.getByText('Carrot Rain')).toBeInTheDocument();
  const input = screen.getByLabelText('Value of waveSize');
  expect(input).toHaveValue('1');
  expect(document.querySelector('.pw__frame iframe').getAttribute('srcdoc')).toContain("let gameTitle  = 'Carrot Rain';");
  expect(document.querySelector('.pw__frame iframe').getAttribute('srcdoc')).toContain("let enemyLook  = 'bomb';");

  // Run without changing: told to change the lit number.
  fireEvent.click(screen.getByRole('button', { name: 'Run it' }));
  expect(screen.getByRole('status')).toHaveTextContent('Change the lit number first.');
  expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();

  fireEvent.change(input, { target: { value: '3' } });
  expect(document.querySelector('.pw__frame iframe').getAttribute('srcdoc')).toContain('let waveSize     = 3;');
  fireEvent.click(screen.getByRole('button', { name: 'Run it' }));
  expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
  expect(screen.getByText('Now 6. The biggest wave the game allows.')).toBeInTheDocument();
  expect(screen.queryByText(/\{to\}/)).toBeNull();

  fireEvent.change(screen.getByLabelText('Value of waveSize'), { target: { value: '6' } });
  fireEvent.click(screen.getByRole('button', { name: 'Run it' }));
  expect(screen.getByText('The check')).toBeInTheDocument();
  const editor = screen.getByLabelText("Your game's settings");
  expect(editor.tagName).toBe('TEXTAREA');

  // Wrong edit, then the right one, checked with the server, remembered here.
  fireEvent.change(editor, { target: { value: editor.value.replace('let waveSize     = 6;', 'let waveSize     = 1;') } });
  fireEvent.click(screen.getByRole('button', { name: 'Check it' }));
  expect(await screen.findByRole('status')).toHaveTextContent('Not yet.');
  fireEvent.change(editor, { target: { value: editor.value.replace('let waveSize     = 1;', 'let waveSize     = 4;') } });
  fireEvent.click(screen.getByRole('button', { name: 'Check it' }));
  expect(await screen.findByText('Loops unlocked.')).toBeInTheDocument();
  expect(readDone(localStorage)).toEqual(['loops']);
  const call = global.fetch.mock.calls.find((c) => String(c[0]).endsWith('/api/powers/loops/check'));
  expect(JSON.parse(call[1].body).code).toContain('let waveSize     = 4;');
  expect(screen.getByRole('button', { name: 'Next: Numbers' })).toBeInTheDocument();
});

test('three misses offer to fill it in', async () => {
  global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ signedIn: false }) }));
  mockParams = { slug: 'sound' };
  mount(<Power />);
  const input = await screen.findByLabelText('Value of soundOn');
  expect(screen.getByText('Flip soundOn to true. Run it and catch something.')).toBeInTheDocument();
  fireEvent.change(input, { target: { value: 'true' } });
  fireEvent.click(screen.getByRole('button', { name: 'Run it' }));
  fireEvent.change(screen.getByLabelText('Value of soundOn'), { target: { value: 'false' } });
  fireEvent.click(screen.getByRole('button', { name: 'Run it' }));
  for (let i = 0; i < 3; i += 1) {
    fireEvent.click(screen.getByRole('button', { name: 'Check it' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Check it' })).not.toBeDisabled());
  }
  const fill = await screen.findByRole('button', { name: 'Fill it in for me' });
  fireEvent.click(fill);
  expect(screen.getByLabelText("Your game's settings").value).toContain('let soundOn      = true;');
});

test('the helpers round trip a game\'s settings into a recipe and back', () => {
  const recipe = recipeFromSettings(readSettings(codeFor({ kind: 'dodge', title: 'Star Dodge', player: 'ship', enemy: 'rock', treasure: 'star', sky: 'space', speed: 3, lives: 2, winAt: 20, twist: 'waves', bossAt: 9 })));
  expect(recipe).toMatchObject({ kind: 'dodge', title: 'Star Dodge', speed: 3, lives: 2, winAt: 20, twist: 'waves', bossAt: 9, soundOn: false });
  expect(POWERS.every((p) => p.key in readSettings(codeFor(recipe)))).toBe(true);
});
