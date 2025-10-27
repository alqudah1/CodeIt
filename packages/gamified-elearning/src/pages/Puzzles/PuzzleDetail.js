import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CharacterSpotlight from '../../components/CharacterSpotlight/CharacterSpotlight';
import { getPuzzleById, getPuzzleLaunchUrl, puzzles } from './puzzleCatalog';
import './Puzzles.css';

const PuzzleDetail = () => {
  const { puzzleId } = useParams();
  const navigate = useNavigate();
  const puzzle = useMemo(() => getPuzzleById(puzzleId), [puzzleId]);

  if (!puzzle) {
    return (
      <div className="puzzle-detail missing">
        <h1>We couldn&apos;t find that puzzle</h1>
        <p>Head back to the arcade to pick another challenge.</p>
        <button type="button" onClick={() => navigate('/puzzles')} className="puzzle-cta primary">
          Back to puzzles
        </button>
      </div>
    );
  }

  const launchUrl = getPuzzleLaunchUrl(puzzle);

  return (
    <div className="puzzle-detail">
      <header className="puzzle-detail__header">
        <button type="button" className="puzzle-detail__back" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <span className="puzzle-detail__eyebrow">{puzzle.difficulty} challenge</span>
        <h1>
          {puzzle.heroEmoji} {puzzle.title}
        </h1>
        <p>{puzzle.summary}</p>
        <div className="puzzle-detail__meta">
          <div>
            <span>Focus</span>
            <strong>{puzzle.focus.join(', ')}</strong>
          </div>
          <div>
            <span>XP reward</span>
            <strong>{puzzle.xpReward}</strong>
          </div>
        </div>
        <div className="puzzle-detail__actions">
          <button
            type="button"
            className="puzzle-cta primary"
            onClick={() => window.open(launchUrl, '_blank', 'noopener')}
          >
            Launch puzzle ↗
          </button>
          <button type="button" className="puzzle-cta secondary" onClick={() => navigate('/puzzles')}>
            Browse all puzzles
          </button>
        </div>
      </header>

      <section className="puzzle-detail__embed">
        <iframe
          title={puzzle.title}
          src={launchUrl}
          className="puzzle-frame"
          loading="lazy"
        />
        <aside className="puzzle-detail__sidebar">
          <CharacterSpotlight headline="Coding pal" cta="Customize avatar" size={180} />
          <div className="puzzle-detail__tips">
            <h2>Pro tips</h2>
            <ul>
              <li>Focus on the logic before writing code.</li>
              <li>Look for repeating patterns—you may not need loops at first, but they help!</li>
              <li>Stuck? Open the puzzle in a new tab for a larger view.</li>
            </ul>
          </div>
        </aside>
      </section>

      <section className="puzzle-detail__more">
        <h2>Next challenges</h2>
        <div className="puzzle-detail__more-grid">
          {puzzles
            .filter((item) => item.id !== puzzle.id)
            .slice(0, 3)
            .map((item) => (
              <button
                key={item.id}
                type="button"
                className="puzzle-more-card"
                onClick={() => navigate(`/puzzle/${item.id}`)}
              >
                <span className="emoji" aria-hidden="true">
                  {item.heroEmoji}
                </span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.summary}</p>
                </div>
              </button>
            ))}
        </div>
      </section>
    </div>
  );
};

export default PuzzleDetail;
