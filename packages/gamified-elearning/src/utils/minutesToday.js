// ── Minutes on CodeIt today, on this device ─────────────────────────────────
//
// The ad-style "15 min a day" is only honest if it is measured. Nothing on
// the server measures time, so this counts it where it happens: seconds the
// tab is visible, added up in this browser under today's date. It is "on this
// device", and the label says so. Nothing is sent anywhere.

const PREFIX = 'codeit.minutes.';
const TICK_MS = 15 * 1000;

export const dayKey = (now = Date.now()) => new Date(now).toISOString().slice(0, 10);

export function secondsToday(storage, now = Date.now()) {
  try { return Math.max(0, Number(storage.getItem(PREFIX + dayKey(now))) || 0); } catch { return 0; }
}

export function minutesToday(storage = typeof window !== 'undefined' ? window.localStorage : null, now = Date.now()) {
  if (!storage) return 0;
  return Math.floor(secondsToday(storage, now) / 60);
}

export function addSeconds(storage, seconds, now = Date.now()) {
  try {
    const key = PREFIX + dayKey(now);
    const next = secondsToday(storage, now) + seconds;
    storage.setItem(key, String(next));
    // Yesterday's count is not needed once today has started.
    for (let i = storage.length - 1; i >= 0; i -= 1) {
      const k = storage.key(i);
      if (k && k.startsWith(PREFIX) && k !== key) storage.removeItem(k);
    }
    return next;
  } catch { return 0; }
}

/** Start counting visible time. Returns a stop function. */
export function trackMinutes(storage = window.localStorage, doc = document, win = window) {
  let timer = null;
  const tick = () => { if (doc.visibilityState === 'visible') addSeconds(storage, TICK_MS / 1000); };
  const start = () => { if (!timer) timer = win.setInterval(tick, TICK_MS); };
  const stop = () => { if (timer) { win.clearInterval(timer); timer = null; } };
  const onVisibility = () => (doc.visibilityState === 'visible' ? start() : stop());
  doc.addEventListener('visibilitychange', onVisibility);
  onVisibility();
  return () => { stop(); doc.removeEventListener('visibilitychange', onVisibility); };
}
