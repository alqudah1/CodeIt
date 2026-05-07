import { useCharacter } from '../../context/CharacterContext';
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
    default:
      return 'Follow the instructions above and press Run.';
  }
};

const LessonGuide = ({ stepType, isCurrentDone, isLastStep }) => {
  const { character } = useCharacter();
  const hint = getHint(stepType, isCurrentDone, isLastStep);
  const name = character.nickname || 'Guide';

  return (
    <div className="lg-wrap" aria-live="polite" aria-label={`Guide says: ${hint}`}>
      <div className="lg-bubble">
        <span className="lg-bubble__name">{name}</span>
        <p className="lg-bubble__text">{hint}</p>
        <span className="lg-bubble__arrow" aria-hidden="true" />
      </div>
      <CharacterAvatar character={character} size={80} className="lg-avatar" />
    </div>
  );
};

export default LessonGuide;
