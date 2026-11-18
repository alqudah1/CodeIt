import { render, screen } from '@testing-library/react';
import KidHome from './KidHome';
import { rememberGuestLesson } from '../../utils/guestLessons';
import { STAGES } from '../Lessons/lessonStages';

// ── The lesson goal on Home names the lesson and opens it ───────────────────
//
// 16 November 2026, walked as a signed-in child with seven lessons done: the
// third goal said "Finish a lesson on the map", went to the map, and promised
// "+50 XP" whatever the next lesson paid. And after a lesson the heading said
// "Today counts." while the streak stayed at 0, because the server left
// lessons out of the streak (see packages/codeit-backend/today.js).

jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: ({ children, to, ...props }) => React.createElement('a', { href: to, ...props }, children),
    NavLink: ({ children, to }) => React.createElement('a', { href: to }, children),
  };
}, { virtual: true });
jest.mock('../Header/Header', () => () => null);
jest.mock('../../config/api', () => ({ API_BASE_URL: 'http://codeit.test' }));
jest.mock('../../hooks/useSEO', () => ({ useSEO: jest.fn() }));
jest.mock('../../components/CodeRunnerPython', () => () => null);
jest.mock('../../context/CharacterContext', () => ({ useCharacterDisplay: () => ({ character: {} }) }));
jest.mock('../../context/AuthContext', () => {
  const React = require('react');
  return { AuthContext: React.createContext({ user: null, token: null }) };
});
const { AuthContext } = require('../../context/AuthContext');
const mount = (auth) => render(<AuthContext.Provider value={auth}><KidHome /></AuthContext.Provider>);

const LEVEL = { n: 2, title: 'Explorer', xp: 390, next: 500, toNext: 110 };
const QUEST = { text: 'Under the sea.', prompt: 'catch gems under the sea' };
const serves = (today) => {
  global.fetch = jest.fn((url) => (String(url).endsWith('/api/today')
    ? Promise.resolve({ ok: true, json: () => Promise.resolve(today) })
    : Promise.resolve({ ok: false, json: () => Promise.resolve({}) })));
};
const lessonBadge = () => document.querySelector('.kh__badge--lesson');

beforeEach(() => { localStorage.clear(); });
afterEach(() => { delete global.fetch; });

test('signed in: the goal is the next lesson by number, opens it, and shows what it really pays', async () => {
  serves({ signedIn: true, quest: QUEST, streak: 0, builtToday: false, gameToday: false, lessonToday: false, level: LEVEL, lessonsDone: 8, nextLesson: { id: 9, title: 'Basic Functions', xp: 75 }, games: [] });
  mount({ user: { name: 'sam' }, token: 't' });
  const link = await screen.findByRole('link', { name: 'Finish Lesson 9, Basic Functions' });
  expect(link).toHaveAttribute('href', '/lesson/9');
  expect(lessonBadge()).toHaveTextContent('Finish Lesson 9');
  expect(lessonBadge()).toHaveTextContent('+75 XP');
  expect(lessonBadge()).not.toHaveTextContent('+50 XP');
});

test('a lesson finished today: the goal is ticked, the streak is the server\'s, and the build card still asks for today\'s game', async () => {
  serves({ signedIn: true, quest: QUEST, streak: 1, builtToday: true, gameToday: false, lessonToday: true, level: LEVEL, lessonsDone: 8, nextLesson: { id: 9, title: 'Basic Functions', xp: 75 }, games: [] });
  mount({ user: { name: 'sam' }, token: 't' });
  expect(await screen.findByText('Today counts.')).toBeInTheDocument();
  expect(lessonBadge()).toHaveClass('is-done');
  // Ticked, it says what was done, not the lesson that comes next.
  expect(lessonBadge()).toHaveTextContent('A lesson finished today');
  expect(lessonBadge()).not.toHaveTextContent('Lesson 9');
  expect(document.querySelector('.kh__chip--streak').textContent.trim()).toBe('1');
  // builtToday is "did something today". The card is about the game.
  expect(screen.getByText('Under the sea.')).toBeInTheDocument();
  expect(screen.queryByText('Done. Build another?')).toBeNull();
});

test('every lesson done: the goal goes to the map and promises no XP', async () => {
  serves({ signedIn: true, quest: QUEST, streak: 0, builtToday: false, gameToday: false, lessonToday: false, level: LEVEL, lessonsDone: 31, nextLesson: null, games: [] });
  mount({ user: { name: 'sam' }, token: 't' });
  const link = await screen.findByRole('link', { name: 'Finish a lesson on the map' });
  expect(link).toHaveAttribute('href', '/lessons');
  expect(lessonBadge()).not.toHaveTextContent(/XP/);
});

test('a new guest is sent to Lesson 1 with what the server says it pays', async () => {
  serves({ signedIn: false, quest: QUEST, lessonXp: [50, 50, 60] });
  mount({ user: null, token: null });
  const link = await screen.findByRole('link', { name: 'Finish Lesson 1' });
  expect(link).toHaveAttribute('href', '/lesson/1');
  await screen.findByText('+50 XP');
});

test('a guest who finished two lessons on this device is sent to the third, and the course tile counts them', async () => {
  rememberGuestLesson(1); rememberGuestLesson(2);
  serves({ signedIn: false, quest: QUEST, lessonXp: [50, 50, 60] });
  mount({ user: null, token: null });
  const link = await screen.findByRole('link', { name: 'Finish Lesson 3' });
  expect(link).toHaveAttribute('href', '/lesson/3');
  await screen.findByText('+60 XP');
  expect(document.querySelector('.pp-panel__tile--course')).toHaveTextContent(/^\d+%2 of \d+ lessons$/);
});

test('a guest who finished every lesson is not sent to one that does not exist', async () => {
  const last = STAGES[STAGES.length - 1].to;
  for (let id = 1; id <= last; id += 1) rememberGuestLesson(id);
  serves({ signedIn: false, quest: QUEST, lessonXp: [] });
  mount({ user: null, token: null });
  expect(await screen.findByRole('link', { name: 'Finish a lesson on the map' })).toHaveAttribute('href', '/lessons');
});

test('an older answer with no next lesson in it still draws the goal', async () => {
  serves({ signedIn: true, quest: QUEST, streak: 2, builtToday: true, level: LEVEL, games: [] });
  mount({ user: { name: 'sam' }, token: 't' });
  expect(await screen.findByRole('link', { name: 'Finish a lesson on the map' })).toHaveAttribute('href', '/lessons');
  // With no gameToday in the answer, the card falls back to what it did before.
  expect(screen.getByText('Done. Build another?')).toBeInTheDocument();
});

test('tapping the Python goal brings the quest onto the screen', async () => {
  serves({ signedIn: true, quest: QUEST, streak: 0, builtToday: false, gameToday: false, lessonToday: false, level: LEVEL, lessonsDone: 8, nextLesson: { id: 9, title: 'Basic Functions', xp: 75 }, games: [] });
  mount({ user: { name: 'sam' }, token: 't' });
  const goal = await screen.findByRole('link', { name: "Today's Python quest" });
  const anchor = document.getElementById('today-python');
  anchor.scrollIntoView = jest.fn();
  // The address changing to /home#today-python moved nothing: this does.
  goal.click();
  expect(anchor.scrollIntoView).toHaveBeenCalledWith({ block: 'start', behavior: 'smooth' });
});
