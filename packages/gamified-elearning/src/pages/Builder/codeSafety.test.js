import {
  EMPTY,
  MAX_KEPT,
  canRestore,
  costOfRestoring,
  lastWorking,
  markBroken,
  rememberWorking,
  restore,
} from './codeSafety';

const V1 = 'let score = 0;\nconsole.log(score);';
const V2 = 'let score = 0;\nlet lives = 3;\nconsole.log(score);';
const BROKEN = 'let score = 0;\nconsole.log(score;';

describe('what counts as a version worth keeping', () => {
  test('a version that ran without complaint is kept', () => {
    expect(rememberWorking(EMPTY, V1).working).toEqual([V1]);
  });

  test('an empty project is not worth keeping', () => {
    expect(rememberWorking(EMPTY, '').working).toEqual([]);
    expect(rememberWorking(EMPTY, '   ').working).toEqual([]);
    expect(rememberWorking(EMPTY, null).working).toEqual([]);
  });

  test('newer versions stack up behind the older ones', () => {
    const state = rememberWorking(rememberWorking(EMPTY, V1), V2);
    expect(state.working).toEqual([V1, V2]);
  });

  test('the same version is not stacked twice', () => {
    const state = rememberWorking(rememberWorking(EMPTY, V1), V1);
    expect(state.working).toEqual([V1]);
  });

  test('going back to an older version moves it to the front of the queue', () => {
    const state = rememberWorking(rememberWorking(rememberWorking(EMPTY, V1), V2), V1);
    expect(state.working).toEqual([V2, V1]);
  });

  test('the list does not grow forever', () => {
    let state = EMPTY;
    for (let i = 0; i < 30; i += 1) state = rememberWorking(state, `version ${i}`);
    expect(state.working).toHaveLength(MAX_KEPT);
    expect(state.working[state.working.length - 1]).toBe('version 29');
  });

  test('running clean clears the broken flag', () => {
    const broken = markBroken(rememberWorking(EMPTY, V1), BROKEN);
    expect(rememberWorking(broken, BROKEN).brokenSince).toBeNull();
  });
});

describe('a bug that only fires when you play the game', () => {
  // The case a browser test caught. Most bugs in a child's game do not throw on
  // load. they throw on the first click. The old design recorded the broken
  // version as good while nobody had pressed the button yet, then offered to
  // restore it.
  const CLICK_BUG = "el.addEventListener('click', () => { scoreboard.textContent = 1; });";

  test('a version that looked fine is struck off once it throws', () => {
    let state = rememberWorking(EMPTY, V1);      // played, fine
    state = rememberWorking(state, CLICK_BUG);   // loaded, nobody clicked yet
    state = markBroken(state, CLICK_BUG);        // child clicks. It throws
    expect(state.working).toEqual([V1]);
  });

  test('and the button offers the version before it, not the broken one', () => {
    let state = rememberWorking(EMPTY, V1);
    state = rememberWorking(state, CLICK_BUG);
    state = markBroken(state, CLICK_BUG);
    expect(restore(state, CLICK_BUG)).toBe(V1);
  });

  test('however long it sat there looking healthy', () => {
    let state = rememberWorking(EMPTY, V1);
    for (let i = 0; i < 5; i += 1) state = rememberWorking(state, CLICK_BUG);
    state = markBroken(state, CLICK_BUG);
    expect(state.working).toEqual([V1]);
  });
});

describe('a broken version can never be restored to', () => {
  test('marking broken leaves the earlier good versions alone', () => {
    const state = markBroken(rememberWorking(EMPTY, V1), BROKEN);
    expect(state.working).toEqual([V1]);
  });

  test('even after breaking it many different ways', () => {
    let state = rememberWorking(EMPTY, V1);
    for (let i = 0; i < 10; i += 1) state = markBroken(state, BROKEN + i);
    expect(lastWorking(state, BROKEN)).toBe(V1);
  });
});

describe('when going back is offered', () => {
  test('not before anything has ever worked', () => {
    expect(canRestore(markBroken(EMPTY, BROKEN), BROKEN)).toBe(false);
  });

  test('not while the project is fine', () => {
    expect(canRestore(rememberWorking(EMPTY, V1), V1)).toBe(false);
  });

  test('yes once a working version has been broken', () => {
    const state = markBroken(rememberWorking(EMPTY, V1), BROKEN);
    expect(canRestore(state, BROKEN)).toBe(true);
  });

  test('not when it would change nothing', () => {
    // A button that does nothing teaches a child that buttons do nothing.
    const state = markBroken(rememberWorking(EMPTY, V1), V1);
    expect(canRestore(state, V1)).toBe(false);
  });

  test('it copes with no state at all', () => {
    expect(canRestore(undefined, V1)).toBe(false);
    expect(canRestore(null, V1)).toBe(false);
    expect(canRestore({}, V1)).toBe(false);
  });
});

describe('going back', () => {
  test('hands back the newest version that worked', () => {
    let state = rememberWorking(rememberWorking(EMPTY, V1), V2);
    state = markBroken(state, BROKEN);
    expect(restore(state, BROKEN)).toBe(V2);
  });

  test('hands back nothing when there is nothing to go back to', () => {
    expect(restore(EMPTY, BROKEN)).toBeNull();
    expect(restore(rememberWorking(EMPTY, V1), V1)).toBeNull();
  });
});

describe('telling a child what going back would cost', () => {
  test('one changed line costs one line', () => {
    const state = markBroken(rememberWorking(EMPTY, 'a\nb\nc'), 'a\nCHANGED\nc');
    expect(costOfRestoring(state, 'a\nCHANGED\nc')).toBe(1);
  });

  test('three added lines cost three', () => {
    const now = 'a\nb\nc\nd\ne\nf';
    const state = markBroken(rememberWorking(EMPTY, 'a\nb\nc'), now);
    expect(costOfRestoring(state, now)).toBe(3);
  });

  test('nothing to restore costs nothing', () => {
    expect(costOfRestoring(EMPTY, V1)).toBe(0);
    expect(costOfRestoring(rememberWorking(EMPTY, V1), V1)).toBe(0);
  });

  test('it never reports a negative cost', () => {
    const now = 'a';
    const state = markBroken(rememberWorking(EMPTY, 'a\nb\nc\nd\ne'), now);
    expect(costOfRestoring(state, now)).toBeGreaterThanOrEqual(0);
  });
});

describe('the shape stays predictable', () => {
  test('every function tolerates being handed nothing', () => {
    expect(() => rememberWorking(undefined, undefined)).not.toThrow();
    expect(() => markBroken(undefined, undefined)).not.toThrow();
    expect(() => canRestore(undefined, undefined)).not.toThrow();
    expect(() => restore(undefined, undefined)).not.toThrow();
    expect(() => costOfRestoring(undefined, undefined)).not.toThrow();
    expect(() => lastWorking(undefined, undefined)).not.toThrow();
  });

  test('the starting state has nothing in it', () => {
    expect(EMPTY).toEqual({ working: [], brokenSince: null });
  });
});
