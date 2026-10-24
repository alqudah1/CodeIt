// ── The pages a class uses, fetched before the Wi-Fi drops ──────────────────
//
// Every page is its own file, downloaded the first time it opens. So a child
// who opened Home on good Wi-Fi, and then tapped Build after it dropped, got
// an error card instead of Build, even though Build needs no connection to
// make a game. Once the first page is up and the device has nothing else to
// do, these are fetched quietly, one at a time, so they open without the
// network later. Skipped when the device asks to save data.

export const CORE_ROUTES = [
  () => import('../pages/Build/Build'),
  () => import('../pages/Home/KidHome'),
  () => import('../pages/Powers/PowersMap'),
  () => import('../pages/Powers/Power'),
  () => import('../pages/Arcade/Arcade'),
  () => import('../pages/Profile/Profile'),
  () => import('../pages/Class/Join'),
  () => import('../pages/Class/Teach'),
];

export function shouldWarm(nav) {
  if (!nav) return false;
  if (nav.onLine === false) return false;
  const c = nav.connection;
  if (c && (c.saveData || /(^|-)2g$/.test(String(c.effectiveType || '')))) return false;
  return true;
}

/** Fetch each page's code in turn, after the page is idle. Returns a cancel. */
export function warmCoreRoutes(win = typeof window !== 'undefined' ? window : null, routes = CORE_ROUTES, delay = 4000) {
  if (!win || !shouldWarm(win.navigator)) return () => {};
  let cancelled = false;
  const next = async () => {
    for (const load of routes) {
      if (cancelled) return;
      try { await load(); } catch { /* it loads on the day it is opened instead */ }
    }
  };
  const idle = win.requestIdleCallback ? (fn) => win.requestIdleCallback(fn, { timeout: 8000 }) : (fn) => win.setTimeout(fn, 0);
  const timer = win.setTimeout(() => idle(next), delay);
  return () => { cancelled = true; win.clearTimeout(timer); };
}
