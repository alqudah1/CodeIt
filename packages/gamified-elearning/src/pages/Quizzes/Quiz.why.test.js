// A wrong answer says why. An answer that never reached the server is not
// called wrong. A low score offers the lesson and another go first.
//
// 17 November 2026, a quiz taken as a child on a phone:
//   · every wrong answer said "Not quite. The correct answer is 60." and
//     stopped. Each question has an explanation in the database; the server
//     never sent it (packages/codeit-backend/routes/quiz.js);
//   · with the internet gone, an answer was marked wrong with the words
//     Not quite. The correct answer is "null".;
//   · and when the score could not be saved the page showed 0 out of 4 under
//     "Network Error", to a child who had got them right;
//   · one right out of four said "Go back to the lesson ... then retry" above
//     a small grey Retry, no way back to the lesson, and a large yellow
//     button to go and build something else.

import fs from 'fs';
import path from 'path';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import Quiz from './Quiz';

const mockNavigate = jest.fn();
jest.mock('axios');
jest.mock('../../utils/progressTracker', () => ({ trackLessonCompletion: jest.fn(() => Promise.resolve({})) }));
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ quizId: '12' }),
  useLocation: () => ({ search: '' }),
}), { virtual: true });
jest.mock('../../context/AuthContext', () => {
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
jest.mock('../../components/DeadEnd/DeadEnd', () => ({ title, line }) => <div data-testid="deadend">{title} {line}</div>);
jest.mock('../../components/Icon/Icon', () => () => null);

const QUESTIONS = Array.from({ length: 4 }, (_, i) => ({
  id: 100 + i,
  question: `Question ${i + 1}?`,
  options: [{ text: 'right', value: 'right' }, { text: 'wrong', value: 'wrong' }],
}));
const WHY = 'total grows each lap: 10, then 30, then 60.';

function setup({ check, submit } = {}) {
  jest.spyOn(Math, 'random').mockReturnValue(0.5);
  mockNavigate.mockClear();
  axios.get.mockResolvedValue({ data: { questions: QUESTIONS } });
  axios.post.mockImplementation((url, body) => {
    if (url.endsWith('/api/quiz/check')) {
      if (check) return check(body);
      return Promise.resolve({ data: { correct: body.answer === 'right', correctAnswerText: 'right', explanation: WHY } });
    }
    if (submit) return submit(body);
    return Promise.resolve({ data: { correctCount: 1, totalQuestions: 4, percentage: 25, xpEarned: 10 } });
  });
  global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: async () => ({ completedLessons: [] }) }));
  return render(<Quiz />);
}
const answer = (which) => fireEvent.click(screen.getByRole('button', { name: new RegExp(`\\b${which}\\b`) }));
const next = async (name = 'Next Question') => fireEvent.click(await screen.findByRole('button', { name }));
const hearts = () => screen.getByRole('img', { name: /hearts/ });
async function take(answers) {
  for (let i = 0; i < answers.length; i += 1) {
    await screen.findByText(`Question ${i + 1}?`);
    answer(answers[i]);
    await next(i < answers.length - 1 ? 'Next Question' : 'See Results');
  }
}

afterEach(() => { jest.restoreAllMocks(); });

test('a wrong answer says what was right and why', async () => {
  setup();
  await screen.findByText('Question 1?');
  answer('wrong');
  expect(await screen.findByText('Not quite. The correct answer is "right".')).toBeInTheDocument();
  expect(screen.getByText(WHY)).toHaveClass('qz-feedback-explanation');
});

test('a right answer says why too', async () => {
  setup();
  await screen.findByText('Question 1?');
  answer('right');
  expect(await screen.findByText('Correct!')).toBeInTheDocument();
  expect(screen.getByText(WHY)).toBeInTheDocument();
});

test('the explanations are under the questions missed, where the result says they are', async () => {
  setup();
  await take(['wrong', 'right', 'wrong', 'right']);
  expect(await screen.findByText('Questions you missed')).toBeInTheDocument();
  expect(screen.getAllByText(WHY)).toHaveLength(2);
  for (const why of screen.getAllByText(WHY)) expect(why).toHaveClass('qz-missed-explanation');
});

