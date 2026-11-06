// Three hearts a quiz, one lost per wrong answer. Out of hearts is a pause,
// not a wall: start again with three, or keep going without them.

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import Quiz, { Hearts } from './Quiz';

jest.mock('axios');
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useParams: () => ({ quizId: '12' }), // past the lesson gate (lessons 1 to 10 check progress first)
  useLocation: () => ({ search: '' }),
}), { virtual: true });
jest.mock('../../context/AuthContext', () => {
  // One object, so the effects keyed on `user` run once.
  const auth = { user: { id: 7, username: 'sam' }, token: 't', loading: false };
  return { useAuth: () => auth };
});
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
jest.mock('../../components/DeadEnd/DeadEnd', () => () => null);
jest.mock('../../components/Icon/Icon', () => () => null);

const QUESTIONS = Array.from({ length: 5 }, (_, i) => ({
  id: 100 + i,
  question: `Question ${i + 1}?`,
  options: [{ text: 'right', value: 'right' }, { text: 'wrong', value: 'wrong' }],
}));

function setup() {
  // The quiz shuffles questions and options; a comparator of 0 keeps their order.
  jest.spyOn(Math, 'random').mockReturnValue(0.5);
  axios.get.mockResolvedValue({ data: { questions: QUESTIONS } });
  axios.post.mockImplementation((url, body) => {
    if (url.endsWith('/api/quiz/check')) {
      const correct = body.answer === 'right';
      return Promise.resolve({ data: { correct, correctAnswerText: 'right', explanation: '' } });
    }
    return Promise.resolve({ data: { score: 1, total: 5 } });
  });
  global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: async () => ({ completedLessons: [] }) }));
  return render(<Quiz />);
}

const hearts = () => screen.getByRole('img', { name: /hearts/ });
const answer = (which) => fireEvent.click(screen.getByRole('button', { name: new RegExp(`\\b${which}\\b`) }));
const next = async () => fireEvent.click(await screen.findByRole('button', { name: 'Next Question' }));

test('the Hearts row shows full and lost hearts', () => {
  const { container } = render(<Hearts left={1} />);
  expect(container.querySelectorAll('.qz-heart.is-full')).toHaveLength(1);
  expect(container.querySelectorAll('.qz-heart.is-lost')).toHaveLength(2);
  expect(screen.getByRole('img', { name: '1 of 3 hearts left' })).toBeInTheDocument();
});

test('a wrong answer costs a heart, a right one does not', async () => {
  setup();
  await screen.findByText('Question 1?');
  expect(hearts()).toHaveAttribute('aria-label', '3 of 3 hearts left');
  answer('wrong');
  await screen.findByRole('button', { name: 'Next Question' });
  expect(hearts()).toHaveAttribute('aria-label', '2 of 3 hearts left');
  await next();
  await screen.findByText('Question 2?');
  answer('right');
  await screen.findByRole('button', { name: 'Next Question' });
  expect(hearts()).toHaveAttribute('aria-label', '2 of 3 hearts left');
});

test('out of hearts: start again with three, or keep going without', async () => {
  setup();
  await screen.findByText('Question 1?');
  for (let i = 0; i < 3; i += 1) {
    answer('wrong');
    await screen.findByRole('button', { name: 'Next Question' });
    if (i < 2) { await next(); await screen.findByText(`Question ${i + 2}?`); }
  }
  expect(hearts()).toHaveAttribute('aria-label', '0 of 3 hearts left');
  await next();
  expect(await screen.findByText('Out of hearts.')).toBeInTheDocument();
  expect(screen.getByText(/0 right out of 3 so far/)).toBeInTheDocument();

  // Keep going: hearts are off, a wrong answer costs nothing, and the quiz goes on.
  fireEvent.click(screen.getByRole('button', { name: 'Keep going without hearts' }));
  await screen.findByText('Question 4?');
  expect(screen.getByRole('img', { name: 'Hearts off' })).toBeInTheDocument();
  answer('wrong');
  await screen.findByRole('button', { name: 'Next Question' });
  await next();
  await screen.findByText('Question 5?');
  expect(screen.queryByText('Out of hearts.')).toBeNull();
});

test('try again with three hearts starts the quiz over', async () => {
  setup();
  await screen.findByText('Question 1?');
  for (let i = 0; i < 3; i += 1) {
    answer('wrong');
    await screen.findByRole('button', { name: 'Next Question' });
    if (i < 2) { await next(); await screen.findByText(`Question ${i + 2}?`); }
  }
  await next();
  fireEvent.click(await screen.findByRole('button', { name: 'Try again with 3 hearts' }));
  await screen.findByText(/Question \d\?/);
  expect(hearts()).toHaveAttribute('aria-label', '3 of 3 hearts left');
  expect(document.querySelector('.qz-progress-text').textContent.replace(/\s+/g, ' ').trim()).toBe('1 / 5');
});
