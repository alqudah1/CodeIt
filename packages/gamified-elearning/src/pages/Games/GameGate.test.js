import { render, screen, waitFor } from '@testing-library/react';
import GameGate from './GameGate';
import { getGameById, getGameRoute } from './gameCatalog';
import { puzzleLabel } from '../Journey/JourneyPuzzle';

// ── The gate opens for a child who did the quiz ─────────────────────────────
//
// It asked /api/quiz/progress, which was never a route, so it opened for
// nobody (31 October 2026). Quiz completion lives in /api/journey/progress.

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }), { virtual: true });
// The old address is kept in the mock so the old code meets the 404 it met live.
jest.mock('../../config/api', () => ({ ENDPOINTS: { journey: { progress: 'http://codeit.test/api/journey/progress' }, quiz: { progress: 'http://codeit.test/api/quiz/progress' } } }));
jest.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: { id: 1 }, token: 't', loading: false }) }));
jest.mock('../Journey/JourneyPuzzle', () => jest.requireActual('../Journey/JourneyPuzzle'));

beforeEach(() => mockNavigate.mockClear());

function progress(body) {
  // Anything else is what the server says to an address it does not have.
  global.fetch = jest.fn((url) => Promise.resolve(url === 'http://codeit.test/api/journey/progress'
    ? { ok: true, json: async () => body }
    : { ok: false, status: 404, json: async () => ({}) }));
}

test('quiz 1 done: the gate sends the child to game 1', async () => {
  progress({ success: true, completedMiniQuizzes: [1], completedBigQuizzes: [], completedPuzzles: [] });
  render(<GameGate gameId="1" />);
  await waitFor(() => expect(mockNavigate).toHaveBeenCalled());
  expect(mockNavigate).toHaveBeenCalledWith(getGameRoute(getGameById('1')) || '/games');
});

test('quiz 2 not done: the gate says so and sends nowhere', async () => {
  progress({ success: true, completedMiniQuizzes: [1], completedBigQuizzes: [], completedPuzzles: [] });
  render(<GameGate gameId="2" />);
  await screen.findByRole('heading', { name: 'Complete Quiz 2 first' });
  expect(mockNavigate).not.toHaveBeenCalled();
});

test('a puzzle id reads as the label the journey answer uses', () => {
  expect(puzzleLabel(101)).toBe('1A');
  expect(puzzleLabel(102)).toBe('1B');
  expect(puzzleLabel(203)).toBe('2BOSS');
  expect(puzzleLabel(1203)).toBe('12BOSS');
  expect(puzzleLabel(100)).toBe('');
});
