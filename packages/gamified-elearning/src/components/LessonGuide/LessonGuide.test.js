import { render, screen, fireEvent } from '@testing-library/react';
import { AuthContext } from '../../context/AuthContext';
import { CharacterProvider } from '../../context/CharacterContext';
import LessonGuide from './LessonGuide';

// ── Read-aloud for lessons ───────────────────────────────────────────────────
//
// The Studio's Pixel already reads every step to a "Big help" learner. Lessons
// are where class hours actually go, so the lesson guide must do the same:
// speak each hint automatically for an early learner, stay silent when muted,
// and share the same mute key so quiet in one place is quiet everywhere.

const renderGuide = (user, props = {}) =>
  render(
    <AuthContext.Provider value={{ user, token: user ? 't' : null }}>
      <CharacterProvider>
        <LessonGuide stepType="concept" isCurrentDone={false} isLastStep={false} {...props} />
      </CharacterProvider>
    </AuthContext.Provider>
  );

describe('LessonGuide read-aloud', () => {
  let spoken;

  beforeEach(() => {
    localStorage.clear();
    spoken = [];
    window.SpeechSynthesisUtterance = function (text) { this.text = text; };
    window.speechSynthesis = {
      cancel: jest.fn(),
      speak: jest.fn(u => spoken.push(u.text)),
    };
  });

  afterEach(() => {
    delete window.speechSynthesis;
    delete window.SpeechSynthesisUtterance;
  });

  test('reads the hint out loud to an early learner as soon as it appears', () => {
    renderGuide({ id: 1, learningMode: 'early' });
    expect(spoken.some(t => /Press Got It/.test(t))).toBe(true);
  });

  test('reads each new hint when the step changes', () => {
    const { rerender } = renderGuide({ id: 1, learningMode: 'early' });
    spoken.length = 0;
    rerender(
      <AuthContext.Provider value={{ user: { id: 1, learningMode: 'early' }, token: 't' }}>
        <CharacterProvider>
          <LessonGuide stepType="fillblank" isCurrentDone={false} isLastStep={false} />
        </CharacterProvider>
      </AuthContext.Provider>
    );
    expect(spoken.some(t => /Tap a word below/.test(t))).toBe(true);
  });

  test('the mute button silences the voice and remembers the choice', () => {
    renderGuide({ id: 1, learningMode: 'early' });
    fireEvent.click(screen.getByRole('button', { name: /Voice is on/i }));
    expect(localStorage.getItem('codeit_pixel_quiet')).toBe('1');
    expect(window.speechSynthesis.cancel).toHaveBeenCalled();
  });

  test('stays silent when the shared quiet key is set', () => {
    localStorage.setItem('codeit_pixel_quiet', '1');
    renderGuide({ id: 1, learningMode: 'early' });
    expect(spoken).toHaveLength(0);
    // The muted state is visible and reversible.
    expect(screen.getByRole('button', { name: /Voice is off/i })).toBeInTheDocument();
  });

  test('does not speak automatically to an independent learner, but offers Read to me', () => {
    renderGuide({ id: 1, learningMode: 'independent' });
    expect(spoken).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: /Read this step to me/i }));
    expect(spoken.some(t => /Press Got It/.test(t))).toBe(true);
  });

  test('a signed-out visitor gets the Read to me button, not auto-speech', () => {
    renderGuide(null);
    expect(spoken).toHaveLength(0);
    expect(screen.getByRole('button', { name: /Read this step to me/i })).toBeInTheDocument();
  });
});
