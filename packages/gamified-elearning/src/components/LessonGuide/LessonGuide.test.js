import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { AuthContext } from '../../context/AuthContext';
import { CharacterProvider } from '../../context/CharacterContext';
import LessonGuide from './LessonGuide';
import { resetVoiceChoice } from '../../utils/voice';

// ── Read to me (message 72) ──────────────────────────────────────────────────
//
// It never speaks until a child has asked once. Three states: never asked
// (button shown, silent), asked (every hint read, mute visible), muted
// (silent, button shown). One choice, shared with Pixel in the studio.

const renderGuide = (user, props = {}) =>
  render(
    <AuthContext.Provider value={{ user, token: user ? 't' : null }}>
      <CharacterProvider>
        <LessonGuide stepType="concept" isCurrentDone={false} isLastStep={false} {...props} />
      </CharacterProvider>
    </AuthContext.Provider>
  );

const early = { id: 1, learningMode: 'early' };

describe('LessonGuide read-aloud', () => {
  let spoken;

  beforeEach(() => {
    localStorage.clear();
    resetVoiceChoice();
    spoken = [];
    window.SpeechSynthesisUtterance = function (text) { this.text = text; };
    window.speechSynthesis = {
      cancel: jest.fn(),
      speak: jest.fn(u => spoken.push(u)),
      getVoices: () => [{ name: 'Samantha', lang: 'en-US' }],
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
    // No recordings in the test renderer: Audio.play rejects, so speech is used.
    window.Audio = function () { this.play = () => Promise.reject(new Error('no file')); this.pause = () => {}; };
  });

  afterEach(() => {
    delete window.speechSynthesis;
    delete window.SpeechSynthesisUtterance;
    delete window.Audio;
  });

  test('never speaks on its own: an early learner gets the button and silence', async () => {
    renderGuide(early);
    await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
    expect(spoken).toHaveLength(0);
    expect(screen.getByRole('button', { name: /Read this step to me/i })).toBeInTheDocument();
  });

  test('once asked, every hint is read and the mute is visible', async () => {
    const { rerender } = renderGuide(early);
    fireEvent.click(screen.getByRole('button', { name: /Read this step to me/i }));
    await waitFor(() => expect(spoken.some(u => /Press Got It/.test(u.text))).toBe(true));
    expect(localStorage.getItem('codeit_voice')).toBe('asked');
    expect(screen.getByRole('button', { name: /Voice is on/i })).toBeInTheDocument();

    spoken.length = 0;
    rerender(
      <AuthContext.Provider value={{ user: early, token: 't' }}>
        <CharacterProvider>
          <LessonGuide stepType="fillblank" isCurrentDone={false} isLastStep={false} />
        </CharacterProvider>
      </AuthContext.Provider>
    );
    await waitFor(() => expect(spoken.some(u => /Tap a word below/.test(u.text))).toBe(true));
  });

  test('the voice is chosen, at rate 1 and pitch 1, with a language set', async () => {
    renderGuide(early);
    fireEvent.click(screen.getByRole('button', { name: /Read this step to me/i }));
    await waitFor(() => expect(spoken).toHaveLength(1));
    const u = spoken[0];
    expect(u.voice?.name).toBe('Samantha');
    expect(u.lang).toBe('en-US');
    expect(u.rate).toBe(1.0);
    expect(u.pitch).toBe(1.0);
  });

  test('mute silences it and is remembered; the button comes back', async () => {
    localStorage.setItem('codeit_voice', 'asked');
    renderGuide(early);
    await waitFor(() => expect(spoken).toHaveLength(1));
    fireEvent.click(screen.getByRole('button', { name: /Voice is on/i }));
    expect(localStorage.getItem('codeit_voice')).toBe('muted');
    expect(window.speechSynthesis.cancel).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Read this step to me/i })).toBeInTheDocument();
  });

  test('muted stays silent when the hint changes', async () => {
    localStorage.setItem('codeit_voice', 'muted');
    renderGuide(early);
    await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
    expect(spoken).toHaveLength(0);
  });

  test('the old quiet key is honoured: 1 is muted, 0 is asked', async () => {
    localStorage.setItem('codeit_pixel_quiet', '1');
    renderGuide(early);
    await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
    expect(spoken).toHaveLength(0);
  });

  test('an independent learner is read to only when they press the button, each time', async () => {
    renderGuide({ id: 1, learningMode: 'independent' });
    await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
    expect(spoken).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: /Read this step to me/i }));
    await waitFor(() => expect(spoken.some(u => /Press Got It/.test(u.text))).toBe(true));
    expect(localStorage.getItem('codeit_voice')).toBeNull();
  });

  test('a signed-out visitor gets the Read to me button, not auto-speech', async () => {
    renderGuide(null);
    await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
    expect(spoken).toHaveLength(0);
    expect(screen.getByRole('button', { name: /Read this step to me/i })).toBeInTheDocument();
  });
});
