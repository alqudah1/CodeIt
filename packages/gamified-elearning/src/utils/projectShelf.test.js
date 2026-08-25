import {
  MAX_PROJECTS,
  MAX_PROJECT_BYTES,
  SHELF_TTL_MS,
  clearShelf,
  getProject,
  listProjects,
  migrateLegacyDraft,
  removeProject,
  saveProject,
  whenMade,
} from './projectShelf';

const NOW = 1_700_000_000_000;
const DAY = 24 * 60 * 60 * 1000;

const game = (name, extra = '') =>
  `<!doctype html><html><head><style>body{background:#101828}</style></head><body>`
  + `<h1>${name}</h1><p>${'a'.repeat(60)}</p>${extra}`
  + `<script>let score = 0;<` + `/script></body></html>`;

function fakeStorage(initial = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: key => (key in data ? data[key] : null),
    setItem: (key, value) => { data[key] = String(value); },
    removeItem: key => { delete data[key]; },
  };
}

describe('the thing this module exists to fix', () => {
  // A child made a football game on Tuesday and a space game on Wednesday, and
  // on Wednesday the football game was gone. One key, silently overwritten.
  test('a second project does not delete the first', () => {
    const store = fakeStorage();
    saveProject(store, { title: 'Football', code: game('Football') }, NOW);
    saveProject(store, { title: 'Space', code: game('Space') }, NOW + 1000);

    expect(listProjects(store, NOW + 2000).map(p => p.title)).toEqual(['Space', 'Football']);
  });

  test('nor the third, nor the fourth', () => {
    const store = fakeStorage();
    ['One', 'Two', 'Three', 'Four'].forEach((name, i) =>
      saveProject(store, { title: name, code: game(name) }, NOW + i * 1000));
    expect(listProjects(store, NOW + 9000)).toHaveLength(4);
  });
});

describe('keeping one project up to date', () => {
  test('editing the same project updates it instead of making a copy', () => {
    const store = fakeStorage();
    const first = saveProject(store, { title: 'Stars', code: game('Stars') }, NOW);
    saveProject(store, { ...first, code: game('Stars', '<!-- changed -->') }, NOW + 5000);

    const shelf = listProjects(store, NOW + 6000);
    expect(shelf).toHaveLength(1);
    expect(shelf[0].code).toContain('changed');
  });

  test('the id survives an edit, so the studio keeps writing to one place', () => {
    const store = fakeStorage();
    const first = saveProject(store, { title: 'Stars', code: game('Stars') }, NOW);
    const again = saveProject(store, { ...first, title: 'Stars 2' }, NOW + 5000);
    expect(again.id).toBe(first.id);
  });

  test('an edited project moves to the front', () => {
    const store = fakeStorage();
    const older = saveProject(store, { title: 'Older', code: game('Older') }, NOW);
    saveProject(store, { title: 'Newer', code: game('Newer') }, NOW + 1000);
    saveProject(store, { ...older, code: game('Older', '<!-- x -->') }, NOW + 2000);

    expect(listProjects(store, NOW + 3000)[0].title).toBe('Older');
  });

  test('the day it was first made is not rewritten by an edit', () => {
    const store = fakeStorage();
    const first = saveProject(store, { title: 'Stars', code: game('Stars') }, NOW);
    const edited = saveProject(store, { ...first, code: game('Stars', '<!-- x -->') }, NOW + DAY);
    expect(edited.savedAt).toBe(NOW);
    expect(edited.updatedAt).toBe(NOW + DAY);
  });
});

describe('finding one again', () => {
  test('by id', () => {
    const store = fakeStorage();
    const saved = saveProject(store, { title: 'Stars', code: game('Stars') }, NOW);
    expect(getProject(store, saved.id, NOW).title).toBe('Stars');
  });

  test('an id that is not there is nothing, not a crash', () => {
    const store = fakeStorage();
    expect(getProject(store, 'nope', NOW)).toBeNull();
    expect(getProject(store, null, NOW)).toBeNull();
  });

  test('removing one leaves the others alone', () => {
    const store = fakeStorage();
    const a = saveProject(store, { title: 'A', code: game('A') }, NOW);
    saveProject(store, { title: 'B', code: game('B') }, NOW + 1000);
    removeProject(store, a.id, NOW + 2000);
    expect(listProjects(store, NOW + 3000).map(p => p.title)).toEqual(['B']);
  });
});

describe('what the shelf refuses to hold', () => {
  test('something too small to be a project', () => {
    const store = fakeStorage();
    expect(saveProject(store, { title: 'Tiny', code: '<p>hi</p>' }, NOW)).toBeNull();
    expect(listProjects(store, NOW)).toEqual([]);
  });

  test('something far too big', () => {
    const store = fakeStorage();
    const huge = game('Huge', 'x'.repeat(MAX_PROJECT_BYTES + 10));
    expect(saveProject(store, { title: 'Huge', code: huge }, NOW)).toBeNull();
  });

  test('nothing at all', () => {
    const store = fakeStorage();
    expect(saveProject(store, null, NOW)).toBeNull();
    expect(saveProject(store, {}, NOW)).toBeNull();
    expect(saveProject(store, { code: null }, NOW)).toBeNull();
  });

  test('more than the shelf holds. The oldest goes', () => {
    const store = fakeStorage();
    for (let i = 0; i < MAX_PROJECTS + 4; i += 1) {
      saveProject(store, { title: `Game ${i}`, code: game(`Game ${i}`) }, NOW + i * 1000);
    }
    const shelf = listProjects(store, NOW + 99_000);
    expect(shelf).toHaveLength(MAX_PROJECTS);
    expect(shelf[0].title).toBe(`Game ${MAX_PROJECTS + 3}`);
    expect(shelf.some(p => p.title === 'Game 0')).toBe(false);
  });
});

