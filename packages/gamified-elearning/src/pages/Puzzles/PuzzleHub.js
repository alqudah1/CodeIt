import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import CharacterSpotlight from '../../components/CharacterSpotlight/CharacterSpotlight';
import { getPuzzleLaunchUrl, puzzles } from './puzzleCatalog';
import './Puzzles.css';

const PuzzleHub = () => {
  const featuredPuzzle = useMemo(() => puzzles[0], []);

  return (
    <div className="puzzle-hub">
      <button type="button" className="puzzle-back" onClick={() => window.history.back()}>
        ← Back
      </button>
      <section className="puzzle-hero">
        <div className="puzzle-hero__copy">
          <span className="puzzle-hero__pill">Puzzle Arcade</span>
          <h1>Sharpen your logic with playful puzzles</h1>
          <p>
            Each challenge is a mini quest that flexes your coding instincts. Collect XP, unlock new story
            beats, and keep your streak sparkling.
          </p>
          <div className="puzzle-hero__actions">
            <Link to={`/puzzle/${featuredPuzzle.id}`} className="puzzle-cta primary">
              Play {featuredPuzzle.title}
            </Link>
            <a
              href={getPuzzleLaunchUrl(featuredPuzzle)}
              className="puzzle-cta secondary"
              target="_blank"
              rel="noreferrer"
            >
              Launch in new tab ↗
            </a>
          </div>
        </div>
        <CharacterSpotlight headline="Cheer squad" cta="Update your buddy" size={220} />
      </section>

      <section className="puzzle-grid">
        {puzzles.map((puzzle) => (
          <article
            key={puzzle.id}
            className="puzzle-card"
            style={{ background: puzzle.gradient }}
          >
            <div className="puzzle-card__meta">
              <span className="puzzle-card__emoji" aria-hidden="true">
                {puzzle.heroEmoji}
              </span>
              <span className="puzzle-card__difficulty">{puzzle.difficulty}</span>
            </div>
            <h2>{puzzle.title}</h2>
            <p>{puzzle.summary}</p>
            <ul className="puzzle-card__tags">
              {puzzle.focus.map((topic) => (
                <li key={topic}>{topic}</li>
              ))}
            </ul>
            <div className="puzzle-card__footer">
              <div className="puzzle-card__xp">
                <span className="label">XP reward</span>
                <strong>{puzzle.xpReward}</strong>
              </div>
              <div className="puzzle-card__actions">
                <Link to={`/puzzle/${puzzle.id}`} className="puzzle-card__link">
                  View details
                </Link>
                <a
                  href={getPuzzleLaunchUrl(puzzle)}
                  className="puzzle-card__launch"
                  target="_blank"
                  rel="noreferrer"
                >
                  Play ↗
                </a>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
};

export default PuzzleHub;
