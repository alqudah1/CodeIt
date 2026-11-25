// A guest who finishes a lesson presses "Start Quiz" and lands here.
//
// Until 14 November 2026 the page told them "Time to sign in again. Your
// sign-in fell asleep". Until 25 November it told them the quiz needs an
// account. Now they take the quiz, see a real score, and are offered an
// account afterwards to keep it.
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import Quiz from './Quiz';

let mockAuth = { user: null, token: null, loading: false };
jest.mock('axios');
// The quiz asks this to hand over lessons finished as a guest; it has its own tests.
jest.mock('../../utils/progressTracker', () => ({ trackLessonCompletion: jest.fn(() => Promise.resolve({})) }));
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ quizId: '3' }),
  useLocation: () => ({ search: '' }),
}), { virtual: true });
jest.mock('../../context/AuthContext', () => ({ useAuth: () => mockAuth }));
jest.mock('../../context/CharacterContext', () => {
  const ctx = { character: null, awardXP: jest.fn() };
  return { useCharacter: () => ctx };
});
jest.mock('../../hooks/usePlayerProgress', () => {
  const progress = { xp: 0 };
  return { usePlayerProgress: () => progress };
});
jest.mock('../../hooks/useCountUp', () => () => 0);
jest.mock('../../utils/voice', () => ({ setVoiceState: jest.fn(), shouldAutoRead: () => false, speak: jest.fn() }));
jest.mock('../../utils/trackEvent', () => ({ trackEvent: jest.fn() }));
jest.mock('../../components/CharacterAvatar/CharacterAvatar', () => () => null);
jest.mock('../../components/Icon/Icon', () => () => null);
// The room itself, as data: its title, its one sentence and its doors.
jest.mock('../../components/DeadEnd/DeadEnd', () => (props) => (
  <div data-testid="room">
    <h1>{props.title}</h1>
    <p>{props.line}</p>
    {props.doors.map((door) => <a key={door.label} href={door.to} data-back={door.state ? door.state.from : ''} data-primary={door.primary ? 'yes' : 'no'}>{door.label}</a>)}
  </div>
));

const doors = () => screen.getAllByRole('link').map((a) => `${a.textContent} -> ${a.getAttribute('href')}${a.dataset.back ? ` (back to ${a.dataset.back})` : ''}${a.dataset.primary === 'yes' ? ' [first]' : ''}`);

const QUESTIONS = [
  { id: 31, question: 'What does print do?', options: ['shows text', 'deletes text'] },
  { id: 32, question: 'What goes round text?', options: ['quotes', 'spoons'] },
];
const RIGHT = { 31: 'shows text', 32: 'quotes' };

function serve() {
  jest.spyOn(Math, 'random').mockReturnValue(0.5);
  axios.get.mockResolvedValue({ data: QUESTIONS });
  axios.post.mockImplementation((url, body) => {
    if (url.endsWith('/api/quiz/check')) return Promise.resolve({ data: { correct: RIGHT[body.questionId] === body.answer, correctAnswerText: RIGHT[body.questionId], explanation: '' } });
    if (url.endsWith('/api/quiz/submit')) return Promise.resolve({ data: { correctCount: 1, totalQuestions: 2, percentage: 50, xpEarned: 10 } });
    return Promise.reject(new Error('unexpected ' + url));
  });
  global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: async () => ({ completedLessons: [3] }) }));
}

beforeEach(() => { localStorage.clear(); mockNavigate.mockClear(); axios.get.mockReset(); axios.post.mockReset(); });
afterEach(() => { jest.restoreAllMocks(); });

test('a guest takes the quiz, sees their real score, and is offered an account afterwards', async () => {
  mockAuth = { user: null, token: null, loading: false };
  serve();
  render(<Quiz />);
  // The questions are asked for with no sign-in, and nothing says "needs an account".
  expect(await screen.findByText('What does print do?')).toBeInTheDocument();
  expect(axios.get.mock.calls[0][1].headers).toEqual({});
  expect(screen.queryByText(/needs an account/)).toBeNull();

  fireEvent.click(screen.getByRole('button', { name: /shows text/ }));
  fireEvent.click(await screen.findByRole('button', { name: 'Next Question' }));
  fireEvent.click(await screen.findByRole('button', { name: /spoons/ }));
  fireEvent.click(await screen.findByRole('button', { name: /See Results|Finish|Results/i }));

  // One right of two, checked by the server one at a time. Nothing was submitted.
  expect(await screen.findByText('Keep this score.')).toBeInTheDocument();
  expect(document.querySelector('.qz-score-big').textContent).toBe('1');
  expect(document.querySelector('.qz-score-total').textContent).toBe('2');
  expect(axios.post.mock.calls.some(([url]) => url.endsWith('/api/quiz/submit'))).toBe(false);
  expect(screen.queryByText(/XP earned/)).toBeNull();

  // The account door comes back to this quiz, and the answers wait for it.
  fireEvent.click(screen.getByRole('button', { name: 'Make a free account' }));
  expect(mockNavigate).toHaveBeenCalledWith('/register', { state: { from: '/quiz/3' } });
  expect(JSON.parse(localStorage.getItem('codeit.guest.quiz'))).toEqual(expect.objectContaining({ quizId: 3, answers: { 31: 'shows text', 32: 'spoons' } }));
});

test('back with an account, the score is saved without taking the quiz again', async () => {
  localStorage.setItem('codeit.guest.quiz', JSON.stringify({ quizId: 3, answers: { 31: 'shows text', 32: 'spoons' }, at: Date.now() }));
  mockAuth = { user: { id: 7, username: 'sam' }, token: 't', loading: false };
  serve();
  render(<Quiz />);
  expect(await screen.findByText('Saved to your account, from the quiz you just took.')).toBeInTheDocument();
  const submit = axios.post.mock.calls.find(([url]) => url.endsWith('/api/quiz/submit'));
  expect(submit[1]).toEqual({ quizId: 3, answers: { 31: 'shows text', 32: 'spoons' } });
  expect(submit[2].headers).toEqual({ Authorization: 'Bearer t' });
  expect(localStorage.getItem('codeit.guest.quiz')).toBeNull();
  await waitFor(() => expect(screen.getByText(/XP earned/)).toBeInTheDocument());
});

test('answers left for another quiz are not handed to this one', async () => {
  localStorage.setItem('codeit.guest.quiz', JSON.stringify({ quizId: 5, answers: { 1: 'x' }, at: Date.now() }));
  mockAuth = { user: { id: 7, username: 'sam' }, token: 't', loading: false };
  serve();
  render(<Quiz />);
  expect(await screen.findByText('What does print do?')).toBeInTheDocument();
  expect(axios.post.mock.calls.some(([url]) => url.endsWith('/api/quiz/submit'))).toBe(false);
});

test('somebody whose sign-in really did lapse is told that, and the way back to the quiz goes with them', async () => {
  // A remembered user with no token: they were signed in on this device once.
  mockAuth = { user: { id: 7, username: 'sam' }, token: null, loading: false };
  render(<Quiz />);
  expect(await screen.findByRole('heading', { name: 'Time to sign in again' })).toBeInTheDocument();
  expect(doors()).toEqual(['Log in -> /login (back to /quiz/3) [first]', 'Go home -> /']);
});
