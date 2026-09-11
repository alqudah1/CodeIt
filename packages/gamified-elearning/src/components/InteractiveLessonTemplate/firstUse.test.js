import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import InteractiveLessonTemplate from './InteractiveLessonTemplate';
import { AuthContext } from '../../context/AuthContext';
import lesson1 from '../../pages/Lessons/lessonData/lesson1';
import { trackExerciseCompletion, trackStaticLessonCompletion } from '../../utils/progressTracker';
import { firstUseStep } from './firstUse';
let mockSearch = '';
jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: ({ children, to, ...props }) => React.createElement('a', { href: to, ...props }, children),
    useNavigate: () => jest.fn(),
    useLocation: () => ({ pathname: '/lesson/1', search: mockSearch, state: null }),
  };
}, { virtual: true });
jest.mock('../../pages/Header/Header', () => () => null);
jest.mock('../CodeRunnerPython', () => ({ onOutput, title }) => (
  <div>
    <button onClick={() => onOutput('Hello!', 'print("Hello!")', { success: true })}>Run unchanged {title}</button>
    <button onClick={() => onOutput('I made this!', 'print("I made this!")', { success: true })}>Run changed {title}</button>
    <button onClick={() => onOutput('SyntaxError', 'print(', { success: false })}>Run error {title}</button>
  </div>
));
jest.mock('../CharacterAvatar/CharacterAvatar', () => () => null);
jest.mock('../../hooks/useSEO', () => ({ useSEO: jest.fn() }));
jest.mock('../../utils/trackEvent', () => ({ trackEvent: jest.fn(() => Promise.resolve(true)) }));
jest.mock('../../utils/progressTracker', () => ({
  trackExerciseCompletion: jest.fn(() => Promise.resolve({ xpEarned: 0 })),
  trackStaticLessonCompletion: jest.fn(() => Promise.resolve({ xpEarned: 0 })),
}));
jest.mock('../../context/ProgressContext', () => ({
  useProgress: () => ({ progress: {}, refreshProgress: jest.fn(), markLessonComplete: jest.fn() }),
}));
// The real context always supplies a default character, so the mock does too.
// A null here would be testing a state production does not have.
const testCharacter = { nickname: 'Pip', gender: 'neutral', skin: 1, hair: 1, outfit: 1 };
jest.mock('../../context/CharacterContext', () => ({
  useCharacter: () => ({ character: testCharacter, awardXP: jest.fn(), stats: { totalXP: 0 } }),
  useCharacterDisplay: () => ({ character: testCharacter }),
}));
jest.mock('../../hooks/usePlayerProgress', () => ({
  usePlayerProgress: () => ({ completedLessons: [], loading: false }),
}));
jest.mock('../../utils/quizAvailability', () => ({
  hasQuiz: () => false,
  loadQuizIds: () => Promise.resolve([]),
}));


function mount() {
  return render(<AuthContext.Provider value={{ user: null, token: null }}><InteractiveLessonTemplate lessonData={lesson1} /></AuthContext.Provider>);
}
beforeEach(() => {
  localStorage.clear();
  mockSearch = '';
  jest.clearAllMocks();
  trackExerciseCompletion.mockResolvedValue({ xpEarned: 0 });
  trackStaticLessonCompletion.mockResolvedValue({ xpEarned: 0 });
  window.scrollTo = jest.fn();
  HTMLCanvasElement.prototype.getContext = jest.fn(() => ({ clearRect() {}, beginPath() {}, arc() {}, fill() {} }));
  window.requestAnimationFrame = jest.fn();
});
test('each campaign lands on its exact activity without completing it', () => {
  mockSearch = '?activity=python-first-run';
  mount();
  expect(screen.getByRole('heading', { name: 'Your First Python Program' })).toBeInTheDocument();
  expect(trackStaticLessonCompletion).not.toHaveBeenCalled();
});
test('a message campaign preserves other finished steps', () => {
  localStorage.setItem('codeit.lesson.1.steps', JSON.stringify({ stepIdx: 1, stepsDone: { 0: true }, picks: { 1: 1 } }));
  mockSearch = '?activity=python-change-message';
  mount();
  expect(screen.getByRole('heading', { name: 'Make It Your Own' })).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem('codeit.lesson.1.steps')).stepsDone).toEqual({ 0: true });
});
test('unknown activity and other lessons keep their saved position', () => {
  expect(firstUseStep(lesson1, '?activity=not-real', 1)).toBe(1);
  expect(firstUseStep({ ...lesson1, id: 2 }, '?activity=python-first-run', 0)).toBe(0);
});
test('every lesson has a practice step, and it is the one that gates completion', () => {
  const { firstPracticeIndex } = require('./firstUse');
  for (let id = 1; id <= 31; id += 1) {
    const lesson = require(`../../pages/Lessons/lessonData/lesson${id}`).default;
    const at = firstPracticeIndex(lesson);
    expect({ id, at }).toEqual({ id, at: expect.any(Number) });
    expect(at).toBeGreaterThan(0);
    expect(lesson.steps[at].type).toBe('tryit');
  }
  expect(firstPracticeIndex({ steps: [{ type: 'concept' }] })).toBe(-1);
});
test('a prediction alone cannot expose Finish lesson', () => {
  localStorage.setItem('codeit.lesson.1.steps', JSON.stringify({ stepIdx: 1, stepsDone: { 0: true, 1: true } }));
  mount();
  expect(screen.queryByRole('button', { name: /Finish lesson and go/ })).not.toBeInTheDocument();
});
test('unchanged message cannot finish, but a changed successful run can', async () => {
  mockSearch = '?activity=python-change-message';
  mount();
  fireEvent.click(screen.getByRole('button', { name: 'Run unchanged Make It Your Own' }));
  fireEvent.click(screen.getByRole('button', { name: 'Submit Answer' }));
  expect(screen.getByText(/Change the words inside the quotes, then press Run again/)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Finish lesson and go/ })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Run changed Make It Your Own' }));
  fireEvent.click(screen.getByRole('button', { name: 'Submit Answer' }));
  fireEvent.click(screen.getByRole('button', { name: /Finish lesson and go/ }));
  expect(await screen.findByText(/Hello Python!.*finished/)).toBeInTheDocument();
  expect(trackStaticLessonCompletion).toHaveBeenCalledTimes(1);
});
test('Python errors cannot complete the example or be submitted as a message', () => {
  mockSearch = '?activity=python-first-run';
  const { unmount } = mount();
  fireEvent.click(screen.getByRole('button', { name: 'Run error Your First Python Program' }));
  expect(screen.getByRole('button', { name: 'Run the code to continue' })).toBeDisabled();
  unmount();
  mockSearch = '?activity=python-change-message';
  mount();
  fireEvent.click(screen.getByRole('button', { name: 'Run error Make It Your Own' }));
  expect(screen.getByRole('button', { name: 'Run your code first' })).toBeDisabled();
});
