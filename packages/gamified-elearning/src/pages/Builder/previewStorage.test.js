import {
  MAX_STORAGE_BYTES,
  STORAGE_MESSAGE,
  clearPreviewStorage,
  injectPreviewStorage,
  isStorageMessage,
  loadPreviewStorage,
  savePreviewStorage,
  storageKeyFor,
  storageShimScript,
  stripPreviewScripts,
} from './previewStorage';

// A fake Storage, so these tests do not depend on jsdom's.
function fakeStore(initial = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: key => (key in data ? data[key] : null),
    setItem: (key, value) => { data[key] = String(value); },
    removeItem: key => { delete data[key]; },
  };
}

describe('where a project keeps its saved data', () => {
  test('each project gets its own key, so two games do not share a high score', () => {
    expect(storageKeyFor('abc123')).not.toBe(storageKeyFor('def456'));
  });

  test('a project with no id still has somewhere to save', () => {
    expect(storageKeyFor(null)).toBe(storageKeyFor(undefined));
    expect(storageKeyFor(null)).toContain('draft');
  });

  test('a hostile id cannot escape into another key', () => {
    const key = storageKeyFor('../../codeit_token');
    expect(key).not.toContain('/');
    expect(key.startsWith('codeit.preview.storage.')).toBe(true);
  });
});

describe('reading back what a preview saved', () => {
  test('a saved high score comes back', () => {
    const store = fakeStore();
    savePreviewStorage('game', { best: '42' }, store);
    expect(loadPreviewStorage('game', store)).toEqual({ best: '42' });
  });

  test('a project that has never saved gets an empty object, not a crash', () => {
    expect(loadPreviewStorage('never', fakeStore())).toEqual({});
  });

  test('corrupt data is ignored rather than thrown', () => {
    const store = fakeStore({ [storageKeyFor('game')]: 'not json{' });
    expect(loadPreviewStorage('game', store)).toEqual({});
  });

  test('an array where an object should be is ignored', () => {
    const store = fakeStore({ [storageKeyFor('game')]: '[1,2,3]' });
    expect(loadPreviewStorage('game', store)).toEqual({});
  });

  test('non-string values are dropped, because a real Storage only holds strings', () => {
    const store = fakeStore({ [storageKeyFor('game')]: '{"a":"1","b":{"nested":true},"c":7}' });
    expect(loadPreviewStorage('game', store)).toEqual({ a: '1' });
  });

  test('a storage that throws does not take the studio down with it', () => {
    const broken = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
    expect(loadPreviewStorage('game', broken)).toEqual({});
    expect(savePreviewStorage('game', { a: '1' }, broken)).toBe(false);
  });
});

describe('what a preview is allowed to keep', () => {
  test('a runaway game cannot fill up the parent', () => {
    const store = fakeStore();
    const huge = { blob: 'x'.repeat(MAX_STORAGE_BYTES + 1) };
    expect(savePreviewStorage('game', huge, store)).toBe(false);
    expect(loadPreviewStorage('game', store)).toEqual({});
  });

  test('a normal score table is well under the cap', () => {
    const store = fakeStore();
    expect(savePreviewStorage('game', { best: '9999', name: 'Karam' }, store)).toBe(true);
  });

  test('nonsense is refused instead of stored', () => {
    const store = fakeStore();
    expect(savePreviewStorage('game', null, store)).toBe(false);
    expect(savePreviewStorage('game', 'a string', store)).toBe(false);
    expect(savePreviewStorage('game', ['a'], store)).toBe(false);
  });

  test('clearing removes it', () => {
    const store = fakeStore();
    savePreviewStorage('game', { best: '5' }, store);
    clearPreviewStorage('game', store);
    expect(loadPreviewStorage('game', store)).toEqual({});
  });
});

describe('recognising a message from a preview', () => {
  test('the real thing is accepted', () => {
    expect(isStorageMessage({ type: STORAGE_MESSAGE, data: { best: '3' } })).toBe(true);
  });

  test('everything else is not', () => {
    expect(isStorageMessage({ type: 'CODEIT_SYNC', html: '<p>' })).toBe(false);
    expect(isStorageMessage({ type: STORAGE_MESSAGE })).toBe(false);
    expect(isStorageMessage({ type: STORAGE_MESSAGE, data: ['a'] })).toBe(false);
    expect(isStorageMessage(null)).toBe(false);
    expect(isStorageMessage('CODEIT_STORAGE')).toBe(false);
  });
});

