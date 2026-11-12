// ── Storage that cannot take the site down ──────────────────────────────────
//
// On a computer where site data is blocked (a school browser policy, a strict
// privacy setting), touching localStorage does not return null: it throws.
// CodeIt reads it in forty-odd places, the first of them while the first page
// is being drawn, so on those computers the whole site was a blank page.
//
// This runs before anything else. If the browser's own storage cannot be used
// it is replaced, for this tab, by one that lives in memory. Everything works;
// a sign-in and unfinished work are simply forgotten when the tab closes,
// which is what that browser's setting asked for.

function memoryStorage() {
  const kept = new Map();
  return {
    getItem: (key) => (kept.has(String(key)) ? kept.get(String(key)) : null),
    setItem: (key, value) => { kept.set(String(key), String(value)); },
    removeItem: (key) => { kept.delete(String(key)); },
    clear: () => { kept.clear(); },
    key: (index) => Array.from(kept.keys())[index] ?? null,
    get length() { return kept.size; },
  };
}

function usable(target, name) {
  try {
    const store = target[name];
    const probe = '__codeit_probe__';
    store.setItem(probe, '1');
    store.removeItem(probe);
    return true;
  } catch (e) {
    return false;
  }
}

/** Replace any storage that cannot be used. Returns the names it replaced. */
export function ensureStorage(target = window) {
  const replaced = [];
  for (const name of ['localStorage', 'sessionStorage']) {
    if (usable(target, name)) continue;
    try {
      Object.defineProperty(target, name, { value: memoryStorage(), configurable: true, writable: true });
      replaced.push(name);
    } catch (e) { /* a browser that will not let us: nothing more to try */ }
  }
  return replaced;
}

ensureStorage();
