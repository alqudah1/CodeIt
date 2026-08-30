import {
  syncUnderstandingToAccount,
  MAX_RECORDS,
  RECORD_KEY,
  SKILL_FOR_QUESTION,
  clearUnderstanding,
  hasUnderstood,
  listUnderstanding,
  recordUnderstanding,
  skillFor,
  skillsShown,
  summarise,
} from './understanding';

const NOW = 1_700_000_000_000;

function fakeStorage(initial = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: key => (key in data ? data[key] : null),
    setItem: (key, value) => { data[key] = String(value); },
    removeItem: key => { delete data[key]; },
  };
}

describe('what a question is allowed to claim', () => {
  test('every question maps to something that actually happened', () => {
    Object.values(SKILL_FOR_QUESTION).forEach(skill => {
      // "Understands loops" is a claim about a child. "Worked out how many
      // times a loop repeats" is a description of something they did.
      expect(skill).toMatch(/^(Found|Explained|Worked out|Traced)/);
    });
  });

  test('no claim is about mastery, ability or level', () => {
    Object.values(SKILL_FOR_QUESTION).forEach(skill => {
      expect(skill).not.toMatch(/master|expert|level|advanced|proficien|gifted/i);
    });
  });

  test('an unknown question claims nothing', () => {
    expect(skillFor('made-up')).toBeNull();
    expect(skillFor(undefined)).toBeNull();
  });
});

describe('only what they got right counts', () => {
  const questions = [
    { id: 'starting-value' },
    { id: 'increment' },
    { id: 'loop-count' },
  ];

  test('all right, all three counted', () => {
    expect(skillsShown(questions, [])).toHaveLength(3);
  });

  test('a missed question is not evidence of anything', () => {
    const shown = skillsShown(questions, ['loop-count']);
    expect(shown).toHaveLength(2);
    expect(shown.join(' ')).not.toMatch(/how many times/);
  });

  test('all wrong shows nothing', () => {
    expect(skillsShown(questions, ['starting-value', 'increment', 'loop-count'])).toEqual([]);
  });

  test('a question we have no sentence for is left out rather than invented', () => {
    expect(skillsShown([{ id: 'something-new' }], [])).toEqual([]);
  });

  test('nothing in, nothing out', () => {
    expect(skillsShown(null)).toEqual([]);
    expect(skillsShown([])).toEqual([]);
  });
});

describe('keeping the record', () => {
  const entry = { projectId: 'p1', projectTitle: 'Star Catcher', skills: ['Found the starting value of a variable in their own code'] };

  test('a project a child explained is remembered', () => {
    const store = fakeStorage();
    recordUnderstanding(store, entry, NOW);
    expect(listUnderstanding(store)).toHaveLength(1);
    expect(hasUnderstood(store, 'p1')).toBe(true);
  });

  test('a project they have not explained is not', () => {
    expect(hasUnderstood(fakeStorage(), 'p1')).toBe(false);
    expect(hasUnderstood(fakeStorage(), null)).toBe(false);
  });

  test('explaining the same project twice is still one piece of evidence', () => {
    const store = fakeStorage();
    recordUnderstanding(store, entry, NOW);
    recordUnderstanding(store, entry, NOW + 5000);
    expect(listUnderstanding(store)).toHaveLength(1);
  });

  test('but the newer attempt replaces the older one', () => {
    const store = fakeStorage();
    recordUnderstanding(store, entry, NOW);
    recordUnderstanding(store, { ...entry, skills: ['Explained what a line that adds to the score does'] }, NOW + 5000);
    expect(listUnderstanding(store)[0].skills).toEqual(['Explained what a line that adds to the score does']);
  });

  test('newest first, so a parent sees the most recent thing', () => {
    const store = fakeStorage();
    recordUnderstanding(store, { ...entry, projectId: 'old', projectTitle: 'Old' }, NOW);
    recordUnderstanding(store, { ...entry, projectId: 'new', projectTitle: 'New' }, NOW + 1000);
    expect(listUnderstanding(store).map(r => r.projectTitle)).toEqual(['New', 'Old']);
  });

  test('an attempt that showed nothing is not recorded', () => {
    const store = fakeStorage();
    expect(recordUnderstanding(store, { ...entry, skills: [] }, NOW)).toBeNull();
    expect(listUnderstanding(store)).toEqual([]);
  });

  test('nonsense is refused', () => {
    const store = fakeStorage();
    expect(recordUnderstanding(store, null, NOW)).toBeNull();
    expect(recordUnderstanding(store, { projectId: '', skills: ['x'] }, NOW)).toBeNull();
    expect(recordUnderstanding(store, { projectId: 'p', skills: 'not a list' }, NOW)).toBeNull();
  });

  test('the list does not grow without limit', () => {
    const store = fakeStorage();
    for (let i = 0; i < MAX_RECORDS + 10; i += 1) {
      recordUnderstanding(store, { ...entry, projectId: `p${i}` }, NOW + i);
    }
    expect(listUnderstanding(store)).toHaveLength(MAX_RECORDS);
  });

  test('clearing it works', () => {
    const store = fakeStorage();
    recordUnderstanding(store, entry, NOW);
    clearUnderstanding(store);
    expect(listUnderstanding(store)).toEqual([]);
  });
});

