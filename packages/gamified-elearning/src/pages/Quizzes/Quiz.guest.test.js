// A guest who finishes a lesson presses "Start Quiz" and lands here.
//
// Until 14 November 2026 the page told them "Time to sign in again. Your
// sign-in fell asleep", with a Log in button and no way to make an account.
// They had never signed in. It was the moment a child wanted more, and it
// read as an error about something they never had.
import { render, screen } from '@testing-library/react';
import Quiz from './Quiz';

let mockAuth = { user: null, token: null, loading: false };
jest.mock('axios');
// The quiz asks this to hand over lessons finished as a guest; it has its own tests.
jest.mock('../../utils/progressTracker', () => ({ trackLessonCompletion: jest.fn(() => Promise.resolve({})) }));
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
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

test('a guest is told what a quiz needs, and can make an account, log in, or keep learning', async () => {
  mockAuth = { user: null, token: null, loading: false };
  render(<Quiz />);
  expect(await screen.findByRole('heading', { name: 'Quiz 3 needs an account' })).toBeInTheDocument();
  expect(screen.getByText(/An account is free, and you come straight back to this quiz\./)).toBeInTheDocument();
  expect(screen.queryByText(/fell asleep/)).toBeNull();
  expect(doors()).toEqual([
    'Make a free account -> /register (back to /quiz/3) [first]',
    'Log in -> /login (back to /quiz/3)',
    'Keep learning without one -> /lessons',
  ]);
});

test('somebody whose sign-in really did lapse is told that, and the way back to the quiz goes with them', async () => {
  // A remembered user with no token: they were signed in on this device once.
  mockAuth = { user: { id: 7, username: 'sam' }, token: null, loading: false };
  render(<Quiz />);
  expect(await screen.findByRole('heading', { name: 'Time to sign in again' })).toBeInTheDocument();
  expect(doors()).toEqual(['Log in -> /login (back to /quiz/3) [first]', 'Go home -> /']);
});
