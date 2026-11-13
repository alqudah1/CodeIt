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
import lesson2 from '../../pages/Lessons/lessonData/lesson2';
import lesson3 from '../../pages/Lessons/lessonData/lesson3';
import lesson4 from '../../pages/Lessons/lessonData/lesson4';
import lesson5 from '../../pages/Lessons/lessonData/lesson5';
import lesson6 from '../../pages/Lessons/lessonData/lesson6';
import lesson7 from '../../pages/Lessons/lessonData/lesson7';
import lesson8 from '../../pages/Lessons/lessonData/lesson8';
import lesson9 from '../../pages/Lessons/lessonData/lesson9';
import lesson10 from '../../pages/Lessons/lessonData/lesson10';
import lesson11 from '../../pages/Lessons/lessonData/lesson11';
import lesson12 from '../../pages/Lessons/lessonData/lesson12';
import lesson13 from '../../pages/Lessons/lessonData/lesson13';
import lesson14 from '../../pages/Lessons/lessonData/lesson14';
import lesson15 from '../../pages/Lessons/lessonData/lesson15';
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
    <button onClick={() => { onBusy(false); onOutput('SyntaxError', 'print(', { success: false, say: 'Line 1: a quote mark is missing.' }); }}>Run error {title}</button>
    <button onClick={() => { onBusy(false); onOutput('Sam\n9', 'name = "Sam"\nage = 9\nprint(name)\nprint(age)', { success: true, vars: [{ name: 'name', type: 'str', text: '"Sam"' }, { name: 'age', type: 'int', text: '9' }] }); }}>Run boxes {title}</button>
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

function mount(lesson = lesson1) {
  return render(<AuthContext.Provider value={{ user: null, token: null }}><InteractiveLessonTemplate lessonData={lesson} /></AuthContext.Provider>);
}
// The lessons rebuilt on the model so far. Add a lesson here when it is rebuilt.
const REBUILT = [lesson1, lesson2, lesson3, lesson4, lesson5, lesson6, lesson7, lesson8, lesson9, lesson10, lesson11, lesson12, lesson13, lesson14, lesson15];
const boxesOnShelf = () => Array.from(document.querySelectorAll('.ls__box:not(.ls__box--empty)')).map((el) => [el.querySelector('.ls__box-name').textContent, el.querySelector('.ls__box-val').textContent]);
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

test('do first: a rebuilt lesson opens on a step that runs, and the explanation comes after it', () => {
  for (const lesson of REBUILT) {
    const types = lesson.steps.map((s) => s.type);
    expect({ id: lesson.id, first: types[0], explained: types.indexOf('concept') }).toEqual({ id: lesson.id, first: 'example', explained: 1 });
    expect(types[types.length - 1]).toBe('challenge');
  }
  // The two public activity links still find their steps by id.
  expect(lesson1.steps.map((s) => s.id)).toEqual(expect.arrayContaining(['example', 'tryit']));
});

test('every step that is not the explanation has Pixel on a stage, with one short thing to say', () => {
  for (const lesson of REBUILT) for (const step of lesson.steps) {
    const at = `${lesson.id}:${step.id}`;
    if (step.type === 'concept') { expect(step.parts.pieces.length).toBeGreaterThan(0); continue; }
    expect({ at, staged: ['say', 'boxes'].includes(step.stage) }).toEqual({ at, staged: true });
    expect({ at, short: step.idle.length <= 70 }).toEqual({ at, short: true });
    // A step answered by tapping plays what its code prints once it is right.
    if (step.type === 'predict' || step.type === 'fillblank') expect(step.plays.length).toBeGreaterThan(0);
    // The practice and the last step must be the child's own: the starter, run unchanged, does not pass.
    if (step.type === 'tryit' || step.type === 'challenge') expect({ at, own: typeof step.expectedDifferentOutput }).toEqual({ at, own: 'string' });
  }
});

test('nothing a child has to read on a step is longer than a text message', () => {
  for (const lesson of REBUILT) for (const step of lesson.steps) {
    const text = step.description || step.body || step.question || '';
    const at = `${lesson.id}:${step.id}`;
    expect({ at, short: text.length <= 110 }).toEqual({ at, short: true });
  }
});

