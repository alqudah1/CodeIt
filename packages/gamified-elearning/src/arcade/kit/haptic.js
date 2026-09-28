// ── The arcade's touch ───────────────────────────────────────────────────────
//
// A tick under the finger on every press. On the web this is the Vibration
// API where it exists (Android, some desktops); iPhone Safari has none, and
// the iOS app supplies it through Capacitor's Haptics plugin, which is wired
// here when `window.Capacitor` is present so no caller needs to know which.

const PATTERNS = {
  tap: 8, token: 6, good: [10, 40, 20], bad: 30, win: [20, 40, 20, 40, 60], chest: [10, 30, 10, 30, 10],
};

export function haptic(name = 'tap') {
  const pattern = PATTERNS[name] || PATTERNS.tap;
  try {
    const cap = window.Capacitor?.Plugins?.Haptics;
    if (cap) {
      if (name === 'good' || name === 'win' || name === 'chest') cap.notification({ type: 'SUCCESS' });
      else if (name === 'bad') cap.notification({ type: 'WARNING' });
      else cap.impact({ style: 'LIGHT' });
      return true;
    }
    if (navigator.vibrate) return navigator.vibrate(pattern);
  } catch (_) { /* never let feedback throw */ }
  return false;
}
