import { render, screen } from '@testing-library/react';
import React from 'react';
import InteractiveLessonTemplate from './InteractiveLessonTemplate';
import { AuthContext } from '../../context/AuthContext';
import { getLessonData } from '../../pages/Lessons/lessonRegistry';

// ── Every lesson page must actually render ───────────────────────────────────
//
// On 1 September, round 46 shipped this line into the component body:
//
//     const studioPrompt = completionData.fromJourney ? null : lessonPrompt;
//
// completionData is null until a child finishes the lesson, so the line threw
// on the very first render. There is no error boundary above these pages, so
// React unmounted the tree and every one of the 31 lessons served a white
// screen for a day.
//
// The change shipped with a green build because its guard, studioDoor.test.js,
// reads the component as a STRING and asserts patterns in it. One of its six
// assertions required the presence of the crashing line: a test whose passing
// condition was the bug.
//
// This file is the answer to that. It mounts the real component with real
// lesson data and looks for words a child would see. A string test can be
// wrong about what the code does; a render cannot.
jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: ({ children, to, ...props }) => React.createElement('a', { href: to, ...props }, children),
    useNavigate: () => jest.fn(),
    useLocation: () => ({ pathname: '/lesson/1', search: '', state: null }),
  };
}, { virtual: true });
jest.mock('../../pages/Header/Header', () => () => null);
jest.mock('../CodeRunnerPython', () => () => null);
jest.mock('../CharacterAvatar/CharacterAvatar', () => () => null);
jest.mock('../../hooks/useSEO', () => ({ useSEO: jest.fn() }));
jest.mock('../../utils/trackEvent', () => ({ trackEvent: jest.fn(() => Promise.resolve(true)) }));
jest.mock('../../utils/progressTracker', () => ({
  trackExerciseCompletion: jest.fn(),
  trackStaticLessonCompletion: jest.fn(),
}));
jest.mock('../../context/ProgressContext', () => ({
  useProgress: () => ({ progress: {}, refreshProgress: jest.fn() }),
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

function renderLesson(id) {
  const lessonData = getLessonData(String(id));
  if (!lessonData) throw new Error(`No lesson data for ${id}`);
  return render(
    <AuthContext.Provider value={{ user: { id: 1, name: 'Test', role: 'student' }, token: 't' }}>
      <InteractiveLessonTemplate key={lessonData.id} lessonData={lessonData} />
    </AuthContext.Provider>
  );
}

describe('every lesson page renders', () => {
  // All 31, not a sample. The bug was in shared code, but so is the next one,
  // and a lesson whose own data is malformed is exactly as blank to a child.
  const ids = Array.from({ length: 31 }, (_, i) => i + 1);

  // Each of these mounts a whole lesson page. That is well under a second here
  // and was close to Jest's 5000ms default on a loaded CI runner, which is how
  // a suite goes red for a reason that has nothing to do with the product.
  const MOUNT_MS = 20000;

  test.each(ids)('lesson %i paints its first step', (id) => {
    const { container, unmount } = renderLesson(id);
    // Something was drawn: a crash leaves an empty container behind.
    expect(container.querySelector('.sl-lesson')).not.toBeNull();
    expect(container.textContent.trim().length).toBeGreaterThan(80);
    unmount();
  }, MOUNT_MS);

  test('lesson 1 shows the title and the first step, not an empty shell', () => {
    const lessonData = getLessonData('1');
    renderLesson(1);
    expect(screen.getAllByText(new RegExp(lessonData.title, 'i')).length).toBeGreaterThan(0);
    const firstStep = lessonData.steps[0];
    if (firstStep?.title) {
      expect(screen.getAllByText(new RegExp(firstStep.title.slice(0, 24), 'i')).length).toBeGreaterThan(0);
    }
  }, MOUNT_MS);
});
