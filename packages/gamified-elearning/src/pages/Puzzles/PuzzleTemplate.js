import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useProgress } from '../../context/ProgressContext';
import './Puzzles.css';

const PuzzleTemplate = ({
  number,
  title,
  subtitle,
  challenge,
  objectives = [],
  steps = [],
  hints = [],
  skills = [],
  resources = [],
  startLink,
  nextPuzzle,
  previousPuzzle,
  children,
}) => {
  const navigate = useNavigate();
  const { isPuzzleUnlocked, isPuzzleComplete, markPuzzleComplete } = useProgress();

  const unlocked = isPuzzleUnlocked(number);
  const completed = isPuzzleComplete(number);

  const handleStart = () => {
    if (!startLink) return;
    if (startLink.startsWith('http')) {
      window.open(startLink, '_blank', 'noopener,noreferrer');
      return;
    }
    navigate(startLink);
  };

  const handleNavigate = (target) => {
    if (!target) return;
    navigate(target);
  };

  const handleMarkComplete = () => {
    if (!completed) {
      markPuzzleComplete(number);
    }
  };

  if (!unlocked) {
    return (
      <div className="puzzle-page">
        <div className="puzzle-card">
          <button type="button" className="puzzle-back" onClick={() => navigate('/MainPage')}>
            ← Back to Dashboard
          </button>
          <header className="puzzle-hero">
            <span className="puzzle-pill">Puzzle {number}</span>
            <h1>{title}</h1>
            <p>Finish Quiz {number} to unlock this puzzle.</p>
          </header>
          <div className="puzzle-locked-message">
            <p>
              Complete Quiz {number} to keep the adventure going. Head back to the quiz page when you’re ready!
            </p>
            <button
              type="button"
              className="puzzle-unlock-btn"
              onClick={() => navigate(`/quiz/${number + 1}`)}
            >
              Return to Quiz {number}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="puzzle-page">
      <div className="puzzle-card">
        <button type="button" className="puzzle-back" onClick={() => navigate('/MainPage')}>
          ← Back to Dashboard
        </button>
        <header className="puzzle-hero">
          <span className="puzzle-pill">Puzzle {number}</span>
          <h1>{title}</h1>
          <p>{subtitle}</p>
          {skills.length > 0 && (
            <div className="puzzle-skills">
              {skills.map((skill, index) => (
                <span key={`${skill}-${index}`} className="puzzle-skill-chip">
                  {skill}
                </span>
              ))}
            </div>
          )}
        </header>

        <section className="puzzle-body">
          <article className="puzzle-panel highlight">
            <h2>Challenge</h2>
            <p>{challenge}</p>
            {objectives.length > 0 && (
              <ul className="puzzle-objectives">
                {objectives.map((objective, index) => (
                  <li key={`${objective}-${index}`}>{objective}</li>
                ))}
              </ul>
            )}
          </article>

          {steps.length > 0 && (
            <article className="puzzle-panel steps">
              <h2>Steps to Solve</h2>
              <ol className="puzzle-steps">
                {steps.map((step, index) => (
                  <li key={`${index}-${step.slice(0, 12)}`}>{step}</li>
                ))}
              </ol>
            </article>
          )}

          {hints.length > 0 && (
            <article className="puzzle-panel hints">
              <h2>Helpful Hints</h2>
              <ul className="puzzle-hints">
                {hints.map((hint, index) => (
                  <li key={`${hint}-${index}`}>{hint}</li>
                ))}
              </ul>
            </article>
          )}

          {resources.length > 0 && (
            <article className="puzzle-panel resources">
              <h2>Quick References</h2>
              <div className="puzzle-resources">
                {resources.map(({ label, href }) => (
                  <a key={label} className="puzzle-resource" href={href} target="_blank" rel="noopener noreferrer">
                    {label}
                  </a>
                ))}
              </div>
            </article>
          )}
        </section>

        <section className="puzzle-playzone">
          <h2>Interactive Playground</h2>
          {children ? (
            children
          ) : (
            <div className="puzzle-placeholder">
              <p>Interactive puzzle space reserved. Launch the activity to begin solving!</p>
            </div>
          )}
        </section>

        <footer className="puzzle-footer">
          <div className="puzzle-footer-actions">
            <button type="button" className="puzzle-cta" onClick={handleStart} disabled={!startLink}>
              {startLink ? 'Launch interactive puzzle' : 'Interactive puzzle coming soon'}
            </button>
            <button
              type="button"
              className="puzzle-complete"
              onClick={handleMarkComplete}
              disabled={completed}
            >
              {completed ? 'Puzzle marked as complete' : 'Mark puzzle as solved'}
            </button>
          </div>
          <div className="puzzle-nav">
            {previousPuzzle && (
              <button
                type="button"
                className="puzzle-nav-btn"
                onClick={() => handleNavigate(previousPuzzle)}
              >
                ← Previous puzzle
              </button>
            )}
            {nextPuzzle && (
              <button
                type="button"
                className="puzzle-nav-btn"
                onClick={() => handleNavigate(nextPuzzle)}
                disabled={!completed}
              >
                Next puzzle →
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
};

export default PuzzleTemplate;
