import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useCharacter } from '../../context/CharacterContext';
import { effectiveGuideLevel } from '../../utils/guideLevel';
import CharacterAvatar from '../CharacterAvatar/CharacterAvatar';
import './LessonGuide.css';

// One hint per (stepType, state) combination
const getHint = (stepType, isCurrentDone, isLastStep) => {
  if (isCurrentDone && isLastStep) {
    return 'Lesson complete! Press Continue to Quiz when you are ready.';
  }
  if (isCurrentDone) {
    return 'Correct! Press Next Step to keep going.';
  }
  switch (stepType) {
    case 'concept':
      return 'Read through this step. Press Got It when you are ready.';
    case 'example':
      return 'Press Run to see the example code in action.';
    case 'tryit':
      return 'Try writing the code yourself, then press Run.';
    case 'challenge':
      return 'This is your challenge. Give it your best try!';
    // The steps with no Run button at all. Telling a child to press Run when
    // there is nothing to press is how they get stuck and give up.
    case 'predict':
      return 'Read the code and tap the answer you think is right.';
    case 'fillblank':
      return 'Tap a word below to drop it into a yellow gap.';
    case 'order':
      return 'Use the arrows to move each line up or down.';
    default:
      return 'Follow the instructions above.';
  }
};

// Same voice as Pixel in the studio, so the site sounds like one guide.
function readHint(text) {
  if (!text || !window.speechSynthesis || typeof window.SpeechSynthesisUtterance !== 'function') return;
  window.speechSynthesis.cancel();
  const message = new window.SpeechSynthesisUtterance(text);
  message.rate = 0.82;
  message.pitch = 1.08;
  window.speechSynthesis.speak(message);
}

const LessonGuide = ({ stepType, isCurrentDone, isLastStep }) => {
  const { user } = useContext(AuthContext) || {};
  const { character } = useCharacter() || {};
  const hint = getHint(stepType, isCurrentDone, isLastStep);
  // Read defensively for the same reason the lesson page above it now does:
  // this component sits on all 31 lesson pages, and a null read here takes the
  // whole page down with it. The context supplies a default character, so this
  // is belt and braces, not a known fault.
  const name = character?.nickname || 'Guide';
  const guideLevel = effectiveGuideLevel(user);
  const [quiet, setQuiet] = useState(() => {
    try { return localStorage.getItem('codeit_pixel_quiet') === '1'; } catch (_) { return false; }
  });

  // A "Big help" learner cannot yet read the hint — so the guide reads it to
  // them, every time it changes, unless a grown-up muted the voice. The mute
  // key is shared with Pixel in the studio: quiet in one place is quiet
  // everywhere.
  useEffect(() => {
    if (guideLevel !== 'early') return;
    if (localStorage.getItem('codeit_pixel_quiet') === '1') return;
    readHint(hint);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hint]);

  return (
    <div className="lg-wrap" aria-live="polite" aria-label={`Guide says: ${hint}`}>
      <div className="lg-bubble">
        <span className="lg-bubble__name">{name}</span>
        <p className="lg-bubble__text">{hint}</p>
        <div className="lg-bubble__actions">
          {/* "Big help" learners get every hint read automatically, so their
              button is the mute switch. Everyone else gets a replay button. */}
          {guideLevel === 'early' ? (
            <button
              type="button"
              className="lg-bubble__quiet"
              aria-pressed={quiet}
              aria-label={quiet ? 'Voice is off. Turn it on' : 'Voice is on. Turn it off'}
              onClick={() => {
                const next = !quiet;
                setQuiet(next);
                try { localStorage.setItem('codeit_pixel_quiet', next ? '1' : '0'); } catch (_) {}
                if (next && window.speechSynthesis) window.speechSynthesis.cancel();
                else readHint(hint);
              }}
            >
              {quiet ? '🔇' : '🔊'}
            </button>
          ) : (
            <button
              type="button"
              className="lg-bubble__read"
              onClick={() => readHint(hint)}
              aria-label="Read this step to me"
            >
              🔊 Read to me
            </button>
          )}
        </div>
        <span className="lg-bubble__arrow" aria-hidden="true" />
      </div>
      <CharacterAvatar character={character} size={80} className="lg-avatar" />
    </div>
  );
};

export default LessonGuide;