describe('projects do not stay forever', () => {
  test('one older than a week is gone', () => {
    const store = fakeStorage();
    saveProject(store, { title: 'Old', code: game('Old') }, NOW);
    expect(listProjects(store, NOW + SHELF_TTL_MS + 1000)).toEqual([]);
  });

  test('one from yesterday is still there', () => {
    const store = fakeStorage();
    saveProject(store, { title: 'Yesterday', code: game('Yesterday') }, NOW);
    expect(listProjects(store, NOW + DAY)).toHaveLength(1);
  });
});

describe('a storage that does not work', () => {
  const broken = {
    getItem() { throw new Error('denied'); },
    setItem() { throw new Error('denied'); },
    removeItem() { throw new Error('denied'); },
  };

  test('the studio does not fall over', () => {
    expect(listProjects(broken, NOW)).toEqual([]);
    expect(saveProject(broken, { title: 'X', code: game('X') }, NOW)).toBeNull();
    expect(() => clearShelf(broken)).not.toThrow();
    expect(() => removeProject(broken, 'x', NOW)).not.toThrow();
  });

  test('nor does corrupt data', () => {
    expect(listProjects(fakeStorage({ 'codeit.shelf.v1': 'not json' }), NOW)).toEqual([]);
    expect(listProjects(fakeStorage({ 'codeit.shelf.v1': '{"not":"an array"}' }), NOW)).toEqual([]);
  });

  test('nor entries with the wrong shape inside good JSON', () => {
    const store = fakeStorage({ 'codeit.shelf.v1': JSON.stringify([null, 42, { code: 5 }, 'x']) });
    expect(listProjects(store, NOW)).toEqual([]);
  });
});

describe('nobody loses the project they already have', () => {
  // The failure this module exists to fix, committed by the fix itself, would
  // be the worst possible outcome.
  const legacy = (savedAt) => ({
    'codeit_guest_project_draft': JSON.stringify({
      code: game('Recovered'), prompt: 'a football game', aiTitle: 'My football game',
      projectType: 'game', savedAt,
    }),
  });

  test('the old single draft moves onto the shelf', () => {
    const store = fakeStorage(legacy(NOW));
    migrateLegacyDraft(store, NOW + 1000);
    expect(listProjects(store, NOW + 2000).map(p => p.title)).toEqual(['My football game']);
  });

  test('it keeps the day it was made, not the day it moved', () => {
    const store = fakeStorage(legacy(NOW));
    migrateLegacyDraft(store, NOW + DAY);
    expect(listProjects(store, NOW + DAY)[0].savedAt).toBe(NOW);
  });

  test('running it twice does not make two copies', () => {
    const store = fakeStorage(legacy(NOW));
    migrateLegacyDraft(store, NOW + 1000);
    migrateLegacyDraft(store, NOW + 2000);
    expect(listProjects(store, NOW + 3000)).toHaveLength(1);
  });

  test('an expired draft is not resurrected', () => {
    const store = fakeStorage(legacy(NOW - SHELF_TTL_MS - 1000));
    migrateLegacyDraft(store, NOW);
    expect(listProjects(store, NOW)).toEqual([]);
  });

  test('no draft, nothing to do', () => {
    expect(migrateLegacyDraft(fakeStorage(), NOW)).toBeNull();
  });

  test('a corrupt draft does not throw', () => {
    const store = fakeStorage({ 'codeit_guest_project_draft': '{{{' });
    expect(() => migrateLegacyDraft(store, NOW)).not.toThrow();
  });
});

describe('telling a child when they made it', () => {
  test('a moment ago', () => {
    expect(whenMade(NOW, NOW)).toBe('just now');
    expect(whenMade(NOW, NOW + 30_000)).toBe('just now');
  });

  test('minutes and hours', () => {
    expect(whenMade(NOW, NOW + 20 * 60_000)).toBe('20 minutes ago');
    expect(whenMade(NOW, NOW + 60 * 60_000)).toBe('an hour ago');
    expect(whenMade(NOW, NOW + 5 * 60 * 60_000)).toBe('5 hours ago');
  });

  test('yesterday, in the word a child uses', () => {
    expect(whenMade(NOW, NOW + DAY)).toBe('yesterday');
    expect(whenMade(NOW, NOW + 3 * DAY)).toBe('3 days ago');
  });

  test('a clock that has gone backwards does not print nonsense', () => {
    expect(whenMade(NOW + 5000, NOW)).toBe('just now');
    expect(whenMade(undefined, NOW)).toBe('just now');
  });
});
