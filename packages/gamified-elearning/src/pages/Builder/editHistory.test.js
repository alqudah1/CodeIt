import {
  EMPTY,
  MAX_ENTRIES,
  canRedo,
  canUndo,
  clearHistory,
  redo,
  redoLabel,
  remember,
  undo,
  undoLabel,
} from './editHistory';

const A = '<html>a</html>';
const B = '<html>b</html>';
const C = '<html>c</html>';

describe('a fresh history', () => {
  test('offers nothing to undo or redo', () => {
    expect(canUndo(EMPTY)).toBe(false);
    expect(canRedo(EMPTY)).toBe(false);
    expect(undoLabel(EMPTY)).toBe('');
  });

  test('undoing nothing is a no-op rather than a crash', () => {
    expect(undo(EMPTY, A)).toEqual({ history: EMPTY, html: null });
    expect(redo(EMPTY, A)).toEqual({ history: EMPTY, html: null });
  });

  test('survives being handed nothing at all', () => {
    expect(canUndo(undefined)).toBe(false);
    expect(undo(undefined, A).html).toBeNull();
    expect(remember(undefined, A, 'x').past).toHaveLength(1);
  });
});

describe('one change', () => {
  test('can be undone, and gives back what was there before', () => {
    const history = remember(EMPTY, A, 'Moved it');
    expect(canUndo(history)).toBe(true);
    expect(undoLabel(history)).toBe('Moved it');

    const result = undo(history, B);
    expect(result.html).toBe(A);
    expect(canUndo(result.history)).toBe(false);
    expect(canRedo(result.history)).toBe(true);
  });

  test('can be redone after undoing', () => {
    const history = remember(EMPTY, A, 'Moved it');
    const undone = undo(history, B);
    const redone = redo(undone.history, undone.html);

    expect(redone.html).toBe(B);
    expect(canUndo(redone.history)).toBe(true);
    expect(canRedo(redone.history)).toBe(false);
  });

  test('the redo button names the step it will replay', () => {
    const undone = undo(remember(EMPTY, A, 'Changed the colour'), B);
    expect(redoLabel(undone.history)).toBe('Changed the colour');
  });
});

describe('several changes', () => {
  test('undo walks back one step at a time, newest first', () => {
    let history = remember(EMPTY, A, 'first');
    history = remember(history, B, 'second');

    const back1 = undo(history, C);
    expect(back1.html).toBe(B);

    const back2 = undo(back1.history, back1.html);
    expect(back2.html).toBe(A);
    expect(canUndo(back2.history)).toBe(false);
  });

  test('a new change after undoing discards the redo stack', () => {
    // Standard editor behaviour: undo twice, do something else, and the branch
    // you abandoned is gone.
    let history = remember(EMPTY, A, 'first');
    const undone = undo(history, B);
    expect(canRedo(undone.history)).toBe(true);

    const afterNewEdit = remember(undone.history, C, 'something else');
    expect(canRedo(afterNewEdit)).toBe(false);
  });
});

describe('changes that are not changes', () => {
  test('recording the same page twice does not add a second step', () => {
    // Dragging an element one pixel and back would otherwise leave two entries
    // that both do nothing, so undo would appear broken.
    let history = remember(EMPTY, A, 'Moved it');
    history = remember(history, A, 'Moved it');
    expect(history.past).toHaveLength(1);
  });

  test('an empty or non-string snapshot is ignored', () => {
    expect(remember(EMPTY, '', 'x')).toBe(EMPTY);
    expect(remember(EMPTY, null, 'x')).toBe(EMPTY);
    expect(remember(EMPTY, undefined, 'x')).toBe(EMPTY);
    expect(remember(EMPTY, 42, 'x')).toBe(EMPTY);
  });

  test('a missing label still gives the button something to say', () => {
    expect(undoLabel(remember(EMPTY, A))).toBeTruthy();
  });
});

describe('memory is bounded', () => {
  test('the stack stops growing past its limit', () => {
    let history = EMPTY;
    for (let i = 0; i < MAX_ENTRIES + 25; i += 1) {
      history = remember(history, `<html>${i}</html>`, `step ${i}`);
    }
    expect(history.past).toHaveLength(MAX_ENTRIES);
    // The oldest steps fall off, not the newest.
    expect(history.past[history.past.length - 1].label).toBe(`step ${MAX_ENTRIES + 24}`);
  });

  test('a few enormous pages cannot eat all the memory on a school laptop', () => {
    const huge = '<html>' + 'x'.repeat(1_500_000) + '</html>';
    let history = EMPTY;
    for (let i = 0; i < 8; i += 1) {
      history = remember(history, huge + i, `step ${i}`);
    }
    const bytes = history.past.reduce((sum, e) => sum + e.html.length, 0);
    expect(bytes).toBeLessThanOrEqual(4 * 1024 * 1024);
    // Still usable. it keeps at least the most recent step.
    expect(canUndo(history)).toBe(true);
  });
});

describe('history does not leak between projects', () => {
  test('clearing leaves nothing to undo into', () => {
    const history = remember(remember(EMPTY, A, 'a'), B, 'b');
    const cleared = clearHistory();
    expect(canUndo(cleared)).toBe(false);
    expect(canRedo(cleared)).toBe(false);
    // The original is untouched. these functions never mutate.
    expect(history.past).toHaveLength(2);
  });

  test('remember and undo never mutate what they are given', () => {
    const history = remember(EMPTY, A, 'a');
    const before = JSON.stringify(history);
    remember(history, B, 'b');
    undo(history, C);
    expect(JSON.stringify(history)).toBe(before);
  });
});
