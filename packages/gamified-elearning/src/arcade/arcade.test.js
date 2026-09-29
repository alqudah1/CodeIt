import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AuthContext } from '../context/AuthContext';
import { CharacterProvider } from '../context/CharacterContext';
import Key from './kit/Key';
import { buildWorld, roadPath, statusFor, nextLesson, shortTitle, freeSide } from './worldLayout';
import { TOTAL_LESSONS, lessonUnits } from '../pages/Lessons/lessonRegistry';

// ── The child's shell, round one: the kit and the world ─────────────────────

jest.mock('react-router-dom', () => {
  const R = require('react');
  return {
    Link: ({ children, to, ...props }) => R.createElement('a', { href: to, ...props }, children),
    useNavigate: () => jest.fn(),
    useLocation: () => ({ pathname: '/play', search: '' }),
  };
}, { virtual: true });
jest.mock('./kit/sound', () => ({ play: jest.fn(), soundOn: () => true, setSoundOn: jest.fn(), sounds: {} }));
jest.mock('./kit/haptic', () => ({ haptic: jest.fn() }));

const { play } = require('./kit/sound');
const { haptic } = require('./kit/haptic');

beforeEach(() => {
  play.mockClear(); haptic.mockClear();
  HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
    setTransform() {}, clearRect() {}, fillRect() {}, beginPath() {}, arc() {}, fill() {}, stroke() {}, save() {}, restore() {}, translate() {}, rotate() {}, moveTo() {}, lineTo() {},
    createLinearGradient: () => ({ addColorStop() {} }),
  }));
  window.requestAnimationFrame = (fn) => setTimeout(() => fn(performance.now()), 0);
  window.cancelAnimationFrame = (id) => clearTimeout(id);
  Element.prototype.scrollTo = jest.fn();
});

describe('a key is a physical object', () => {
  test('the sound and the tick fire on the press, not the release', () => {
    render(<Key sound="good">Run</Key>);
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Run' }));
    expect(play).toHaveBeenCalledWith('good');
    expect(haptic).toHaveBeenCalledWith('good');
  });
  test('a disabled key is silent', () => {
    render(<Key disabled>Run</Key>);
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Run' }));
    expect(play).not.toHaveBeenCalled();
  });
  test('the tone names the job', () => {
    render(<Key tone="mint">Check</Key>);
    expect(screen.getByRole('button').className).toContain('ak-key--mint');
  });
});

describe('the world is a place, not a list', () => {
  const units = lessonUnits();
  test('every lesson stands on one road, bottom to top, winding, with a chest after the first and a crown on the last', () => {
    const { items, road, height } = buildWorld(units);
    const lessons = items.filter((i) => i.kind === 'lesson');
    expect(lessons).toHaveLength(TOTAL_LESSONS);
    expect(lessons[0].y).toBeGreaterThan(lessons[lessons.length - 1].y);
    expect(new Set(lessons.map((n) => n.x)).size).toBeGreaterThan(4);
    for (const n of road) { expect(n.x).toBeGreaterThan(40); expect(n.x).toBeLessThan(350); expect(n.y).toBeGreaterThan(0); expect(n.y).toBeLessThan(height); }
    expect(items.filter((i) => i.kind === 'chest')).toHaveLength(units.length);
    expect(items.filter((i) => i.kind === 'trophy')).toHaveLength(units.length);
    expect(lessons.filter((l) => l.boss).map((l) => l.id)).toEqual(units.map((u) => u.lessons[u.lessons.length - 1].id));
    // the road is one continuous path through every item in order
    const d = roadPath(road);
    expect(d.startsWith(`M ${road[0].x} ${road[0].y}`)).toBe(true);
    expect(d.endsWith(`${road[road.length - 1].x} ${road[road.length - 1].y}`)).toBe(true);
  });
  test('road signs are short; props stand on the side away from the road', () => {
    expect(shortTitle('Making Decisions with If Statements')).toBe('Making Decisions with…');
    expect(shortTitle('Capstone. Build a Real Game')).toBe('Capstone');
    expect(shortTitle('Hello Python!')).toBe('Hello Python!');
    const { road } = buildWorld(units);
    for (const r of road) expect(Math.abs(freeSide(road, r.y) - r.x)).toBeGreaterThan(90);
  });
  test('exactly one lit stone: the first lesson not done', () => {
    expect(nextLesson([])).toBe(1);
    expect(nextLesson([1, 2, 17])).toBe(3);
    expect(nextLesson([1, 2, 3])).toBe(4);
    const statuses = Array.from({ length: 31 }, (_, i) => statusFor(i + 1, [1, 2, 17]));
    expect(statuses.filter((s) => s === 'next')).toHaveLength(1);
    expect(statuses.filter((s) => s === 'done')).toHaveLength(3);
  });
});

