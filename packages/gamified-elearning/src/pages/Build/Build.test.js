import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import Build from './Build';

// ── Say a game, get a game ───────────────────────────────────────────────────
//
// The page's promise is a game two seconds after a sentence, with no account
// and no waiting on the full AI build. These tests type the sentence from the
// classroom on 15 October and make sure a game page is in the frame whether
// the recipe endpoint answers, refuses, or is not there at all.

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const React = require('react');
  return { Link: ({ children, to }) => React.createElement('a', { href: to }, children), useNavigate: () => mockNavigate, useLocation: () => ({ search: '' }), NavLink: ({ children, to }) => React.createElement('a', { href: to }, children) };
}, { virtual: true });
jest.mock('../Header/Header', () => () => null);
jest.mock('../../config/api', () => ({ API_BASE_URL: 'http://codeit.test' }));
jest.mock('../../hooks/useSEO', () => ({ useSEO: jest.fn() }));
jest.mock('../../context/AuthContext', () => {
  const React = require('react');
  return { AuthContext: React.createContext({ user: null, token: null }) };
});
jest.mock('../../context/CharacterContext', () => ({ useCharacterDisplay: () => ({ character: null, characterLoaded: false }) }));

const SENTENCE = 'I want a ship game were you shoot at enemy ships with the button';

beforeEach(() => {
  localStorage.clear();
  mockNavigate.mockClear();
  window.HTMLMediaElement.prototype.play = () => Promise.resolve();
});

const frameDoc = () => document.querySelector('.bd__frame iframe')?.getAttribute('srcdoc') || '';

test('the sentence from the classroom becomes a shooter in the frame when the server answers', async () => {
  global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ game: true, recipe: { kind: 'shooter', title: 'Ship Game', player: '🚀', enemy: '👾', treasure: '💎', sky: 'space', speed: 2, lives: 3, winAt: 15 } }) }));
  render(<Build />);
  fireEvent.change(screen.getByLabelText('Describe the game you want to play'), { target: { value: SENTENCE } });
  fireEvent.click(screen.getByRole('button', { name: 'Build it' }));
  await waitFor(() => expect(frameDoc()).toContain("let gameKind   = 'shooter';"), { timeout: 5000 });
  expect(frameDoc()).toContain("let playerLook = 'ship';");
  expect(frameDoc()).toContain("let enemyLook  = 'alien';");
  expect(global.fetch).toHaveBeenCalledWith('http://codeit.test/api/builder/recipe', expect.objectContaining({ method: 'POST' }));
  expect(screen.getByRole('button', { name: 'Publish to my arcade' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /You: ship/ })).toBeInTheDocument();
});

test('with no server at all the game still appears, from the sentence alone', async () => {
  global.fetch = jest.fn(() => Promise.reject(new Error('offline')));
  render(<Build />);
  fireEvent.change(screen.getByLabelText('Describe the game you want to play'), { target: { value: 'a bunny that catches carrots at night' } });
  fireEvent.click(screen.getByRole('button', { name: 'Build it' }));
  await waitFor(() => expect(frameDoc()).toContain("let gameKind   = 'catch';"), { timeout: 5000 });
  expect(frameDoc()).toContain("let treasure   = 'carrot';");
  expect(frameDoc()).toContain("let skyLook    = 'night';");
});

test('a website is not a game: no error, a sentence that keeps the child\'s word, two things to try', async () => {
  global.fetch = jest.fn();
  render(<Build />);
  fireEvent.change(screen.getByLabelText('Describe the game you want to play'), { target: { value: 'a website about dogs' } });
  fireEvent.click(screen.getByRole('button', { name: 'Build it' }));
  expect(await screen.findByText(/That sounds like a website, not a game/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'a dog that catches stars' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'open the studio with your idea' })).toHaveAttribute('href', '/builder?prompt=a%20website%20about%20dogs');
  expect(global.fetch).not.toHaveBeenCalled();
  expect(document.body.textContent).not.toMatch(/error/i);
});

test('Make it builds a game from choices, one tap at a time, and names it', async () => {
  global.fetch = jest.fn();
  render(<Build />);
  fireEvent.click(screen.getByRole('tab', { name: 'Make it' }));
  await waitFor(() => expect(frameDoc()).toContain("let gameKind   = 'catch';"));
  expect(screen.getByText('Where does it happen?')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Space' }));
  await waitFor(() => expect(frameDoc()).toContain("let skyLook    = 'space';"));
  await act(async () => { await new Promise((r) => setTimeout(r, 600)); });
  expect(screen.getByText('Who are you?')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Ship' }));
  await waitFor(() => expect(frameDoc()).toContain("let playerLook = 'ship';"));
  await act(async () => { await new Promise((r) => setTimeout(r, 600)); });
  fireEvent.click(screen.getByRole('button', { name: 'Shoot things' }));
  await waitFor(() => expect(frameDoc()).toContain("let gameKind   = 'shooter';"));
  expect(frameDoc()).toContain("let gameTitle  = 'Ship Blast';");
});

test('a knob changes the live game, and See the code hands the same game to the studio', async () => {
  global.fetch = jest.fn(() => Promise.reject(new Error('offline')));
  render(<Build />);
  fireEvent.change(screen.getByLabelText('Describe the game you want to play'), { target: { value: 'dodge the bombs in space' } });
  fireEvent.click(screen.getByRole('button', { name: 'Build it' }));
  await waitFor(() => expect(frameDoc()).toContain("let gameKind   = 'dodge';"), { timeout: 5000 });
  fireEvent.click(screen.getByRole('button', { name: /Lives: 3/ }));
  await waitFor(() => expect(frameDoc()).toContain('let startLives = 5;'));
  fireEvent.click(screen.getByRole('button', { name: 'See the code' }));
  expect(mockNavigate).toHaveBeenCalledWith(expect.stringMatching(/^\/builder\?shelf=p/));
  const shelf = JSON.parse(localStorage.getItem('codeit.shelf.v1'));
  expect(shelf[0].code).toContain('let startLives = 5;');
});

test('publishing as a guest keeps the game on this device and shows the moment, with no XP invented', async () => {
  global.fetch = jest.fn(() => Promise.reject(new Error('offline')));
  render(<Build />);
  fireEvent.change(screen.getByLabelText('Describe the game you want to play'), { target: { value: 'catch coins at sunset' } });
  fireEvent.click(screen.getByRole('button', { name: 'Build it' }));
  await waitFor(() => expect(frameDoc()).toContain("let gameKind   = 'catch';"), { timeout: 5000 });
  fireEvent.click(screen.getByRole('button', { name: 'Publish to my arcade' }));
  const dialog = await screen.findByRole('dialog');
  expect(dialog).toHaveTextContent('Your first game!');
  expect(dialog).toHaveTextContent('kept on this device');
  expect(dialog).not.toHaveTextContent('XP');
  expect(screen.getByRole('button', { name: 'Keep my game' })).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem('codeit.shelf.v1'))).toHaveLength(1);
});

