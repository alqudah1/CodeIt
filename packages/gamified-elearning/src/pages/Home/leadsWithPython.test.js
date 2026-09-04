import fs from 'fs';
import path from 'path';
import { render, screen } from '@testing-library/react';
import Home from './Home';

// ── The two best answers to "the AI does it for them" were both hidden ───────
//
// Production, opened rather than read: /playground works. Eleven templates, a
// real editor, real Pyodide. /lesson/1 works, with no account. Both run Python
// the child types, and neither has any AI in it. They are the direct answer to
// the one objection a sceptical parent arrives with, and a parent could reach
// neither from the top of any page: the nav was Explore, Learn, Pricing, For
// parents, the orange key on every page said "Start building" into the AI
// studio, and the first thing the home page said was "describe an idea and we
// make it".
//
// Google had already decided what we are: "python for kids free" sits at
// position 13, our best non-brand rank anywhere on the site, while the home
// page argued we were an AI website builder.
//
// These tests keep the two pointing the same way.

let mockAuth = { user: null, token: null };

jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: ({ children, to, onClick, ...props }) => React.createElement('a', {
      href: to,
      onClick: (event) => { event.preventDefault(); onClick?.(event); },
      ...props,
    }, children),
    useNavigate: () => jest.fn(),
  };
}, { virtual: true });
jest.mock('../Header/Header', () => () => null);
jest.mock('../../components/BrandLogo/BrandLogo', () => ({ alt = 'CodeIt', ...props }) => <img alt={alt} {...props} />);
jest.mock('../../context/AuthContext', () => ({ useAuth: () => mockAuth }));
jest.mock('../../config/api', () => ({ API_BASE_URL: 'http://codeit.test' }));
jest.mock('../../hooks/useSEO', () => ({ useSEO: jest.fn() }));
jest.mock('../../utils/trackEvent', () => ({ trackEvent: jest.fn() }));

const read = (rel) => fs.readFileSync(path.join(__dirname, rel), 'utf8');

describe('the home page leads with the part that has no AI in it', () => {
  beforeEach(() => { mockAuth = { user: null, token: null }; sessionStorage.clear(); });
  afterEach(() => { delete global.fetch; });

  test('one claim, one orange button, one text link', () => {
    // Reviewed on a real phone (message 63): the hero said the same thing
    // three times, stacked, before a single button, and then offered three
    // identical full-width blocks. One claim, in the headline. One primary.
    // One plain link under it.
    render(<Home />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Your child types the Python/);
    expect(screen.queryByText(/No AI in the lessons or the playground/)).not.toBeInTheDocument();
    const lesson = screen.getByRole('link', { name: /Open Lesson 1 free/ });
    expect(lesson).toHaveAttribute('href', '/lesson/1');
    expect(lesson.className).toMatch(/studio-button--primary/);
    const playground = screen.getByRole('link', { name: 'Try the playground' });
    expect(playground).toHaveAttribute('href', '/playground');
    expect(playground.className).toBe('studio-hero__textlink');
    expect(screen.queryByRole('link', { name: /View my progress/ })).not.toBeInTheDocument();
  });

  test('a signed-in learner gets their work, not the pitch', () => {
    mockAuth = { user: { id: 3, name: 'David' }, token: 't' };
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: async () => ({ projects: [] }) }));
    render(<Home />);
    expect(screen.getByText(/Welcome back, David/)).toBeInTheDocument();
    expect(screen.queryByText(/Your child types the Python/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Make a character\. It becomes the player/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'My progress' })).toHaveAttribute('href', '/MainPage');
    expect(screen.getByRole('link', { name: 'Next lesson' })).toHaveAttribute('href', '/lessons');
  });

  test('the studio is not the first thing on the page', () => {
    const source = read('Home.js');
    const hero = source.indexOf('<AvatarInGame />');
    const studio = source.indexOf('And when they want to make something');
    expect(hero).toBeGreaterThan(-1);
    expect(studio).toBeGreaterThan(hero);
  });

  test('a visitor can run Python without leaving the page', () => {
    render(<Home />);
    // The resting state is real code on the screen, not a picture of code.
    expect(screen.getByText(/print\("Hello, World!"\)/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Run this/ })).toBeInTheDocument();
  });
});

describe('the header points at the playground', () => {
  const header = fs.readFileSync(path.join(__dirname, '../Header/Header.js'), 'utf8');

  test('Playground is a destination in the public bar, not only in the footer', () => {
    const bar = header.slice(header.indexOf('const PUBLIC_NAV'), header.indexOf('const MEMBER_NAV'));
    expect(bar).toContain('/playground');
    expect(bar).toContain('label: "Playground"');
  });

  test('"Learn" is called "Lessons", because a parent knows what a lesson is', () => {
    expect(header).not.toMatch(/label: "Learn"/);
    expect(header).toMatch(/label: "Lessons"/);
  });
});

describe('the Run button never looks dead', () => {
  const runner = fs.readFileSync(
    path.join(__dirname, '../../components/CodeRunnerPython.js'), 'utf8',
  );

  test('the wait for Python is named, not left as "Loading..."', () => {
    // Ten megabytes download on the first run. The old button said "Loading..."
    // in the smallest type on the page and gave no other sign, so the first
    // click read as a dead button and thirty seconds read as a broken site.
    expect(runner).toContain('Starting Python');
    expect(runner).toContain('cr-spinner');
  });

  test('pressing Run before Python has arrived starts it instead of doing nothing', () => {
    // The old guard was `if (!window.pyodide || running) return;` — a silent
    // return, which is the other half of why the button looked dead.
    expect(runner).not.toMatch(/if \(!window\.pyodide \|\| running\) return;/);
    expect(runner).toMatch(/await startPython\(true\)/);
  });

  test('Ctrl+Enter is wired, because the playground prints it as a tip', () => {
    const playground = fs.readFileSync(
      path.join(__dirname, '../Playground/Playground.js'), 'utf8',
    );
    expect(playground).toContain('Ctrl+Enter');
    expect(runner).toMatch(/ctrlKey \|\| event\.metaKey/);
    expect(runner).toMatch(/event\.key === 'Enter'/);
  });
});
