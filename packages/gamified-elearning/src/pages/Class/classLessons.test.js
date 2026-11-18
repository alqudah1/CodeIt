import { fireEvent, render, screen } from '@testing-library/react';
import Teach, { inLessons, lessonName, roomNumbers } from './Teach';

// ── A teacher sees the Python lessons a class has done ──────────────────────
//
// 18 November 2026, from a Head of Computing after his Year 9 group's first
// hour on the course: "I don't seem to get any progress in the classroom for
// the Python lessons. Should I be able to do this?" The class page showed
// games and powers. A class that had spent the hour on Python read as every
// child having only "Joined", and all of them stuck, by name.

const mockNavigate = jest.fn();
let mockParams = {};
jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: ({ children, to, state, ...props }) => React.createElement('a', { href: to, ...props }, children),
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
    useLocation: () => ({ search: '', pathname: '/teach' }),
  };
}, { virtual: true });
jest.mock('../Header/Header', () => () => null);
jest.mock('../../config/api', () => ({ API_BASE_URL: 'http://codeit.test' }));
jest.mock('../../hooks/useSEO', () => ({ useSEO: jest.fn() }));
jest.mock('../../context/AuthContext', () => {
  const React = require('react');
  return { AuthContext: React.createContext({ user: null, token: null, login: () => {} }) };
});
const { AuthContext } = require('../../context/AuthContext');
const mount = (el, auth) => render(<AuthContext.Provider value={auth}>{el}</AuthContext.Provider>);
const TEACHER = { user: { name: 'Mr F' }, token: 't', login: jest.fn() };
const minsAgo = (n) => new Date(Date.now() - n * 60000).toISOString();

const NOTHING = { lessons: 0, lastLessonAt: null, now: null };
const ROOM = (owner) => ({ ready: true, owner, class: { code: 'ROCKET42', name: 'Year 9' }, ...(owner ? { lessonsTotal: 31 } : {}), members: [
  { id: 1, name: 'Ada', games: 0, plays: 0, joinedAt: minsAgo(50), newest: null, ...(owner ? { lessons: { lessons: 2, lastLessonAt: minsAgo(12), now: { id: 3, title: 'Strings', step: 3, at: minsAgo(4) } } } : {}) },
  { id: 2, name: 'Ben', games: 0, plays: 0, joinedAt: minsAgo(50), newest: null, ...(owner ? { lessons: { lessons: 1, lastLessonAt: minsAgo(30), now: null } } : {}) },
  { id: 3, name: 'Cal', games: 0, plays: 0, joinedAt: minsAgo(50), newest: null, ...(owner ? { lessons: NOTHING } : {}) },
] });
const serves = (body) => { global.fetch = jest.fn(() => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) })); };

beforeEach(() => { mockParams = {}; });
afterEach(() => { delete global.fetch; });

test('a child in the lessons is not stuck, and the room has a number for them', () => {
  const members = ROOM(true).members;
  expect(members.map(inLessons)).toEqual([true, true, false]);
  const n = roomNumbers(members);
  expect(n.learning).toBe(2);
  expect(n.stuck.map((m) => m.name)).toEqual(['Cal']);
  expect(n.made).toBe(0);
  // The room's own board has no lessons on it: the numbers are as they were.
  expect(roomNumbers(ROOM(false).members).learning).toBe(0);
  expect(lessonName({ id: 3, title: 'Strings' })).toBe('Lesson 3, Strings');
  expect(lessonName({ id: 3, title: '' })).toBe('Lesson 3');
});

test('at the teacher\'s desk each tile says how many lessons and what the child is on', async () => {
  mockParams = { code: 'ROCKET42' };
  serves(ROOM(true));
  mount(<Teach />, TEACHER);
  expect(await screen.findByText('Ada')).toBeInTheDocument();
  const tile = (name) => screen.getByText(name).closest('.cl__tile');
  expect(tile('Ada')).toHaveTextContent('2 lessons');
  expect(tile('Ada')).toHaveTextContent('On Lesson 3, Strings');
  expect(tile('Ada')).toHaveTextContent('step 3 · 4 min ago');
  expect(tile('Ben')).toHaveTextContent('1 lesson');
  expect(tile('Ben')).toHaveTextContent('Last lesson finished');
  expect(tile('Ben')).toHaveTextContent('30 min ago');
  expect(tile('Cal')).toHaveTextContent('Joined');
  expect(screen.getByText('in the Python lessons').previousSibling).toHaveTextContent('2');
  expect(screen.getByText('stuck: Cal')).toBeInTheDocument();
});

