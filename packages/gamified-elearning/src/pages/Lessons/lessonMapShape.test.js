import { render } from '@testing-library/react';
import LessonMap, { ROW_HEIGHT, isBoss, stopX, trailPath } from './LessonMap';
import { TOTAL_LESSONS } from './lessonRegistry';
import { AuthContext } from '../../context/AuthContext';

// ── A map, not a list (rounds 66 and 67) ─────────────────────────────────────
//
// Nodes on a bending path, the avatar standing on the current one, titles
// only on the current and next stop, a different marker every fifth lesson,
// the XP badges kept, and one Unlock button.

jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: React.forwardRef(({ children, to, ...props }, ref) =>
      React.createElement('a', { href: to, ref, ...props }, children)),
    useNavigate: () => jest.fn(),
  };
}, { virtual: true });

jest.mock('../Header/Header', () => () => null);

function renderMap() {
  return render(
    <AuthContext.Provider value={{ token: null, user: null }}>
      <LessonMap />
    </AuthContext.Provider>
  );
}

test('the path bends: consecutive stops are not in a straight line', () => {
  const xs = Array.from({ length: 8 }, (_, i) => stopX(i));
  const distinct = new Set(xs.map((x) => Math.round(x)));
  expect(distinct.size).toBeGreaterThan(4);
  for (const x of xs) {
    expect(x).toBeGreaterThan(15);
    expect(x).toBeLessThan(85);
  }
});

test('the trail passes through every stop, in order', () => {
  const d = trailPath(4);
  expect(d.startsWith(`M ${stopX(0).toFixed(2)} ${ROW_HEIGHT / 2}`)).toBe(true);
  expect(d.endsWith(`${stopX(3).toFixed(2)} ${3 * ROW_HEIGHT + ROW_HEIGHT / 2}`)).toBe(true);
  expect(trailPath(0)).toBe('');
  expect(trailPath(31, 1)).toMatch(/^M [\d.]+ 54$/);
});

test('every fifth lesson is the boss stop, and nothing else is', () => {
  for (let id = 1; id <= TOTAL_LESSONS; id += 1) expect(isBoss(id)).toBe(id % 5 === 0);
});

test('nodes, not cards: every lesson is a numbered stop on the path', () => {
  renderMap();
  expect(document.querySelectorAll('.lm-stop')).toHaveLength(TOTAL_LESSONS);
  expect(document.querySelectorAll('.lm-node')).toHaveLength(TOTAL_LESSONS);
  expect(document.querySelectorAll('.lm-node--boss')).toHaveLength(Math.floor(TOTAL_LESSONS / 5));
  expect(document.querySelector('.lm-trail path.lm-trail__all')).not.toBeNull();
});

test('titles only on the current and the next stop', () => {
  renderMap();
  const labels = [...document.querySelectorAll('.lm-label__title')].map((el) => el.textContent);
  expect(labels).toHaveLength(2);
  const stops = document.querySelectorAll('.lm-stop');
  expect(stops[0].querySelector('.lm-label')).not.toBeNull();
  expect(stops[1].querySelector('.lm-label')).not.toBeNull();
  expect(stops[2].querySelector('.lm-label')).toBeNull();
});

test('the avatar stands on the current stop, and only there', () => {
  renderMap();
  expect(document.querySelectorAll('.lm-you')).toHaveLength(1);
  expect(document.querySelector('.lm-stop--here .lm-you svg')).not.toBeNull();
  // It is inside the node, so it has nothing to overlap.
  expect(document.querySelector('.lm-stop--here .lm-node .lm-you')).not.toBeNull();
});

test('one Start button, on the stop the child is looking at', () => {
  renderMap();
  const unlocks = [...document.querySelectorAll('.lm-badge')].filter((el) => /Start/.test(el.textContent));
  expect(unlocks).toHaveLength(1);
  expect(unlocks[0].closest('.lm-stop--here')).not.toBeNull();
  expect(document.querySelector('.lm-continue-btn')).toBeNull();
});

test('the XP badges stay, one per lesson', () => {
  renderMap();
  expect(document.querySelectorAll('.lm-xp')).toHaveLength(TOTAL_LESSONS);
});

test('the label beside a stop never hangs off the edge of the path', () => {
  const { labelBox } = require('./LessonMap');
  for (const width of [330, 359, 500, 700, 760]) {
    for (let i = 0; i < 12; i += 1) {
      const x = stopX(i);
      for (const boss of [false, true]) {
        const box = labelBox(x, width, boss);
        const cx = (x / 100) * width;
        const cardLeft = cx - (boss ? 78 : 64) / 2;
        const absLeft = cardLeft + box.style.left;
        expect(absLeft).toBeGreaterThanOrEqual(-0.5);
        expect(absLeft + box.style.width).toBeLessThanOrEqual(width + 0.5);
        // And never over the node it labels.
        const nodeW = boss ? 78 : 64;
        const overlaps = absLeft < cx + nodeW / 2 && absLeft + box.style.width > cx - nodeW / 2;
        expect(overlaps).toBe(false);
      }
    }
  }
  expect(labelBox(50, 0, false)).toBeNull();
});
