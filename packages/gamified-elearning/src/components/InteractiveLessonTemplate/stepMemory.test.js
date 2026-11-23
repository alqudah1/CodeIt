import { loadStepState, saveStepState, signedInId, placeFromServer, stepStateKey } from './stepMemory';

function box(initial = {}) {
  const data = { ...initial };
  return { getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v); }, data };
}
const place = { stepIdx: 3, stepsDone: { 0: true, 1: true, 2: true }, picks: { 2: 'b' } };

describe('whose place in a lesson it is', () => {
  test('a pupil gets their own place back', () => {
    const s = box(); saveStepState(4, place, 12, s);
    expect(loadStepState(4, 12, s)).toEqual(place);
  });

  test('the next pupil at the same computer does not get the last pupil\'s place', () => {
    const s = box(); saveStepState(4, place, 12, s);
    expect(loadStepState(4, 13, s)).toBeNull();
  });

  test('a visitor after a pupil has signed out does not get the pupil\'s place', () => {
    const s = box(); saveStepState(4, place, 12, s);
    expect(loadStepState(4, null, s)).toBeNull();
  });

  test('a visitor gets a visitor\'s place back', () => {
    const s = box(); saveStepState(4, place, null, s);
    expect(loadStepState(4, null, s)).toEqual(place);
  });

  test('a child who started as a visitor and then joined keeps their place', () => {
    const s = box(); saveStepState(4, place, null, s);
    expect(loadStepState(4, 12, s)).toEqual(place);
  });

  test('a place saved before places carried a name: a visitor may have it, an account may not', () => {
    const s = box({ [stepStateKey(4)]: JSON.stringify(place) });
    expect(loadStepState(4, null, s)).toEqual(place);
    expect(loadStepState(4, 12, s)).toBeNull();
  });

  test('a broken or missing box is no place, not an error', () => {
    expect(loadStepState(4, 12, box({ [stepStateKey(4)]: '{not json' }))).toBeNull();
    expect(loadStepState(4, 12, null)).toBeNull();
    expect(() => saveStepState(4, place, 12, null)).not.toThrow();
  });
});

describe('who is signed in', () => {
  test('read from where the session is kept', () => {
    expect(signedInId(box({ token: 't', user: JSON.stringify({ id: 12 }) }))).toBe(12);
  });
  test('nobody without a token, whatever else is left behind', () => {
    expect(signedInId(box({ user: JSON.stringify({ id: 12 }) }))).toBeNull();
    expect(signedInId(box({ token: 't', user: 'oops' }))).toBeNull();
    expect(signedInId(box())).toBeNull();
  });
});

describe('the place the server remembers', () => {
  test('everything up to the furthest answered step is done, and the lesson opens on the next', () => {
    expect(placeFromServer([1, 3], 8)).toEqual({ stepIdx: 4, stepsDone: { 0: true, 1: true, 2: true, 3: true } });
  });
  test('a finished lesson opens on its last step, not past it', () => {
    expect(placeFromServer([0, 1, 2], 3).stepIdx).toBe(2);
  });
  test('nothing answered is no place', () => {
    expect(placeFromServer([], 8)).toBeNull();
    expect(placeFromServer(null, 8)).toBeNull();
  });
  test('a step the lesson does not have is ignored', () => {
    expect(placeFromServer([2, 40], 8)).toEqual({ stepIdx: 3, stepsDone: { 0: true, 1: true, 2: true } });
    expect(placeFromServer([40], 8)).toBeNull();
  });
});
