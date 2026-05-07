import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import CharacterSpotlight from '../../components/CharacterSpotlight/CharacterSpotlight';
import Header from '../Header/Header';
import { games } from './gameCatalog';
import './Games.css';

const GameHub = () => {
  const featuredGame = useMemo(() => games[0], []);

  return (
    <div className="game-hub">
      <Header />
      <div className="game-hub__inner">
      <button type="button" className="game-back" onClick={() => window.history.back()}>
        ← Back
      </button>

      {/* Hero section */}
      <section className="game-hero">
        <div className="game-hero__copy">
          <span className="game-hero__pill">Challenge Arcade</span>
          <h1>Master coding through playful challenges</h1>
          <p>
            Each challenge reinforces what you learned in the lesson. Solve puzzles, collect XP, and
            build your coding confidence one challenge at a time.
          </p>
          <div className="game-hero__actions">
            <Link to="/game/1" className="game-cta primary">
              Play {featuredGame.title}
            </Link>
          </div>
        </div>
        <CharacterSpotlight headline="Cheer squad" cta="Update your buddy" size={220} />
      </section>

      {/* All 10 cards */}
      <section className="game-grid">
        {games.map((game) => (
          <article
            key={game.id}
            className={`game-card${game.comingSoon ? ' game-card--coming-soon' : ''}`}
            style={{ background: game.gradient }}
          >
            <div className="game-card__meta">
              <span className="game-card__difficulty">{game.difficulty}</span>
            </div>

            <h2>{game.title}</h2>
            <p>{game.summary}</p>

            <ul className="game-card__tags">
              {game.focus.map((topic) => (
                <li key={topic}>{topic}</li>
              ))}
            </ul>

            <div className="game-card__footer">
              <div className="game-card__xp">
                <span className="label">XP to earn</span>
                <strong>{game.xpReward}</strong>
              </div>

              <div className="game-card__actions">
                {game.comingSoon ? (
                  <span className="game-card__soon-badge">Coming Soon</span>
                ) : (
                  <Link to={`/game/${game.id}`} className="game-card__launch">
                    Play
                  </Link>
                )}
              </div>
            </div>
          </article>
        ))}
      </section>
      </div>
    </div>
  );
};

export default GameHub;
