// Lesson 1 is the model for the rest: do first, then explain; every step ends
// in something that moves; one voice per screen. These hold the lesson to its
// own rules and drive the page the way a child would.

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import InteractiveLessonTemplate from './InteractiveLessonTemplate';
import LessonStage, { stageLines } from './LessonStage';
import CodeParts from './CodeParts';
import { checkCodeStep } from './interactionGrading';
import { AuthContext } from '../../context/AuthContext';
import lesson1 from '../../pages/Lessons/lessonData/lesson1';
import { trackExerciseCompletion, trackStaticLessonCompletion } from '../../utils/progressTracker';

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
jest.mock('../CodeRunnerPython', () => ({ onOutput, onBusy, title }) => (
  <div>
    <button onClick={() => onBusy(true)}>Press Run {title}</button>
    <button onClick={() => { onBusy(false); onOutput('Hello!', 'print("Hello!")', { success: true }); }}>Run unchanged {title}</button>
    <button onClick={() => { onBusy(false); onOutput('I am Sam', 'print("I am Sam")', { success: true }); }}>Run changed {title}</button>
    <button onClick={() => { onBusy(false); onOutput('SyntaxError', 'print(', { success: false }); }}>Run error {title}</button>
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
const pixelSays = () => Array.from(document.querySelectorAll('.ls__say')).map((el) => el.textContent);
beforeEach(() => {
  localStorage.clear();
  mockSearch = '';
  trackExerciseCompletion.mockResolvedValue({ xpEarned: 0 });
  trackStaticLessonCompletion.mockResolvedValue({ xpEarned: 0 });
  window.scrollTo = jest.fn();
  HTMLCanvasElement.prototype.getContext = jest.fn(() => ({ clearRect() {}, beginPath() {}, arc() {}, fill() {} }));
  window.requestAnimationFrame = jest.fn();
});

// ── The rules, read off the lesson itself ───────────────────────────────────

test('do first: the lesson opens on a step that runs, and the explanation comes after it', () => {
  const types = lesson1.steps.map((s) => s.type);
  expect(types[0]).toBe('example');
  expect(types.indexOf('concept')).toBe(1);
  // The two public activity links still find their steps by id.
  expect(lesson1.steps.map((s) => s.id)).toEqual(expect.arrayContaining(['example', 'tryit']));
});

test('every step that is not the explanation has Pixel on a stage, with one short thing to say', () => {
  for (const step of lesson1.steps) {
    if (step.type === 'concept') { expect(step.parts.pieces.length).toBeGreaterThan(0); continue; }
    expect({ id: step.id, stage: step.stage }).toEqual({ id: step.id, stage: 'say' });
    expect(step.idle.length).toBeLessThanOrEqual(70);
    // A step answered by tapping plays what its code prints once it is right.
    if (step.type === 'predict' || step.type === 'fillblank') expect(step.plays.length).toBeGreaterThan(0);
  }
});

test('nothing a child has to read on a step is longer than a text message', () => {
  for (const step of lesson1.steps) {
    const text = step.description || step.body || step.question || '';
    expect({ id: step.id, short: text.length <= 110 }).toEqual({ id: step.id, short: true });
  }
});

test('what a guess plays is what its code really prints', () => {
  const guess = lesson1.steps.find((s) => s.id === 'predict-print');
  expect(guess.plays.join('\n')).toBe(guess.choices[guess.correct]);
  const gap = lesson1.steps.find((s) => s.id === 'fix-pixel');
  expect(gap.template.replace('___', gap.answers[0])).toBe(`print("${gap.plays[0]}")`);
});

test('the joke has to be three lines and has to be the child\'s own', () => {
  const joke = lesson1.steps.find((s) => s.id === 'challenge');
  const grade = (code, output) => checkCodeStep(joke, { code, output });
  expect(grade(joke.code, 'Knock knock!\nWho is there?\nPython!')).toEqual({ passed: false, reason: 'unchanged-output' });
  expect(grade('print("a")\nprint("b")', 'a\nb')).toEqual({ passed: false, reason: 'wrong-output' });
  expect(grade('print("a")\nprint("b")\nprint("c")', 'a\nb\nc')).toEqual({ passed: true });
});

// ── The stage ───────────────────────────────────────────────────────────────

test('output becomes the lines Pixel says; blank lines are not lines', () => {
  expect(stageLines('Hello\n\nPython  \n')).toEqual(['Hello', 'Python']);
  expect(stageLines('')).toEqual([]);
  expect(stageLines(undefined)).toEqual([]);
});

test('Pixel says up to four lines and counts the rest', () => {
  const { rerender } = render(<LessonStage lines={[]} idle="Press Run." />);
  expect(pixelSays()).toEqual(['Press Run.']);
  expect(document.querySelector('.mascot').dataset.mood).toBe('base');
  rerender(<LessonStage lines={['a', 'b', 'c', 'd', 'e', 'f']} runKey={1} idle="Press Run." />);
  expect(pixelSays()).toEqual(['a', 'b', 'c', 'd', 'and 2 more lines']);
  expect(document.querySelector('.mascot').dataset.mood).toBe('happy');
  // While the code is running the old words are gone and Pixel is thinking.
  rerender(<LessonStage lines={['a']} runKey={1} idle="Press Run." thinking />);
  expect(pixelSays()).toHaveLength(1);
  expect(screen.getByLabelText('Thinking')).toBeInTheDocument();
});

test('the pieces of a line say what they are for when tapped, and brackets are one idea', () => {
  const concept = lesson1.steps.find((s) => s.type === 'concept');
  render(<CodeParts parts={concept.parts} />);
  expect(screen.getByText('Tap a piece to see what it does.')).toBeInTheDocument();
  expect(screen.queryByText('Brackets hold what to say.')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: '(' }));
  expect(screen.getByText('Brackets hold what to say.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: ')' })).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByText('2 more to tap.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'print' }));
  fireEvent.click(screen.getByRole('button', { name: '"Hello!"' }));
  expect(screen.queryByText(/more to tap/)).toBeNull();
  expect(document.querySelectorAll('.ls-parts__note')).toHaveLength(3);
});

