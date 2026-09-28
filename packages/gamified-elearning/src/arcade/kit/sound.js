// ── The arcade's voice ───────────────────────────────────────────────────────
//
// Every tap in the child's shell answers with a sound on the same frame as the
// press. These are synthesised, so there is nothing to download and nothing
// to wait for; recorded sounds can replace them one name at a time without
// touching a caller.
//
// Silent until the child has interacted once (browsers require it) and silent
// when they have turned sound off. The choice is remembered per browser.

const KEY = 'codeit_arcade_sound';
let ctx = null;

export function soundOn() {
  try { return localStorage.getItem(KEY) !== 'off'; } catch (_) { return true; }
}
export function setSoundOn(on) {
  try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (_) { /* no storage */ }
}

function ensure() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = ctx || new AC();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch (_) { return null; }
}

function tone(freq, length = 0.08, type = 'square', gain = 0.05, at = 0) {
  if (!soundOn()) return;
  const c = ensure(); if (!c) return;
  const osc = c.createOscillator(); const vol = c.createGain();
  osc.type = type; osc.frequency.value = freq; vol.gain.value = gain;
  osc.connect(vol); vol.connect(c.destination);
  const start = c.currentTime + at;
  osc.start(start);
  vol.gain.setValueAtTime(gain, start);
  vol.gain.exponentialRampToValueAtTime(0.0001, start + length);
  osc.stop(start + length);
}

export const sounds = {
  tap: () => tone(520, 0.05, 'square', 0.04),
  token: () => tone(720, 0.05, 'triangle', 0.05),
  step: () => tone(300, 0.04, 'square', 0.02),
  good: () => { tone(660, 0.1, 'triangle', 0.06); tone(880, 0.14, 'triangle', 0.06, 0.09); },
  bad: () => tone(220, 0.16, 'sawtooth', 0.05),
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, 'triangle', 0.06, i * 0.09)),
  chest: () => [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, 'square', 0.05, i * 0.06)),
};

/** Play a named sound. Unknown names are silent, never an error. */
export function play(name) { const fn = sounds[name]; if (fn) fn(); }
