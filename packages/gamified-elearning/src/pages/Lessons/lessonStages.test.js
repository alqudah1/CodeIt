import { STAGES, STAGE_BAND, stageOfLesson, stageProgress } from './lessonStages';
import { ROW_HEIGHT, stopY } from './LessonMap';
import { TOTAL_LESSONS } from './lessonRegistry';

// ── Four lands, every lesson in exactly one, the castle after the last ──────

jest.mock('react-router-dom', () => ({ Link: () => null, useNavigate: () => jest.fn() }), { virtual: true });
jest.mock('../../context/AuthContext', () => ({ useAuth: () => ({ token: null }) }));
jest.mock('../../context/CharacterContext', () => ({ useCharacterDisplay: () => ({ character: {} }) }));

test('the stages cover lessons 1 to 31 once each, in order', () => {
  let next = 1;
  for (const s of STAGES) { expect(s.from).toBe(next); expect(s.to).toBeGreaterThanOrEqual(s.from); next = s.to + 1; }
  expect(next - 1).toBe(TOTAL_LESSONS);
  expect(stageOfLesson(1).name).toBe('Beginner');
  expect(stageOfLesson(16).name).toBe('Intermediate');
  expect(stageOfLesson(17).name).toBe('Advanced');
  expect(stageOfLesson(31).name).toBe('Expert');
});

test('a stop drops by one band each time it crosses into the next land', () => {
  expect(stopY(0)).toBe(ROW_HEIGHT / 2);
  expect(stopY(7)).toBe(7 * ROW_HEIGHT + ROW_HEIGHT / 2);
  expect(stopY(8)).toBe(8 * ROW_HEIGHT + ROW_HEIGHT / 2 + STAGE_BAND);
  expect(stopY(30)).toBe(30 * ROW_HEIGHT + ROW_HEIGHT / 2 + 3 * STAGE_BAND);
});

test('a stage knows if it is done, where you are, or ahead', () => {
  const beginner = STAGES[0], mid = STAGES[1];
  expect(stageProgress(beginner, [1, 2, 3, 4, 5, 6, 7, 8], 9)).toEqual({ done: 8, total: 8, state: 'done' });
  expect(stageProgress(mid, [1, 2, 3, 4, 5, 6, 7, 8], 9)).toEqual({ done: 0, total: 8, state: 'here' });
  expect(stageProgress(STAGES[2], [1, 2, 3, 4, 5, 6, 7, 8], 9)).toEqual({ done: 0, total: 8, state: 'ahead' });
  expect(stageProgress(beginner, [], 1).state).toBe('here');
});
