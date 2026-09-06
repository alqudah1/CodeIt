import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useCharacter } from '../../context/CharacterContext';
import { effectiveGuideLevel } from '../../utils/guideLevel';
import CharacterAvatar from '../CharacterAvatar/CharacterAvatar';
import Icon from '../Icon/Icon';
import { VOICE_EVENT, setVoiceState, speak, stopSpeaking, voiceState } from '../../utils/voice';
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
  // Three-way (message 72): never asked (default, silent), asked (every
  // hint is read, mute visible), muted (silent). Shared with Pixel in the
  // studio: one choice, everywhere.
  const [voice, setVoice] = useState(() => voiceState());
  useEffect(() => {
    const sync = () => setVoice(voiceState());
    window.addEventListener(VOICE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener(VOICE_EVENT, sync); window.removeEventListener('storage', sync); };
  }, []);

  // A "Big help" learner who asked once is read every hint from then on.
  // Nobody is read to before they have asked: the first impression the
  // product makes is not a phone talking on its own.
  useEffect(() => {
    if (guideLevel !== 'early' || voice !== 'asked') return;
    void speak(hint);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hint, voice]);

  const askForVoice = () => {
    // For a "Big help" learner the state change is what reads (the effect
    // above), so it is not read twice. Everyone else hears this one line.
    if (guideLevel === 'early' && voice !== 'asked') { setVoiceState('asked'); return; }
    void speak(hint);
  };
  const mute = () => {
    setVoiceState('muted');
    stopSpeaking();
  };

  // ── Why the bubble hides itself on a phone ───────────────────────────────
  //
  // A screenshot of lesson 1 at 390 by 844: the words "Read through this step.
  // Press Got It when you are ready." printed straight across the two print()
  // lines the step is teaching. The guide was covering the code.
  //
  // On a narrow screen the guide is now the avatar alone, and tapping it opens
  // the bubble. Nothing is lost: the hint is one tap away and still announced
  // to a screen reader. On a wide screen there is room beside the content and
  // the bubble stays open, as it always was.
  const [openOnPhone, setOpenOnPhone] = useState(false);

  return (
    <div
      className={`lg-wrap${openOnPhone ? ' lg-wrap--open' : ''}`}
      aria-live="polite"
      aria-label={`Guide says: ${hint}`}
    >
      <div className="lg-bubble">
        <span className="lg-bubble__name">{name}</span>
        <p className="lg-bubble__text">{hint}</p>
        <div className="lg-bubble__actions">
          {/* Silent until asked. Once a "Big help" learner has asked, every
              hint is read and the mute is always visible. */}
          {guideLevel === 'early' && voice === 'asked' ? (
            <button
              type="button"
              className="lg-bubble__quiet"
              aria-pressed={false}
              aria-label="Voice is on. Turn it off"
              onClick={mute}
            >
              <Icon name="speaker" size={18} />
            </button>
          ) : (
            <button
              type="button"
              className="lg-bubble__read"
              onClick={askForVoice}
              aria-label="Read this step to me"
            >
              <Icon name="speaker" size={18} /> Read to me
            </button>
          )}
        </div>
        <span className="lg-bubble__arrow" aria-hidden="true" />
      </div>
      <button
        type="button"
        className="lg-avatar-btn"
        onClick={() => setOpenOnPhone(open => !open)}
        aria-expanded={openOnPhone}
        aria-label={openOnPhone ? 'Hide the guide' : 'What should I do now?'}
      >
        <CharacterAvatar character={character} size={80} className="lg-avatar" />
      </button>
    </div>
  );
};

export default LessonGuide;