test('a signed-in child publishing with the Wi-Fi down is told the truth, keeps the game, and can publish again', async () => {
  const { AuthContext } = require('../../context/AuthContext');
  let online = false;
  global.fetch = jest.fn((url) => {
    if (!online) return Promise.reject(new TypeError('Failed to fetch'));
    const u = String(url);
    if (u.endsWith('/api/builder/projects')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 41 }) });
    if (u.endsWith('/api/builder/projects/41/publish')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ public_url: '/project/pub41', xp_awarded: 25 }) });
    return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
  });
  render(<AuthContext.Provider value={{ user: { id: 9, name: 'Maya', role: 'student' }, token: 'k' }}><Build /></AuthContext.Provider>);
  fireEvent.change(screen.getByLabelText('Describe the game you want to play'), { target: { value: 'catch coins at sunset' } });
  fireEvent.click(screen.getByRole('button', { name: 'Build it' }));
  await waitFor(() => expect(frameDoc()).toContain("let gameKind   = 'catch';"), { timeout: 5000 });
  fireEvent.click(screen.getByRole('button', { name: 'Publish to my arcade' }));
  const dialog = await screen.findByRole('dialog', { name: 'Saved on this device' });
  // Not "Your first game!", not "make a free account": she has one.
  expect(dialog).toHaveTextContent('Saved on this device.');
  expect(dialog).toHaveTextContent('CodeIt is not answering right now.');
  expect(dialog).toHaveTextContent('not in your arcade yet');
  expect(dialog).not.toHaveTextContent('free account');
  expect(screen.queryByRole('button', { name: 'Keep my game' })).not.toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem('codeit.shelf.v1'))).toHaveLength(1);
  expect(localStorage.getItem('codeit_first_publish_done')).toBeNull();
  // Back online: one press, one project, in the arcade, and the shelf still holds one copy.
  online = true;
  fireEvent.click(screen.getByRole('button', { name: 'Publish again' }));
  const done = await screen.findByRole('dialog', { name: 'Published' });
  expect(done).toHaveTextContent('Your first game!');
  expect(done).toHaveTextContent('in your arcade');
  expect(global.fetch.mock.calls.filter(([u]) => String(u).endsWith('/api/builder/projects'))).toHaveLength(2);
  expect(JSON.parse(localStorage.getItem('codeit.shelf.v1'))).toHaveLength(1);
});

test('the game reads back what it understood, in the child\'s own words, and any kind is one tap away', async () => {
  global.fetch = jest.fn(() => Promise.reject(new Error('offline')));
  render(<Build />);
  fireEvent.change(screen.getByLabelText('Describe the game you want to play'), { target: { value: 'a samosa that has to dodge the fork' } });
  fireEvent.click(screen.getByRole('button', { name: 'Build it' }));
  await waitFor(() => expect(frameDoc()).toContain("let gameKind   = 'dodge';"), { timeout: 5000 });
  expect(frameDoc()).toContain("let playerLook = '🥟';");
  expect(frameDoc()).toContain("let enemyLook  = '🍴';");
  const made = document.querySelector('.bd__made');
  expect(made).toHaveTextContent('Dodge things. You are the 🥟 samosa. Dodge the 🍴 fork');
  expect(screen.getByRole('button', { name: 'Dodge things', pressed: true })).toBeInTheDocument();
  // Another kind, from the same sentence.
  fireEvent.click(screen.getByRole('button', { name: /Fly through gaps/ }));
  await waitFor(() => expect(frameDoc()).toContain("let gameKind   = 'flyer';"));
  expect(frameDoc()).toContain("let playerLook = '🥟';");
});

test('an idea with no game word says so, and a studio offer only appears when the model can answer', async () => {
  global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ game: true, fits: false, ai: 'down', source: 'rules', recipe: { kind: 'catch', title: 'Unicorn Catch', player: '🦄', enemy: '💣', treasure: '🌈', sky: 'candy', speed: 2, lives: 3, winAt: 15 } }) }));
  render(<Build />);
  fireEvent.change(screen.getByLabelText('Describe the game you want to play'), { target: { value: 'a unicorn' } });
  fireEvent.click(screen.getByRole('button', { name: 'Build it' }));
  expect(await screen.findByText(/We could not tell which kind of game you meant/, {}, { timeout: 5000 })).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /Have the studio write it from scratch/ })).toBeNull();
});
