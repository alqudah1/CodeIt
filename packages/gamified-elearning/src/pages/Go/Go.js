// ── /go: where an ad lands ──────────────────────────────────────────────────
//
// The front page is long and honest, written for a parent who searched and
// wants to read. A parent who tapped an ad on their phone wants one promise,
// one proof and one button, above the fold. This page is that: the headline
// from the ad, three real screens of the product, what it costs, and "Set up
// my child". Nothing on it is a mock-up: the pictures are the app.
//
// Not indexed: it says what the front page says, shorter.

import { Link } from 'react-router-dom';
import Header from '../Header/Header';
import { useSEO } from '../../hooks/useSEO';
import { useAuth } from '../../context/AuthContext';
import { trackEvent } from '../../utils/trackEvent';
import { TOTAL_LESSONS } from '../Lessons/lessonRegistry';
import './Go.css';

const START = '/register?for=family&from=go';

export default function Go() {
  const { token } = useAuth();
  useSEO({
    canonical: '/go',
    title: 'Python in your pocket, like a game | CodeIt',
    description: `A map of ${TOTAL_LESSONS} Python lessons, a two-minute Python quest every day, and games your child makes by describing them. Ages 8 to 14. Free to start.`,
    image: '/images/go/map.webp',
    robots: 'noindex,follow',
  });
  const go = (what) => void trackEvent('landing_cta_click', what, token);

  return (
    <div className="go">
      <Header />
      <main className="go__main">
        <section className="go__hero">
          <p className="go__ey">CodeIt · ages 8 to 14</p>
          <h1 className="go__h1">Python in your pocket.<br />Like a game.</h1>
          <p className="go__sub">
            A map of {TOTAL_LESSONS} Python lessons, a two-minute Python quest every day, and games your child
            makes by describing them. Phone, tablet or laptop. Nothing to install.
          </p>
          <div className="go__cta">
            <Link className="ci-btn go__start" to={START} onClick={() => go('go-start')}>Set up my child, free</Link>
            <Link className="go__try" to="/lessons" onClick={() => go('go-try')}>Or let them try the map first</Link>
          </div>
        </section>

        <section className="go__shots" aria-label="Three screens from CodeIt">
          <figure className="go__shot">
            <img src="/images/go/map.webp" alt="The lesson map: a road through a green meadow with numbered stops, the child's avatar on lesson 7, and a wooden gate into the Mountain Pass" width="390" height="620" loading="eager" />
            <figcaption><b>{TOTAL_LESSONS} lessons on a map.</b> Four lands, a boss puzzle every fifth stop, a castle at the end.</figcaption>
          </figure>
          <figure className="go__shot">
            <img src="/images/go/quest.webp" alt="Today's Python quest: two lines of Python in an editor with a Run button, 15 XP, and the progress panel with level, streak and lessons done" width="390" height="675" loading="lazy" />
            <figcaption><b>Real Python, every day.</b> Two lines, Run, 15 XP. Level, streak and minutes in one panel.</figcaption>
          </figure>
          <figure className="go__shot">
            <img src="/images/go/castle.webp" alt="The end of the map: the last lessons, the capstone, and a castle with a certificate" width="390" height="750" loading="lazy" />
            <figcaption><b>A certificate at the castle.</b> With their name on it, ready to print.</figcaption>
          </figure>
        </section>

        <section className="go__rows">
          <div className="go__row">
            <span className="go__num">1</span>
            <div><b>They make the games.</b> Type a sentence, a game is playing in seconds, with its code open underneath. Change a line, see what happens.</div>
          </div>
          <div className="go__row">
            <span className="go__num">2</span>
            <div><b>You see what they did.</b> An email when they finish something. Nothing is sold to your child: plans are on a page they never see.</div>
          </div>
          <div className="go__row">
            <span className="go__num">3</span>
            <div><b>Free to start.</b> The lessons, the quests and the map cost nothing. CodeIt Plus is CA$12 a month for as many AI builds as they want and up to four children. Cancel any time.</div>
          </div>
        </section>

        <section className="go__end">
          <Link className="ci-btn go__start" to={START} onClick={() => go('go-start-end')}>Set up my child, free</Link>
          <p className="go__fine">About a minute. A private profile for your child, a password you choose, no card.</p>
        </section>
      </main>
    </div>
  );
}