// ── The page, the way a child meets it ──────────────────────────────────────

test('the first screen is Pixel and a Run button, with no instructions panel and no story box', () => {
  mount();
  expect(screen.getByRole('heading', { name: 'Your First Python Program' })).toBeInTheDocument();
  expect(pixelSays()).toEqual(['Hi, I am Pixel! Press the orange Run button and I will say it.']);
  expect(screen.queryByLabelText('What to do now')).toBeNull();
  expect(document.querySelector('.sl-story')).toBeNull();
});

test('Run makes Pixel say the real output; an error says nothing', () => {
  mount();
  fireEvent.click(screen.getByRole('button', { name: 'Press Run Your First Python Program' }));
  expect(screen.getByLabelText('Thinking')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Run unchanged Your First Python Program' }));
  expect(pixelSays()).toEqual(['Hello!']);
  fireEvent.click(screen.getByRole('button', { name: 'Run error Your First Python Program' }));
  expect(pixelSays()).toEqual(['Hi, I am Pixel! Press the orange Run button and I will say it.']);
});

test('the child\'s own words come out of Pixel\'s mouth', () => {
  mockSearch = '?activity=python-change-message';
  mount();
  expect(pixelSays()).toEqual(['Change my words. Then press Run!']);
  fireEvent.click(screen.getByRole('button', { name: 'Run changed Make It Your Own' }));
  expect(pixelSays()).toEqual(['I am Sam']);
});

test('a right guess plays the two lines; a wrong one makes Pixel doubtful and plays nothing', () => {
  const at = lesson1.steps.findIndex((s) => s.id === 'predict-print');
  localStorage.setItem('codeit.lesson.1.steps', JSON.stringify({ stepIdx: at, stepsDone: {} }));
  mount();
  expect(pixelSays()).toEqual(['Two prints this time. What will I say?']);
  const choices = within(screen.getByRole('group', { name: 'Choose the output' })).getAllByRole('button');
  fireEvent.click(choices[0]);
  fireEvent.click(screen.getByRole('button', { name: 'Check my answer' }));
  expect(document.querySelector('.ls .mascot').dataset.mood).toBe('hmm');
  expect(pixelSays()).toEqual(['Two prints this time. What will I say?']);
  fireEvent.click(choices[1]);
  fireEvent.click(screen.getByRole('button', { name: 'Check my new answer' }));
  expect(pixelSays()).toEqual(['Hello', 'Python']);
});

test('the explanation step has the tappable line and no instructions panel', () => {
  localStorage.setItem('codeit.lesson.1.steps', JSON.stringify({ stepIdx: 1, stepsDone: { 0: true } }));
  mount();
  expect(screen.getByRole('heading', { name: 'What Just Happened?' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'print' })).toBeInTheDocument();
  expect(screen.queryByLabelText('What to do now')).toBeNull();
});

test('a lesson that has not been rebuilt keeps its panel and has no stage', () => {
  const lesson2 = require('../../pages/Lessons/lessonData/lesson2').default;
  render(<AuthContext.Provider value={{ user: null, token: null }}><InteractiveLessonTemplate lessonData={lesson2} /></AuthContext.Provider>);
  expect(screen.getByLabelText('What to do now')).toBeInTheDocument();
  expect(document.querySelector('.ls')).toBeNull();
});
