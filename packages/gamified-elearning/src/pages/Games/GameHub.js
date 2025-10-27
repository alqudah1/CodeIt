import { useMemo } from 'react';
import CharacterSpotlight from '../../components/CharacterSpotlight/CharacterSpotlight';
import { getGameLaunchUrl, games } from './gameCatalog';
import './Games.css';

const GameHub = () => {
  const featuredGame = useMemo(() => games[0], []);

  return (
    <div className="game-hub">
      <button type="button" className="game-back" onClick={() => window.history.back()}>
        ← Back
      </button>
      <section className="game-hero">
        <div className="game-hero__copy">
          <span className="game-hero__pill">Game Arcade</span>
          <h1>Master coding through playful games</h1>
          <p>
            Each game is an adventure that sharpens your programming skills. Have fun, collect XP, unlock achievements,
            and build your coding confidence one game at a time.
          </p>
          <div className="game-hero__actions">
            <a
              href={getGameLaunchUrl(featuredGame, true)}
              className="game-cta primary"
              target="_blank"
              rel="noreferrer"
            >
              Play {featuredGame.title}
            </a>
            <a
              href={getGameLaunchUrl(featuredGame, true)}
              className="game-cta secondary"
              target="_blank"
              rel="noreferrer"
            >
              Launch in new tab ↗
            </a>
          </div>
        </div>
        <CharacterSpotlight headline="Cheer squad" cta="Update your buddy" size={220} />
      </section>

      <section className="game-grid">
        {games.map((game) => (
          <article
            key={game.id}
            className="game-card"
            style={{ background: game.gradient }}
          >
            <div className="game-card__meta">
              <span className="game-card__emoji" aria-hidden="true">
                {game.heroEmoji}
              </span>
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
                <span className="label">XP reward</span>
                <strong>{game.xpReward}</strong>
              </div>
              <div className="game-card__actions">
                <a
                  href={getGameLaunchUrl(game, true)}
                  className="game-card__launch"
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

export default GameHub;