describe('the shell', () => {
  const Arcade = require('./Arcade').default;
  const mount = (user = null) => render(
    <AuthContext.Provider value={{ user, token: null }}>
      <CharacterProvider><Arcade /></CharacterProvider>
    </AuthContext.Provider>
  );

  test('opens on the world with the child standing on lesson 1, and no site header', async () => {
    mount();
    await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
    expect(document.querySelector('.site-header, header.header')).toBeNull();
    expect(document.querySelectorAll('.wnode')).toHaveLength(31);
    expect(document.querySelectorAll('.wnode--next')).toHaveLength(1);
    expect(document.querySelector('.wnode--next .wstart')).not.toBeNull();
    expect(document.querySelector('.world__you')).not.toBeNull();
    expect(document.querySelectorAll('.wnode--boss')).toHaveLength(lessonUnits().length);
    expect(document.querySelectorAll('.wnode--ahead')).toHaveLength(30);
    expect(screen.getByRole('button', { name: /Start: Hello Python/ })).toBeInTheDocument();
    expect(document.querySelector('.wnode--next .wstone').getAttribute('aria-label')).toMatch(/^Lesson 1: Hello Python!?, start$/);
    expect(document.querySelector('.mascot')).not.toBeNull();
    // prizes are on the road before they are earned: every chest locked, every trophy unlit, nothing grey
    expect(document.querySelectorAll('.wchest--locked')).toHaveLength(lessonUnits().length);
    expect(document.querySelectorAll('.wtrophy--won')).toHaveLength(0);
    expect(document.querySelector('.wbanner')).not.toBeNull();
    expect(document.querySelector('.wfox')).not.toBeNull();
  });

  test('a chest opens once its lesson is done, and stays open', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ completedLessons: [1] }) }));
    localStorage.removeItem('codeit_chests_opened');
    render(
      <AuthContext.Provider value={{ user: { id: 1 }, token: 't' }}>
        <CharacterProvider><Arcade /></CharacterProvider>
      </AuthContext.Provider>
    );
    await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
    expect(document.querySelectorAll('.wnode--done')).toHaveLength(1);
    expect(document.querySelectorAll('.wchest--ready')).toHaveLength(1);
    fireEvent.click(document.querySelector('.wchest--ready'));
    expect(document.querySelectorAll('.wchest--open')).toHaveLength(1);
    expect(document.querySelector('.world__toast').textContent).toMatch(/New sticker/);
    expect(JSON.parse(localStorage.getItem('codeit_chests_opened'))).toEqual([1]);
    expect(play).toHaveBeenCalledWith('chest');
    delete global.fetch;
  });

  test('four tabs, always; Me goes to sign-in for a guest', async () => {
    mount();
    await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
    const tabs = screen.getAllByRole('link').filter((a) => a.className.includes('arcade__tab'));
    expect(tabs.map((a) => a.textContent)).toEqual(['Learn', 'Play', 'Explore', 'Me']);
    expect(tabs[3]).toHaveAttribute('href', '/login');
    expect(tabs[0]).toHaveAttribute('aria-current', 'page');
  });

  test('nothing is sold to a child inside the shell', async () => {
    mount();
    await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
    expect(document.body.textContent).not.toMatch(/Pricing|Plus|\$|CA\$/);
  });
});