describe('a storage that does not work', () => {
  const broken = {
    getItem() { throw new Error('denied'); },
    setItem() { throw new Error('denied'); },
    removeItem() { throw new Error('denied'); },
  };

  test('nothing throws, and the child still had their moment', () => {
    expect(listUnderstanding(broken)).toEqual([]);
    expect(recordUnderstanding(broken, { projectId: 'p', skills: ['x'] }, NOW)).toBeNull();
    expect(hasUnderstood(broken, 'p')).toBe(false);
    expect(() => clearUnderstanding(broken)).not.toThrow();
  });

  test('corrupt data is ignored', () => {
    expect(listUnderstanding(fakeStorage({ [RECORD_KEY]: 'not json' }))).toEqual([]);
    expect(listUnderstanding(fakeStorage({ [RECORD_KEY]: '{"a":1}' }))).toEqual([]);
    expect(listUnderstanding(fakeStorage({ [RECORD_KEY]: '[null,3,{"nope":1}]' }))).toEqual([]);
  });
});

describe('the line a parent reads', () => {
  const record = (id, skills) => ({ projectId: id, projectTitle: id, skills, at: NOW });

  test('one project, one thing', () => {
    expect(summarise([record('a', ['Found the starting value of a variable in their own code'])]))
      .toBe('Explained 1 project, showing 1 thing they understood about their own code.');
  });

  test('several projects and several things', () => {
    const summary = summarise([
      record('a', ['Found the starting value of a variable in their own code', 'Explained what a line that adds to the score does']),
      record('b', ['Worked out how many times a loop repeats']),
    ]);
    expect(summary).toBe('Explained 2 projects, showing 3 different things they understood about their own code.');
  });

  test('the same skill twice is still one thing', () => {
    const same = ['Worked out how many times a loop repeats'];
    expect(summarise([record('a', same), record('b', same)]))
      .toContain('showing 1 thing');
  });

  test('nothing yet says nothing, rather than "0 projects"', () => {
    expect(summarise([])).toBeNull();
    expect(summarise(null)).toBeNull();
  });

  test('it never mentions a score or a percentage', () => {
    const summary = summarise([record('a', ['Worked out how many times a loop repeats'])]);
    // Whole words: an earlier version used /xp/i, which matches "e-x-p-lained"
    // and failed on the very sentence it was meant to approve.
    expect(summary).not.toMatch(/%|\bscore\b|\bpoints\b|\bxp\b|\brank\b/i);
  });
});

// ── The sign-in migration ────────────────────────────────────────────────────
describe('syncUnderstandingToAccount', () => {
  const store = () => {
    const map = new Map();
    return {
      getItem: k => (map.has(k) ? map.get(k) : null),
      setItem: (k, v) => map.set(k, String(v)),
      removeItem: k => map.delete(k),
    };
  };

  test('posts the browser records once per account, then never again', async () => {
    const storage = store();
    recordUnderstanding(storage, { projectId: 'p1', projectTitle: 'Maze', skills: ['Worked out how many times a loop repeats'] });
    const calls = [];
    const fetchFn = jest.fn(async (url, opts) => { calls.push({ url, body: JSON.parse(opts.body) }); return { ok: true }; });

    const first = await syncUnderstandingToAccount(storage, { token: 't', userId: 7, apiBaseUrl: 'http://x', fetchFn });
    expect(first).toBe(true);
    expect(calls[0].url).toBe('http://x/api/understanding/import');
    expect(calls[0].body.records[0].projectId).toBe('p1');

    const second = await syncUnderstandingToAccount(storage, { token: 't', userId: 7, apiBaseUrl: 'http://x', fetchFn });
    expect(second).toBe(false);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  test('a failed import is retried on the next visit, not marked done', async () => {
    const storage = store();
    recordUnderstanding(storage, { projectId: 'p1', projectTitle: 'Maze', skills: ['Worked out how many times a loop repeats'] });
    const fetchFn = jest.fn(async () => ({ ok: false }));
    expect(await syncUnderstandingToAccount(storage, { token: 't', userId: 7, apiBaseUrl: 'http://x', fetchFn })).toBe(false);
    // Next visit tries again.
    const good = jest.fn(async () => ({ ok: true }));
    expect(await syncUnderstandingToAccount(storage, { token: 't', userId: 7, apiBaseUrl: 'http://x', fetchFn: good })).toBe(true);
  });

  test('an empty browser still marks the account synced without a request', async () => {
    const storage = store();
    const fetchFn = jest.fn();
    expect(await syncUnderstandingToAccount(storage, { token: 't', userId: 9, apiBaseUrl: 'http://x', fetchFn })).toBe(true);
    expect(fetchFn).not.toHaveBeenCalled();
  });
});
