// The stage cannot go blank.
//
// 11 November, live: a game on /build showed its score, hearts and hint over
// an empty stage, straight after the YOU knob put the child's avatar in. The
// loop had one way to die (a frame that threw was the last frame) and the
// canvas had no way back from a drawing surface the browser dropped. These
// run the real game script against a stand-in page and break it on purpose.

import { recipeGame } from './recipeGame';

const SHIP = { title: 'Puppy Carrot Catch', kind: 'catch', player: 'hero', enemy: 'rock', treasure: 'star', sky: 'sunset', speed: 4, lives: 3, twist: 'none' };

function stage(recipe, { w = 800, h = 600, sprite = '' } = {}) {
  const html = recipeGame(recipe);
  const script = html.split('<script>')[1].split('</' + 'script>')[0];
  const made = [];        // every canvas the game asked for
  const images = [];
  const later = [];
  let next = null;

  const makePen = (canvas) => {
    const state = { lost: false, empty: false, calls: [] };
    canvas.state = state;
    return new Proxy(state, {
      get(t, k) {
        if (k === 'isContextLost') return () => t.lost;
        if (k === 'getImageData') return () => ({ data: [0, 0, 0, t.empty ? 0 : 255] });
        if (k === 'createLinearGradient') return () => ({ addColorStop() {} });
        if (k === 'measureText') return () => ({ width: 10 });
        if (k in t) return t[k];
        return (...args) => { t.calls.push([k, args[0]]); };
      },
      set(t, k, v) { t[k] = v; return true; },
    });
  };
  const holder = { replaceChild(fresh) { fresh.parentNode = holder; holder.screen = fresh; } };
  const makeCanvas = (onPage) => {
    const c = { tagName: 'CANVAS', width: 0, height: 0, listeners: {}, onPage };
    const pen = makePen(c);
    c.getContext = () => pen;
    c.addEventListener = (name, fn) => { c.listeners[name] = fn; };
    c.cloneNode = () => makeCanvas(true);
    if (onPage) c.parentNode = holder;
    made.push(c);
    return c;
  };
  const screen = makeCanvas(true);
  holder.screen = screen;
  const element = () => ({ style: {}, classList: { add() {}, remove() {} }, textContent: '', innerHTML: '', children: [], offsetWidth: 0 });
  const elements = {};
  const document = {
    getElementById: (id) => (id === 'screen' ? screen : (elements[id] = elements[id] || element())),
    createElement: () => makeCanvas(false),
  };
  const window = { innerWidth: w, innerHeight: h, devicePixelRatio: 2, addEventListener() {}, parent: { postMessage() {} }, CODEIT_PLAYER_SPRITE: sprite };
  const Image = function Image() { images.push(this); };
  const raf = (fn) => { next = fn; };
  const timeout = (fn) => { later.push(fn); };

  const run = new Function('window', 'document', 'Image', 'requestAnimationFrame', 'setTimeout', `${script}
    return { get frames() { return frames; }, get faults() { return faults; }, get swaps() { return swaps; }, get things() { return things; }, get playerX() { return playerX; }, get canvas() { return canvas; }, get playerImg() { return playerImg; } };`);
  const game = run(window, document, Image, raf, timeout);
  const step = (n = 1) => { for (let i = 0; i < n; i += 1) { const fn = next; next = null; expect(typeof fn).toBe('function'); fn(); } };
  return { game, step, window, holder, made, images, later, pending: () => next };
}

test('a frame that throws is not the last frame, and says so once', () => {
  const s = stage(SHIP);
  s.step(5);
  s.game.things.push(null);                    // something no step function can draw
  const before = s.game.canvas.state.calls.length;
  s.step(20);
  expect(s.game.faults).toBeGreaterThan(0);
  expect(typeof s.pending()).toBe('function'); // the next frame is still asked for
  // The sky is still painted on every one of those frames.
  const skies = s.game.canvas.state.calls.slice(before).filter(([name]) => name === 'fillRect').length;
  expect(skies).toBeGreaterThanOrEqual(20);
  // The error is not swallowed: it is thrown once, off the loop, where the editor's error bar hears it.
  expect(s.later).toHaveLength(1);
  expect(() => s.later[0]()).toThrow();
});

test('a frame with no size yet waits, then the game starts in the middle of the real screen', () => {
  const s = stage(SHIP, { w: 0, h: 0 });
  s.step(10);
  expect(s.game.canvas.width).toBe(0);
  expect(s.game.faults).toBe(0);
  s.window.innerWidth = 640; s.window.innerHeight = 400;
  s.step(1);
  expect(s.game.canvas.width).toBe(1280);
  expect(s.game.canvas.height).toBe(800);
  expect(s.game.playerX).toBe(320);
});

test('a window that changed size without telling us is noticed on the next frame', () => {
  const s = stage(SHIP);
  s.step(3);
  s.window.innerWidth = 500; s.window.innerHeight = 700;   // no resize event fired
  s.step(1);
  expect(s.game.canvas.width).toBe(1000);
  // A frame that is hidden reports no size: that is not a size to draw at.
  s.window.innerWidth = 0; s.window.innerHeight = 0;
  s.step(3);
  expect(s.game.canvas.width).toBe(1000);
});

test('a screen the browser dropped is swapped for a new one, wired and sized', () => {
  const s = stage(SHIP);
  const first = s.game.canvas;
  s.step(10);
  first.state.lost = true;
  s.step(95);
  expect(s.game.swaps).toBe(1);
  expect(s.game.canvas).not.toBe(first);
  expect(s.holder.screen).toBe(s.game.canvas);
  expect(s.game.canvas.width).toBe(1600);
  expect(typeof s.game.canvas.listeners.pointerdown).toBe('function');
  const before = s.game.canvas.state.calls.length;
  s.step(2);
  expect(s.game.canvas.state.calls.length).toBeGreaterThan(before);   // and it is being drawn on
});

test('a screen that took the paint and shows nothing is swapped too, three times at most', () => {
  const s = stage(SHIP);
  s.game.canvas.state.empty = true;
  s.step(31);
  expect(s.game.swaps).toBe(1);
  s.game.canvas.state.empty = true;
  s.step(300);
  expect(s.game.swaps).toBe(2);
  s.step(600);
  expect(s.game.swaps).toBe(2);               // it only looks twice: no reading the screen back all game long
});

test('a healthy screen is never swapped', () => {
  const s = stage(SHIP);
  const first = s.game.canvas;
  s.step(400);
  expect(s.game.swaps).toBe(0);
  expect(s.game.faults).toBe(0);
  expect(s.game.canvas).toBe(first);
});

test('the avatar is drawn once onto its own canvas, and the game moves that picture', () => {
  const s = stage(SHIP, { sprite: 'data:image/svg+xml;utf8,me' });
  expect(s.images.map((img) => img.src)).toContain('data:image/svg+xml;utf8,me');
  const avatar = s.images.find((img) => img.src === 'data:image/svg+xml;utf8,me');
  s.step(3);
  expect(s.game.playerImg).toBeNull();        // not loaded yet: the drawn hero stands in
  avatar.onload();
  const picture = s.game.playerImg;
  expect(picture.tagName).toBe('CANVAS');
  expect(picture.state.calls.filter(([name]) => name === 'drawImage')).toHaveLength(1);
  s.step(30);
  const drawn = s.game.canvas.state.calls.filter(([name]) => name === 'drawImage').map(([, what]) => what);
  expect(drawn).toContain(picture);
  expect(drawn).not.toContain(avatar);        // the SVG itself is never drawn in the loop
  expect(picture.state.calls.filter(([name]) => name === 'drawImage')).toHaveLength(1);
});
