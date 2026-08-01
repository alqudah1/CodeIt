import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../Header/Header';
import SiteFooter from '../../components/SiteFooter/SiteFooter';
import { useSEO } from '../../hooks/useSEO';
import { trackEvent } from '../../utils/trackEvent';
import './FirstGameChallenge.css';

export const GAME_STARTERS = [
  {
    id: 'reaction',
    number: '01',
    icon: '⚡',
    title: 'Reaction Rush',
    description: 'Tap the target as quickly as you can across five rounds.',
    prompt: 'a colorful reaction speed game for kids with five rounds, a glowing target that appears after a random delay, reaction time for each round, a best-time score, and a play-again button',
  },
  {
    id: 'football',
    number: '02',
    icon: '⚽',
    title: 'Penalty Hero',
    description: 'Choose a corner, beat the goalkeeper, and track your score.',
    prompt: 'a football penalty shootout game for kids with left center and right shot buttons, an animated goalkeeper, five attempts, a live score, win feedback, and a restart button',
  },
  {
    id: 'pet-catch',
    number: '03',
    icon: '🐾',
    title: 'Pet Catch',
    description: 'Catch friendly pets before the timer reaches zero.',
    prompt: 'a cheerful pet-catching game for kids where cute animal emoji appear in random places, each catch adds a point, a 30-second timer counts down, the game gets faster, and a result screen has a play-again button',
  },
];

function builderLink(prompt) {
  return `/builder?prompt=${encodeURIComponent(prompt)}`;
}

export default function FirstGameChallenge() {
  useSEO({
    title: 'Build Your First Game Free | 10-Minute Coding Challenge | CodeIt',
    description: 'Choose a game idea, build a playable first version, change it, save it, and earn XP. A free coding challenge for young creators ages 8–18.',
    canonical: '/first-game-challenge',
  });

  useEffect(() => {
    const key = 'codeit_first_game_challenge_viewed';
    if (sessionStorage.getItem(key) === 'yes') return;
    sessionStorage.setItem(key, 'yes');
    void trackEvent('challenge_view');
  }, []);

  return (
    <>
      <Header />
      <main className="fgc-page">
        <section className="fgc-hero">
          <div className="fgc-wrap fgc-hero__grid">
            <div className="fgc-hero__copy">
              <p className="fgc-kicker">Free first-game challenge · Ages 8–18</p>
              <h1>Build your first game. Make it yours.</h1>
              <p className="fgc-hero__lead">
                Pick one idea, get a playable first version, change one thing, and save what you made.
                No download. No payment. No coding experience needed.
              </p>
              <a className="fgc-button fgc-button--primary" href="#choose-game">Choose your game <span>↓</span></a>
              <p className="fgc-age-note">
                Ages 8–12 participate through a parent-managed profile. Independent student accounts begin at 13.
              </p>
            </div>

            <div className="fgc-demo" aria-label="Example reaction game scorecard">
              <div className="fgc-demo__top"><span>REACTION RUSH</span><strong>ROUND 3 / 5</strong></div>
              <div className="fgc-demo__screen">
                <span className="fgc-demo__target">⚡</span>
                <p>Tap when it glows!</p>
              </div>
              <div className="fgc-demo__score">
                <span><small>BEST TIME</small><strong>284 ms</strong></span>
                <span><small>XP TO EARN</small><strong>+25 XP</strong></span>
              </div>
            </div>
          </div>
        </section>

        <section className="fgc-proof" aria-label="Challenge commitments">
          <div className="fgc-wrap">
            <p><strong>Free to try</strong><span>Build before creating an account.</span></p>
            <p><strong>Playable result</strong><span>Buttons, score, and restart must work.</span></p>
            <p><strong>Private first</strong><span>Your saved project starts private.</span></p>
          </div>
        </section>

        <section id="choose-game" className="fgc-section fgc-choices">
          <div className="fgc-wrap">
            <div className="fgc-heading">
              <p className="fgc-kicker">Step 1 · Pick one</p>
              <h2>Which game sounds fun?</h2>
              <p>We provide the starting idea. You decide what it becomes.</p>
            </div>
            <div className="fgc-choice-grid">
              {GAME_STARTERS.map((game) => (
                <article key={game.id} className="fgc-choice">
                  <div className="fgc-choice__top"><span>{game.number}</span><i aria-hidden="true">{game.icon}</i></div>
                  <h3>{game.title}</h3>
                  <p>{game.description}</p>
                  <Link
                    to={builderLink(game.prompt)}
                    className="fgc-choice__link"
                    onClick={() => void trackEvent('challenge_start', game.id)}
                  >
                    Build {game.title} <span>→</span>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="fgc-section fgc-mission">
          <div className="fgc-wrap fgc-mission__grid">
            <div className="fgc-heading fgc-heading--left">
              <p className="fgc-kicker">The complete mission</p>
              <h2>A finished game is only the beginning.</h2>
              <p>The challenge is complete when the project feels like your work—not when the first version appears.</p>
            </div>
            <ol className="fgc-steps">
              <li><span>01</span><div><strong>Build it</strong><p>Start with one of the three game ideas.</p></div></li>
              <li><span>02</span><div><strong>Change it</strong><p>Edit a colour, title, rule, timer, or animation.</p></div></li>
              <li><span>03</span><div><strong>Test it</strong><p>Play a complete round and check every button.</p></div></li>
              <li><span>04</span><div><strong>Save it</strong><p>Keep the project and earn 25 XP the first time you save it with a student account.</p></div></li>
            </ol>
          </div>
        </section>

        <section className="fgc-section fgc-compete">
          <div className="fgc-wrap fgc-compete__card">
            <div>
              <p className="fgc-kicker">Keep the momentum</p>
              <h2>Save a project. Earn XP. Climb anonymously.</h2>
              <p>
                Student competition uses coder aliases instead of real names. The first save of a new project earns 25 XP,
                and every lesson or challenge gives you another reason to return.
              </p>
            </div>
            <div className="fgc-compete__actions">
              <a className="fgc-button fgc-button--primary" href="#choose-game">Start the challenge</a>
              <Link className="fgc-button fgc-button--quiet" to="/leaderboard">See the leaderboard</Link>
            </div>
          </div>
        </section>

        <section className="fgc-section fgc-parent">
          <div className="fgc-wrap fgc-parent__grid">
            <div>
              <p className="fgc-kicker">For parents</p>
              <h2>Ask three questions after they build.</h2>
            </div>
            <ol>
              <li><span>1</span>What did you change from the first version?</li>
              <li><span>2</span>Which piece of code controls the score or timer?</li>
              <li><span>3</span>What would you improve next?</li>
            </ol>
            <p className="fgc-parent__note">
              Younger learners need a parent or guardian to create their private profile.{' '}
              <Link to="/register?for=family">Create a free family account →</Link>
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
