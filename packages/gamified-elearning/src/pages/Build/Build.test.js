import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import Build from './Build';

// ── Say a game, get a game ───────────────────────────────────────────────────
//
// The page's promise is a game two seconds after a sentence, with no account
// and no waiting on the full AI build. These tests type the sentence from the
// classroom on 15 October and make sure a game page is in the frame whether
// the recipe endpoint answers, refuses, or is not there at all.

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate, useLocation: () => ({ search: '' }) }), { virtual: true });
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
