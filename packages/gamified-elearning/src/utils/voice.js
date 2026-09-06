// ── The Read to me voice ─────────────────────────────────────────────────────
//
// Message 72. Two separate problems, two fixes, and one thing that makes it
// a product rather than a browser.
//
// 1. IT NEVER SPEAKS UNTIL A CHILD HAS ASKED ONCE. The old rule read every
//    hint aloud to an "early" learner the moment the hint changed: no
//    gesture, no warning, on a shared device or a bus. And browsers
//    increasingly refuse speech that is not tied to a gesture, so on some
//    devices it silently did nothing and on others it blared. The state is
//    three-way, not two:
//
//      never (default)  the button is shown, nothing is said
//      asked            every hint is read, a mute is always visible
//      muted            nothing is said, the button is shown
//
//    The old codeit_pixel_quiet key only knew the last two. It is read once
//    for people who already chose, then this key takes over.
//
// 2. A VOICE IS CHOSEN. Nothing set `voice` or `lang`, so the operating
//    system default spoke, which on iOS is the compact low-quality voice.
//    And rate 0.82 with pitch 1.08 made it worse: slowing a synthetic voice
//    stretches its artefacts and raising the pitch is the single strongest
//    "this is a robot" signal. Now: getVoices() filtered to English,
//    preferring the Enhanced / Premium / Samantha set on Apple and the
//    Google voices elsewhere, resolved once after `voiceschanged` (the list
//    is empty on first call in most browsers) and cached; lang set; rate
//    1.0, pitch 1.0.
//
// 3. THE NINE HINT LINES ARE FILES. The hints are a fixed set, so they are
//    recorded once and played instead of synthesised, when the file is
//    there (public/voice/<id>.mp3; see scripts/render-hints.sh). Synthesis
//    stays the fallback for anything not in the set and for lesson body
//    text, which is too long and too variable to record.

export const VOICE_KEY = 'codeit_voice';
const LEGACY_QUIET_KEY = 'codeit_pixel_quiet';

export const VOICE_STATES = Object.freeze(['never', 'asked', 'muted']);

function store() {
  try { return window.localStorage; } catch { return null; }
}

/** 'never' | 'asked' | 'muted' */
export function voiceState(storage = store()) {
  try {
    const v = storage?.getItem(VOICE_KEY);
    if (VOICE_STATES.includes(v)) return v;
    // People who chose before the three-way state existed keep their choice.
    const legacy = storage?.getItem(LEGACY_QUIET_KEY);
    if (legacy === '1') return 'muted';
    if (legacy === '0') return 'asked';
  } catch { /* private mode */ }
  return 'never';
}

export function setVoiceState(state, storage = store()) {
  if (!VOICE_STATES.includes(state)) return;
  try {
    storage?.setItem(VOICE_KEY, state);
    // Keep the old key in step for anything still reading it.
    storage?.setItem(LEGACY_QUIET_KEY, state === 'muted' ? '1' : '0');
  } catch { /* private mode */ }
  try { window.dispatchEvent(new Event(VOICE_EVENT)); } catch { /* no window */ }
}

export const VOICE_EVENT = 'codeit:voice';

/** True only when a child has asked once and has not muted since. */
export function shouldAutoRead(storage = store()) {
  return voiceState(storage) === 'asked';
}

// ── Choosing a voice ─────────────────────────────────────────────────────────

const PREFERRED = [
  /samantha/i, /enhanced/i, /premium/i, /google us english/i, /google uk english female/i, /google/i,
];

export function pickVoice(voices) {
  const english = (voices || []).filter((v) => /^en([-_]|$)/i.test(v.lang || ''));
  if (!english.length) return null;
  for (const pattern of PREFERRED) {
    const hit = english.find((v) => pattern.test(v.name || '') || pattern.test(v.voiceURI || ''));
    if (hit) return hit;
  }
  // Apple marks its better voices as non-local-service in some versions;
  // otherwise the default English voice.
  return english.find((v) => v.default) || english[0];
}

let chosen = null;
let choosing = null;

/** Resolves the chosen voice once, after the browser has its list. */
export function chooseVoice() {
  if (chosen) return Promise.resolve(chosen);
  if (choosing) return choosing;
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  if (!synth || typeof synth.getVoices !== 'function') return Promise.resolve(null);
  choosing = new Promise((resolve) => {
    const settle = () => {
      const voice = pickVoice(synth.getVoices());
      if (voice) { chosen = voice; resolve(voice); return true; }
      return false;
    };
    if (settle()) return;
    let done = false;
    const onChange = () => { if (!done && settle()) { done = true; synth.removeEventListener?.('voiceschanged', onChange); } };
    synth.addEventListener?.('voiceschanged', onChange);
    // Some browsers never fire the event; do not wait forever.
    setTimeout(() => { if (!done) { done = true; synth.removeEventListener?.('voiceschanged', onChange); resolve(settle() ? chosen : null); } }, 1500);
  });
  return choosing;
}

/** For tests. */
export function resetVoiceChoice() { chosen = null; choosing = null; }

// ── The nine hint lines, as files ────────────────────────────────────────────

export const HINT_LINES = Object.freeze({
  'hint-concept':   'Read through this step. Press Got It when you are ready.',
  'hint-example':   'Press Run to see the example code in action.',
  'hint-tryit':     'Try writing the code yourself, then press Run.',
  'hint-challenge': 'This is your challenge. Give it your best try!',
  'hint-predict':   'Read the code and tap the answer you think is right.',
  'hint-fillblank': 'Tap a word below to drop it into a yellow gap.',
  'hint-order':     'Use the arrows to move each line up or down.',
  'hint-correct':   'Correct! Press Next Step to keep going.',
  'hint-complete':  'Lesson complete! Press Continue to Quiz when you are ready.',
});

const FILE_FOR_LINE = new Map(Object.entries(HINT_LINES).map(([id, line]) => [line, `/voice/${id}.mp3`]));

/** The recorded file for a line, if the line is one of the nine. */
export function recordingFor(text) {
  return FILE_FOR_LINE.get(String(text || '').trim()) || null;
}

let player = null;
const missing = new Set();

function stopFile() {
  if (player) { try { player.pause(); } catch { /* already stopped */ } player = null; }
}

export function stopSpeaking() {
  stopFile();
  try { window.speechSynthesis?.cancel(); } catch { /* no synthesis */ }
}

async function synthesise(text) {
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  if (!text || !synth || typeof window.SpeechSynthesisUtterance !== 'function') return false;
  const voice = await chooseVoice();
  synth.cancel();
  const message = new window.SpeechSynthesisUtterance(text);
  if (voice) { message.voice = voice; message.lang = voice.lang || 'en-US'; } else { message.lang = 'en-US'; }
  message.rate = 1.0;
  message.pitch = 1.0;
  synth.speak(message);
  return true;
}

/**
 * Say a line. A recorded file when there is one and it plays; otherwise the
 * chosen synthetic voice. Resolves true when something started.
 */
export async function speak(text) {
  const line = String(text || '').trim();
  if (!line) return false;
  stopSpeaking();
  const file = recordingFor(line);
  if (file && !missing.has(file) && typeof window !== 'undefined' && typeof window.Audio === 'function') {
    try {
      const audio = new window.Audio(file);
      player = audio;
      await audio.play();
      return true;
    } catch {
      // No file shipped yet, or the browser refused: remember and fall back.
      missing.add(file);
      player = null;
    }
  }
  return synthesise(line);
}