test('what a guess plays is what its code really prints', () => {
  const guess = lesson1.steps.find((s) => s.id === 'predict-print');
  expect(guess.plays.join('\n')).toBe(guess.choices[guess.correct]);
  const gap = lesson1.steps.find((s) => s.id === 'fix-pixel');
  expect(gap.template.replace('___', gap.answers[0])).toBe(`print("${gap.plays[0]}")`);
  // Lesson 2: the box and the bubble agree with the code and with the right answer.
  const box = lesson2.steps.find((s) => s.id === 'predict-variable');
  expect(box.plays).toEqual([box.choices[box.correct]]);
  expect(box.boxes).toEqual([{ name: 'score', type: 'int', text: box.choices[box.correct] }]);
  const named = lesson2.steps.find((s) => s.id === 'name-the-box');
  expect(named.template.replace('___', named.answers[0])).toBe('food = "pizza"\nprint(food)');
  expect(named.boxes).toEqual([{ name: 'food', type: 'str', text: '"pizza"' }]);
  expect(named.plays).toEqual(['pizza']);
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
  const long = ['one long line of words', 'two long lines of words', 'c', 'd', 'e', 'f'];
  rerender(<LessonStage lines={long} runKey={1} idle="Press Run." />);
  expect(pixelSays()).toEqual([...long.slice(0, 4), 'and 2 more lines']);
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

test('Run makes Pixel say the real output; after an error Pixel says what to look for', () => {
  mount();
  fireEvent.click(screen.getByRole('button', { name: 'Press Run Your First Python Program' }));
  expect(screen.getByLabelText('Thinking')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Run unchanged Your First Python Program' }));
  expect(pixelSays()).toEqual(['Hello!']);
  fireEvent.click(screen.getByRole('button', { name: 'Run error Your First Python Program' }));
  expect(pixelSays()).toEqual(['Line 1: a quote mark is missing.']);
  expect(document.querySelector('.ls .mascot').dataset.mood).toBe('hmm');
  // Fixed and run again: the error is gone and Pixel is talking.
  fireEvent.click(screen.getByRole('button', { name: 'Run unchanged Your First Python Program' }));
  expect(pixelSays()).toEqual(['Hello!']);
  expect(document.querySelector('.ls .mascot').dataset.mood).toBe('happy');
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

test('in every rebuilt lesson, a guess or a gap plays what the right answer really prints', () => {
  for (const lesson of REBUILT) for (const step of lesson.steps) {
    const at = `${lesson.id}:${step.id}`;
    if (step.type === 'predict') expect({ at, plays: step.plays.join('\n') }).toEqual({ at, plays: step.choices[step.correct] });
    if (step.type === 'fillblank') {
      // The right answers are among the options, and exactly as many as there are gaps.
      expect({ at, gaps: step.template.split('___').length - 1 }).toEqual({ at, gaps: step.answers.length });
      for (const answer of step.answers) expect(step.options).toContain(answer);
    }
  }
});

test('a loop that counts is said in a row, not stacked to the ceiling', () => {
  render(<LessonStage lines={['0', '1', '2', '3', '4']} runKey={1} />);
  expect(document.querySelector('.ls__says--row')).not.toBeNull();
  expect(pixelSays()).toEqual(['0', '1', '2', '3', '4']);
});

test('long lines stay stacked, four at most', () => {
  render(<LessonStage lines={['Coding is fun, yes it is!', 'b', 'c', 'd', 'e']} runKey={1} />);
  expect(document.querySelector('.ls__says--row')).toBeNull();
  expect(pixelSays()).toHaveLength(5);
});

test('lesson 2: Run puts a box on the shelf for every variable, and an error clears it', () => {
  mount(lesson2);
  expect(screen.getByRole('heading', { name: 'Your First Variable' })).toBeInTheDocument();
  expect(screen.getByLabelText('No boxes yet')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Run boxes Your First Variable' }));
  expect(boxesOnShelf()).toEqual([['name', '"Sam"'], ['age', '9']]);
  expect(pixelSays()).toEqual(['Sam', '9']);
  expect(document.querySelector('.ls__box--text .ls__box-name').textContent).toBe('name');
  expect(document.querySelector('.ls__box--number .ls__box-name').textContent).toBe('age');
  fireEvent.click(screen.getByRole('button', { name: 'Run error Your First Variable' }));
  expect(boxesOnShelf()).toEqual([]);
});

test('lesson 2: a right guess shows the one box and what it holds at the end', () => {
  const at = lesson2.steps.findIndex((s) => s.id === 'predict-variable');
  localStorage.setItem('codeit.lesson.2.steps', JSON.stringify({ stepIdx: at, stepsDone: {} }));
  mount(lesson2);
  expect(boxesOnShelf()).toEqual([]);
  const choices = within(screen.getByRole('group', { name: 'Choose the output' })).getAllByRole('button');
  fireEvent.click(choices[1]);
  fireEvent.click(screen.getByRole('button', { name: 'Check my answer' }));
  expect(boxesOnShelf()).toEqual([['score', '25']]);
  expect(pixelSays()).toEqual(['25']);
});

test('a list is one box with a slot for every item, numbered from 0', () => {
  render(<LessonStage boxes={[{ name: 'pets', type: 'list', text: "['cat', 'dog']", items: ['"cat"', '"dog"'], more: 2 }]} runKey={1} />);
  const slots = Array.from(document.querySelectorAll('.ls__box--list .ls__slot')).map((el) => el.textContent);
  expect(slots).toEqual(['"cat"0', '"dog"1', '+2']);
  expect(screen.getByLabelText("pets is a list: ['cat', 'dog']")).toBeInTheDocument();
});

test('lesson 1 has no shelf: the stage only shows boxes when a step asks for them', () => {
  mount();
  expect(document.querySelector('.ls__shelf')).toBeNull();
});

test('a lesson that has not been rebuilt keeps its panel and has no stage', () => {
  const lesson16 = require('../../pages/Lessons/lessonData/lesson16').default;
  render(<AuthContext.Provider value={{ user: null, token: null }}><InteractiveLessonTemplate lessonData={lesson16} /></AuthContext.Provider>);
  expect(screen.getByLabelText('What to do now')).toBeInTheDocument();
  expect(document.querySelector('.ls')).toBeNull();
});

// ── Predict, then Run (PRIMM) ───────────────────────────────────────────────
describe('guess first', () => {
  test('every rebuilt lesson asks for a guess before its first Run, with three different things to tap', () => {
    for (const lesson of REBUILT) {
      const first = lesson.steps[0];
      expect({ id: lesson.id, guesses: Array.isArray(first.guess) ? new Set(first.guess).size : 0 }).toEqual({ id: lesson.id, guesses: 3 });
    }
  });

  test('a right guess is told so after the real run, and Run was never waiting for it', () => {
    mount();
    const group = screen.getByRole('group', { name: 'Guess first: what will Pixel say?' });
    fireEvent.click(within(group).getByRole('button', { name: 'Hello!' }));
    expect(within(group).getByRole('button', { name: 'Hello!' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('status')).toBeNull();          // nothing is given away before the run
    fireEvent.click(screen.getByRole('button', { name: 'Run unchanged Your First Python Program' }));
    expect(screen.getByText('You guessed it!')).toBeInTheDocument();
    expect(within(screen.getByRole('group', { name: 'Your guess' })).getByRole('button', { name: 'Hello!' })).toBeDisabled();
  });

  test('a wrong guess is a surprise, not a failure: the step is still done', () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'print' }));
    fireEvent.click(screen.getByRole('button', { name: 'Run unchanged Your First Python Program' }));
    expect(screen.getByText('Surprise! Pixel said Hello!. Now you know.')).toBeInTheDocument();
    expect(document.querySelector('.sl-tag--done')).not.toBeNull();
  });

  test('no guess, no verdict: Run alone works exactly as before', () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Run unchanged Your First Python Program' }));
    expect(pixelSays()).toEqual(['Hello!']);
    expect(screen.queryByText(/You guessed it|Surprise/)).toBeNull();
    expect(document.querySelector('.sl-tag--done')).not.toBeNull();
  });

  test('the stage can read its words aloud, so a phone needs no floating guide', () => {
    mount();
    expect(screen.getByRole('button', { name: 'Read to me' })).toBeInTheDocument();
    expect(document.querySelector('.sl-lesson--staged')).not.toBeNull();
  });
});
