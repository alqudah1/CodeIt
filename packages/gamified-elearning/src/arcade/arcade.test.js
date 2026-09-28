import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AuthContext } from '../context/AuthContext';
import { CharacterProvider } from '../context/CharacterContext';
import Key from './kit/Key';
import { layoutNodes, trailPath, statusFor, nextLesson, isBoss, worldHeight } from './worldLayout';
import { TOTAL_LESSONS } from '../pages/Lessons/lessonRegistry';

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
  test('every lesson stands on the path, bottom to top, winding', () => {
    const nodes = layoutNodes(TOTAL_LESSONS);
    expect(nodes).toHaveLength(31);
    expect(nodes[0].y).toBeLessThan(nodes[30].y);
    const xs = new Set(nodes.map((n) => Math.round(n.x / 20)));
    expect(xs.size).toBeGreaterThan(4);
    for (const n of nodes) { expect(n.x).toBeGreaterThan(40); expect(n.x).toBeLessThan(320); }
    expect(worldHeight(31)).toBeGreaterThan(nodes[30].y);
  });
  test('the trail passes through every node in order', () => {
    const nodes = layoutNodes(5);
    const d = trailPath(nodes);
    expect(d.startsWith(`M ${nodes[0].x} ${nodes[0].y}`)).toBe(true);
    expect(d.endsWith(`${nodes[4].x} ${nodes[4].y}`)).toBe(true);
    expect(trailPath(nodes, 1)).toBe('');
  });
  test('exactly one lit node: the first lesson not done', () => {
    expect(nextLesson([])).toBe(1);
    expect(nextLesson([1, 2, 17])).toBe(3);
    expect(nextLesson([1, 2, 3])).toBe(4);
    const statuses = Array.from({ length: 31 }, (_, i) => statusFor(i + 1, [1, 2, 17]));
    expect(statuses.filter((s) => s === 'next')).toHaveLength(1);
    expect(statuses.filter((s) => s === 'done')).toHaveLength(3);
    for (let id = 1; id <= 31; id += 1) expect(isBoss(id)).toBe(id % 5 === 0);
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
    expect(document.querySelector('.wnode--next .wnode__you')).not.toBeNull();
    expect(document.querySelectorAll('.wnode--boss')).toHaveLength(6);
    expect(screen.getByRole('button', { name: /Start: Hello Python/ })).toBeInTheDocument();
    expect(document.querySelector('.mascot')).not.toBeNull();
    expect(document.querySelector('.wchest')).not.toBeNull();
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