describe('the shim script itself', () => {
  test('it carries the saved values in with it', () => {
    expect(storageShimScript({ best: '77' })).toContain('"best":"77"');
  });

  test('a saved value cannot break out of the script tag', () => {
    // Someone types </script> into their game's name field.
    const script = storageShimScript({ name: '</script><img src=x onerror=alert(1)>' });
    expect(script).not.toContain('</script>');
    expect(script).toContain('\\u003c');
  });

  test('it leaves a document that already has real storage alone', () => {
    // Otherwise this would quietly replace working storage with a fake one.
    expect(storageShimScript()).toMatch(/window\.localStorage\.getItem[\s\S]*return/);
  });

  test('sessionStorage is given too, and deliberately not persisted', () => {
    const script = storageShimScript();
    expect(script).toContain("'sessionStorage'");
    expect(script).toContain('make({},false)');
  });
});

describe('putting the shim into a project', () => {
  const PAGE = '<!doctype html><html><head><title>Game</title></head><body><script>var a=1;<\/script></body></html>';

  test('it lands inside head, before the game reads its high score', () => {
    const out = injectPreviewStorage(PAGE, { best: '1' });
    expect(out.indexOf('__codeit_storage__')).toBeLessThan(out.indexOf('<title>'));
  });

  test('it always runs before the project\'s own script', () => {
    const out = injectPreviewStorage(PAGE);
    expect(out.indexOf('__codeit_storage__')).toBeLessThan(out.indexOf('var a=1'));
  });

  test('a page with no head still gets it before the body script', () => {
    const bare = '<html><body><script>var a=1;<\/script></body></html>';
    const out = injectPreviewStorage(bare);
    expect(out).toContain('__codeit_storage__');
    expect(out.indexOf('__codeit_storage__')).toBeLessThan(out.indexOf('var a=1'));
  });

  test('a bare fragment still gets it', () => {
    const out = injectPreviewStorage('<p>hi</p>');
    expect(out.indexOf('__codeit_storage__')).toBeLessThan(out.indexOf('<p>hi</p>'));
  });

  test('it is never injected twice', () => {
    const once = injectPreviewStorage(PAGE);
    expect(injectPreviewStorage(once)).toBe(once);
  });

  test('nothing in, nothing out', () => {
    expect(injectPreviewStorage('')).toBe('');
    expect(injectPreviewStorage(null)).toBe(null);
    expect(injectPreviewStorage(undefined)).toBe(undefined);
  });

  test('the project\'s own markup is untouched', () => {
    const out = injectPreviewStorage(PAGE);
    expect(out).toContain('<title>Game</title>');
    expect(out).toContain('var a=1;');
  });
});


describe('taking CodeIt\'s own scripts back out', () => {
  // The preview serialises the live document when a child edits by hand. That
  // document contains whatever we injected — and before this, a saved project
  // grew by the whole editor bridge every time.
  const LIVE = `<!doctype html><html><head><script id="__codeit_storage__">var saved={"best":"99"};<\/script>
    <style>body{color:red}</style></head><body><h1>Mine</h1>
    <script>let score = 0;<\/script>
    <script id="__codeit_bridge__">/* bridge */<\/script></body></html>`;

  test('the storage shim comes out', () => {
    expect(stripPreviewScripts(LIVE)).not.toContain('__codeit_storage__');
  });

  test('the editor bridge comes out', () => {
    expect(stripPreviewScripts(LIVE)).not.toContain('__codeit_bridge__');
  });

  test('a high score baked into the shim does not travel with the project', () => {
    // Otherwise publishing a game hands every player the author's best score.
    expect(stripPreviewScripts(LIVE)).not.toContain('"best":"99"');
  });

  test('the child\'s own code and styles are untouched', () => {
    const out = stripPreviewScripts(LIVE);
    expect(out).toContain('let score = 0;');
    expect(out).toContain('body{color:red}');
    expect(out).toContain('<h1>Mine</h1>');
  });

  test('a project that was never injected into is returned unchanged', () => {
    const plain = '<html><body><script>let a=1;<\/script></body></html>';
    expect(stripPreviewScripts(plain)).toBe(plain);
  });

  test('injecting and stripping is a round trip', () => {
    const original = '<!doctype html><html><head></head><body><p>hi</p></body></html>';
    expect(stripPreviewScripts(injectPreviewStorage(original, { best: '5' }))).toBe(original);
  });

  test('nothing in, nothing out', () => {
    expect(stripPreviewScripts('')).toBe('');
    expect(stripPreviewScripts(null)).toBe(null);
  });
});
