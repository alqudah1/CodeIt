// ── Morning and night ────────────────────────────────────────────────────────
//
// Two looks, one product. Morning is the drawn world: cream, sky, ink
// outlines, the map's colours. Night is the same product on Ocean, the deep
// teal, for the evening and for the children who want it to feel like a
// console. Morning is the default. The choice lives in this browser and is
// read by every page root; a page opts into night by adding the class
// "night" (ds/night.css) when the choice says so.

import { useEffect, useState } from 'react';

export const THEME_KEY = 'codeit.theme';
const THEMES = new Set(['morning', 'night']);
const listeners = new Set();

export function getTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return THEMES.has(saved) ? saved : 'morning';
  } catch { return 'morning'; }
}

export function setTheme(theme) {
  const next = THEMES.has(theme) ? theme : 'morning';
  try { localStorage.setItem(THEME_KEY, next); } catch { /* private mode: the page still switches */ }
  if (typeof document !== 'undefined') document.documentElement.dataset.theme = next;
  listeners.forEach((fn) => fn(next));
  return next;
}

export function useTheme() {
  const [theme, set] = useState(getTheme);
  useEffect(() => {
    listeners.add(set);
    if (typeof document !== 'undefined') document.documentElement.dataset.theme = theme;
    return () => listeners.delete(set);
  }, [theme]);
  return theme;
}

/** The class a page root adds when the night is on. */
export function nightClass(theme, pageClass = '') {
  return theme === 'night' ? ` night${pageClass ? ` ${pageClass}` : ''}` : '';
}