test('an answer that did not reach the server is not called wrong, costs no heart, and can be pressed again', async () => {
  let online = false;
  setup({ check: (body) => (online
    ? Promise.resolve({ data: { correct: body.answer === 'right', correctAnswerText: 'right', explanation: WHY } })
    : Promise.reject(new Error('Network Error'))) });
  await screen.findByText('Question 1?');
  answer('right');
  expect(await screen.findByText('That did not get through, so it was not counted.')).toBeInTheDocument();
  expect(screen.getByText('Check the internet, then press your answer again.')).toBeInTheDocument();
  expect(screen.queryByText(/null/)).toBeNull();
  expect(screen.queryByText(/Not quite/)).toBeNull();
  expect(hearts()).toHaveAttribute('aria-label', '3 of 3 hearts left');
  expect(screen.queryByRole('button', { name: 'Next Question' })).toBeNull();
  // The same answer, now that the internet is back.
  online = true;
  expect(screen.getByRole('button', { name: /\bright\b/ })).not.toBeDisabled();
  answer('right');
  expect(await screen.findByText('Correct!')).toBeInTheDocument();
  expect(screen.queryByText('That did not get through, so it was not counted.')).toBeNull();
});

test('a sign-in that ran out in the middle of a quiz goes to the room that says so', async () => {
  setup({ check: () => Promise.reject(Object.assign(new Error('Forbidden'), { response: { status: 403 } })) });
  await screen.findByText('Question 1?');
  answer('right');
  expect(await screen.findByTestId('deadend')).toHaveTextContent(/sign/i);
});

test('a score that could not be saved is still the score, and the page says what is missing', async () => {
  setup({ submit: () => Promise.reject(new Error('Network Error')) });
  await take(['right', 'right', 'right', 'wrong']);
  await waitFor(() => expect(document.querySelector('.qz-score-big')).toHaveTextContent('3'));
  expect(document.querySelector('.qz-score-total')).toHaveTextContent('4');
  expect(screen.getByText(/Your score could not be saved, so no XP was added\./)).toBeInTheDocument();
  expect(screen.queryByText('Network Error')).toBeNull();
});

test('under half right: Try again and Back to the lesson are the buttons, in that order', async () => {
  setup();   // the server says 1 of 4
  await take(['wrong', 'right', 'wrong', 'wrong']);
  const again = await screen.findByRole('button', { name: 'Try again' });
  const lesson = screen.getByRole('button', { name: 'Back to Lesson 12' });
  expect(again).toHaveClass('qz-btn-forward');
  expect(again.compareDocumentPosition(lesson) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  fireEvent.click(lesson);
  expect(mockNavigate).toHaveBeenCalledWith('/lesson/12');
});

test('half or more right: the way on leads, and trying again is the quiet one', async () => {
  setup({ submit: () => Promise.resolve({ data: { correctCount: 3, totalQuestions: 4, percentage: 75, xpEarned: 30 } }) });
  await take(['right', 'right', 'right', 'wrong']);
  const again = await screen.findByRole('button', { name: 'Try again' });
  expect(again).toHaveClass('qz-btn-retry');
  expect(screen.queryByRole('button', { name: 'Back to Lesson 12' })).toBeNull();
});

test('the words on the quiz buttons are ink, not white on a fade', () => {
  const css = fs.readFileSync(path.join(__dirname, 'Quiz.css'), 'utf8');
  const last = (selector) => { const all = [...css.matchAll(new RegExp(`${selector}[^{]*\\{([^}]*)\\}`, 'g'))]; return all[all.length - 1][1]; };
  expect(last('\\.qz-btn-next,\\s*\\.qz-btn-forward ')).toMatch(/color: var\(--ink, #35220E\)/);
  expect(last('\\.qz-btn-next,\\s*\\.qz-btn-forward ')).toMatch(/background: var\(--arc-orange, #FF7A00\)/);
  expect(last('\\.qz-opt--wrong ')).toMatch(/color: var\(--ink, #35220E\)/);
});