test('on the projector the lessons are not shown: how far a child has got is not for the room', async () => {
  mockParams = { code: 'ROCKET42' };
  serves(ROOM(true));
  mount(<Teach />, TEACHER);
  await screen.findByText('Ada');
  fireEvent.click(screen.getByRole('button', { name: 'Projector' }));
  expect(screen.queryByText('in the Python lessons')).toBeNull();
  expect(screen.queryByText(/lessons?$/)).toBeNull();
  expect(screen.queryByText(/On Lesson 3/)).toBeNull();
  expect(screen.getByText('Ada').closest('.cl__tile')).toHaveTextContent('Joined');
  fireEvent.click(screen.getByRole('button', { name: 'Leave projector' }));
  expect(screen.getByText('in the Python lessons')).toBeInTheDocument();
});

test('a board the server sent with no lessons on it is drawn as it always was', async () => {
  mockParams = { code: 'ROCKET42' };
  serves(ROOM(false));
  mount(<Teach />, TEACHER);
  await screen.findByText('Ada');
  expect(screen.queryByText('in the Python lessons')).toBeNull();
  expect(screen.getAllByText('Joined')).toHaveLength(3);
});

const PAGE = (lessons) => ({ ready: true, class: { code: 'ROCKET42', name: 'Year 9' }, student: { id: 1, name: 'Ada', joinedAt: minsAgo(50) }, games: [], newestCode: null, done: [],
  powers: [{ n: 1, slug: 'numbers', name: 'Numbers', does: 'change how fast', state: 'next' }], lessons });

test('one child\'s page lists every lesson finished, the quiz score, and the lesson in hand', async () => {
  mockParams = { code: 'ROCKET42', kid: '1' };
  serves(PAGE({ total: 31,
    finished: [{ id: 1, title: 'Hello Python!', completedAt: minsAgo(40) }, { id: 2, title: 'Storing Info with Variables', completedAt: minsAgo(12) }],
    now: { id: 3, title: 'Strings', step: 3, at: minsAgo(4) },
    quizzes: [{ quizId: 1, title: 'Hello Python!', right: 4, total: 4, at: minsAgo(38), tries: 2 }] }));
  mount(<Teach />, TEACHER);
  expect(await screen.findByRole('heading', { name: /Python lessons/ })).toHaveTextContent('2 of 31');
  expect(screen.getByText('of 31 Python lessons').previousSibling).toHaveTextContent('2');
  expect(screen.getByText('Working on Lesson 3, Strings.').closest('p')).toHaveTextContent('Up to step 3, 4 min ago.');
  const rows = [...document.querySelectorAll('.st__lessons li')].map((li) => li.textContent);
  expect(rows).toEqual([
    '1Hello Python!Finished 40 min ago · quiz 4 of 4, best of 2 goes',
    '2Storing Info with VariablesFinished 12 min ago · quiz not taken',
  ]);
  // A child working through the lessons is not sent to build a game instead.
  expect(screen.queryByText('No game yet')).toBeNull();
  // And with no games there is no empty "What Ada typed" heading over nothing.
  expect(screen.queryByText('What Ada typed')).toBeNull();
});

test('nothing started: the page says how lessons come to be counted, with the code', async () => {
  mockParams = { code: 'ROCKET42', kid: '1' };
  serves(PAGE({ total: 31, finished: [], now: null, quizzes: [] }));
  mount(<Teach />, TEACHER);
  expect(await screen.findByText(/No Python lesson started yet\./)).toHaveTextContent('Lessons are counted here when Ada does them signed in to this class: at codeitlearn.com/join, with the code ROCKET 42 and the same first name.');
  expect(screen.getByText('of 31 Python lessons').previousSibling).toHaveTextContent('0');
  expect(screen.getByText('No game yet')).toBeInTheDocument();
});

test('lessons the server could not read are not shown as none', async () => {
  mockParams = { code: 'ROCKET42', kid: '1' };
  serves(PAGE(null));
  mount(<Teach />, TEACHER);
  expect(await screen.findByText('The Python lessons could not be read just now. Open this page again in a moment.')).toBeInTheDocument();
  expect(screen.queryByText(/of \d+ Python lessons/)).toBeNull();
  expect(screen.queryByText(/No Python lesson started yet/)).toBeNull();
});
