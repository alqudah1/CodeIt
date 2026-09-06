import {
  HINT_LINES, chooseVoice, pickVoice, recordingFor, resetVoiceChoice,
  setVoiceState, shouldAutoRead, speak, voiceState,
} from './voice';

// ── Message 72: the Read to me voice ─────────────────────────────────────────

beforeEach(() => { localStorage.clear(); resetVoiceChoice(); });
afterEach(() => { delete window.speechSynthesis; delete window.SpeechSynthesisUtterance; delete window.Audio; });

describe('three-way state', () => {
  test('the default is never: silent, with the button', () => {
    expect(voiceState()).toBe('never');
    expect(shouldAutoRead()).toBe(false);
  });
  test('asked reads; muted does not; both are remembered', () => {
    setVoiceState('asked');
    expect(shouldAutoRead()).toBe(true);
    setVoiceState('muted');
    expect(voiceState()).toBe('muted');
    expect(shouldAutoRead()).toBe(false);
  });
  test('people who chose before keep their choice', () => {
    localStorage.setItem('codeit_pixel_quiet', '1');
    expect(voiceState()).toBe('muted');
    localStorage.setItem('codeit_pixel_quiet', '0');
    expect(voiceState()).toBe('asked');
  });
});

describe('choosing a voice', () => {
  const v = (name, lang, extra = {}) => ({ name, lang, voiceURI: name, ...extra });

  test('prefers the high-quality English set and never a non-English voice', () => {
    expect(pickVoice([v('Kyoko', 'ja-JP'), v('Daniel', 'en-GB'), v('Samantha', 'en-US')]).name).toBe('Samantha');
    expect(pickVoice([v('Aaron', 'en-US'), v('Ava (Enhanced)', 'en-US')]).name).toBe('Ava (Enhanced)');
    expect(pickVoice([v('English United States', 'en-US'), v('Google US English', 'en-US')]).name).toBe('Google US English');
    expect(pickVoice([v('Kyoko', 'ja-JP')])).toBeNull();
    expect(pickVoice([v('Daniel', 'en-GB'), v('Alex', 'en-US', { default: true })]).name).toBe('Alex');
  });

  test('waits for voiceschanged when the list is empty at first, and caches', async () => {
    let listeners = [];
    let voices = [];
    window.speechSynthesis = {
      getVoices: () => voices,
      addEventListener: (_, fn) => listeners.push(fn),
      removeEventListener: (_, fn) => { listeners = listeners.filter((l) => l !== fn); },
    };
    const promise = chooseVoice();
    voices = [v('Samantha', 'en-US')];
    listeners.forEach((fn) => fn());
    expect((await promise).name).toBe('Samantha');
    voices = [];
    expect((await chooseVoice()).name).toBe('Samantha');
  });
});

describe('speaking', () => {
  test('a synthesised line carries the chosen voice, a language, rate 1 and pitch 1', async () => {
    const spoken = [];
    window.speechSynthesis = { getVoices: () => [{ name: 'Samantha', lang: 'en-US' }], addEventListener() {}, removeEventListener() {}, cancel() {}, speak: (u) => spoken.push(u) };
    window.SpeechSynthesisUtterance = function (t) { this.text = t; };
    window.Audio = function () { this.play = () => Promise.reject(new Error('404')); this.pause = () => {}; };
    expect(await speak('Something not in the set.')).toBe(true);
    expect(spoken[0]).toMatchObject({ text: 'Something not in the set.', lang: 'en-US', rate: 1, pitch: 1 });
    expect(spoken[0].voice.name).toBe('Samantha');
  });

  test('the nine hint lines map to files, and a file that plays replaces synthesis', async () => {
    expect(Object.keys(HINT_LINES)).toHaveLength(9);
    for (const line of Object.values(HINT_LINES)) expect(recordingFor(line)).toMatch(/^\/voice\/hint-[a-z]+\.mp3$/);
    expect(recordingFor('Follow the instructions above.')).toBeNull();

    const spoken = [];
    const played = [];
    window.speechSynthesis = { getVoices: () => [], addEventListener() {}, removeEventListener() {}, cancel() {}, speak: (u) => spoken.push(u) };
    window.SpeechSynthesisUtterance = function (t) { this.text = t; };
    window.Audio = function (src) { played.push(src); this.play = () => Promise.resolve(); this.pause = () => {}; };
    expect(await speak(HINT_LINES['hint-example'])).toBe(true);
    expect(played).toEqual(['/voice/hint-example.mp3']);
    expect(spoken).toHaveLength(0);
  });

  test('a missing file falls back to synthesis, once, and is not retried', async () => {
    const spoken = [];
    let tries = 0;
    window.speechSynthesis = { getVoices: () => [{ name: 'Samantha', lang: 'en-US' }], addEventListener() {}, removeEventListener() {}, cancel() {}, speak: (u) => spoken.push(u) };
    window.SpeechSynthesisUtterance = function (t) { this.text = t; };
    window.Audio = function () { tries += 1; this.play = () => Promise.reject(new Error('404')); this.pause = () => {}; };
    await speak(HINT_LINES['hint-order']);
    await speak(HINT_LINES['hint-order']);
    expect(tries).toBe(1);
    expect(spoken).toHaveLength(2);
  });
});

test('the render script and the code agree on the nine lines, word for word', () => {
  const fs = require('fs');
  const path = require('path');
  const sh = fs.readFileSync(path.join(__dirname, '../../scripts/render-hints.sh'), 'utf8');
  const inScript = Object.fromEntries([...sh.matchAll(/render (hint-[a-z]+)\s+"([^"]+)"/g)].map((m) => [m[1], m[2]]));
  expect(inScript).toEqual(HINT_LINES);
  // And the guide's own hints are the same nine strings.
  const guide = fs.readFileSync(path.join(__dirname, '../components/LessonGuide/LessonGuide.js'), 'utf8');
  for (const line of Object.values(HINT_LINES)) expect(guide).toContain(line);
});
