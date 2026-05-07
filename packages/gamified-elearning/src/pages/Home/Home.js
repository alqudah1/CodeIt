import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Header from "../Header/Header";
import { useSEO } from "../../hooks/useSEO";
import "./Home.css";

/* ── SEO lesson list (crawlable footer links) ──────────────────── */
const LESSON_TITLES = [
  null,
  "Hello Python",
  "Storing Info with Variables",
  "Strings",
  "Making Decisions with If Statements",
  "Simple Repetition",
  "For Loops",
  "Basic Lists",
  "Loops with Lists",
  "Basic Functions",
  "Combining Concepts",
  "Numbers and Arithmetic",
  "Booleans and Comparisons",
  "Logical Operators",
  "Type Casting",
  "String Formatting",
  "String Methods",
];

/* ── Hero mock card (animated, center of visual) ────────────────── */
function HeroMockCard() {
  const [phase, setPhase] = useState('prompt');

  useEffect(() => {
    const dur  = { prompt: 2200, building: 1800, result: 3200 };
    const next = { prompt: 'building', building: 'result', result: 'prompt' };
    const t = setTimeout(() => setPhase(next[phase]), dur[phase]);
    return () => clearTimeout(t);
  }, [phase]);

  return (
    <div className="hp-mock" aria-hidden="true">
      <div className="hp-mock__chrome">
        <span className="hp-mock__dot" />
        <span className="hp-mock__dot" />
        <span className="hp-mock__dot" />
        <span className="hp-mock__chrome-label">AI Builder</span>
      </div>
      <div className="hp-mock__body">
          <div className="hp-mock__prompt-row">
            <span className="hp-mock__key">Prompt</span>
            <span className="hp-mock__val">"Make a simple game"</span>
          </div>
          <div className={`hp-mock__status hp-mock__status--${phase}`}>
            {phase === 'prompt' && (
              <span className="hp-mock__idle">Ready to build...</span>
            )}
            {phase === 'building' && (
              <>
                <span className="hp-mock__spinner" />
                <span>Building...</span>
              </>
            )}
            {phase === 'result' && (
              <>
                <span className="hp-mock__check">&#10003;</span>
                <span>Playable project ready</span>
              </>
            )}
          </div>
          <div className="hp-mock__preview" aria-hidden="true">
            <div className="hp-mock__preview-bar" />
            <div className="hp-mock__preview-bar hp-mock__preview-bar--sm" />
            <div className="hp-mock__preview-game" />
          </div>
      </div>
    </div>
  );
}


/* ── What you can build cards ──────────────────────────────────── */
const BUILD_CARDS = [
  {
    title: 'Websites',
    desc: 'Fan pages, portfolios, science projects, birthday cards',
    badge: null,
    cls: 'website',
    examples: ['Soccer fan page', 'About-me page', 'Science project'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="9" y1="21" x2="9" y2="9" />
      </svg>
    ),
  },
  {
    title: 'Games',
    desc: 'Click-target games, reaction challenges, quizzes with scoring',
    badge: 'Most popular',
    cls: 'game',
    examples: ['Click-the-target game', 'Space quiz', 'Word scramble'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="7" width="20" height="11" rx="4" />
        <path d="M12 11v4M10 13h4" />
        <circle cx="17.5" cy="12.5" r="1" fill="currentColor" stroke="none" />
        <circle cx="19.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    title: 'AI Projects',
    desc: 'Story generators, random name pickers, idea machines',
    badge: null,
    cls: 'tool',
    examples: ['Random story maker', 'Name picker', 'Idea generator'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3l2.09 6.26L20 11l-5.91 1.74L12 19l-2.09-6.26L4 11l5.91-1.74L12 3z" />
        <path d="M5 3v4M3 5h4" strokeWidth="1.8" />
        <path d="M19 17v4M17 19h4" strokeWidth="1.8" />
      </svg>
    ),
  },
];

export default function Home() {
  useSEO({
    title:       'Build with AI. Learn How It Works. | CodeIt — AI Coding for Kids',
    description: 'CodeIt helps kids and beginners build websites, games, and projects with AI while learning the coding concepts behind them. Free to start, no install needed.',
    canonical:   '/',
  });

  const { user } = useAuth();

  return (
    <>
      <Header />
      <div className="homepage">
        <main className="hp-content">

          {/* ════════════════════════════════════════════════════
              HERO
          ════════════════════════════════════════════════════ */}
          <section className="hp-hero">
            <div className="hp-hero__copy">

              {user && (
                <p className="hp-eyebrow">Welcome back, {user.name || 'Builder'}</p>
              )}

              <h1 className="hp-h1">
                <span className="seo-only">
                  Build with AI, Learn How It Works — AI Coding for Kids | CodeIt
                </span>
                <span aria-hidden="true">
                  Build with AI.<br />
                  <span className="hp-h1-accent">Learn how it works.</span>
                </span>
              </h1>

              <p className="hp-sub">
                Kids create websites, games, and projects in seconds — then learn
                the coding concepts behind what they built.
              </p>

              <div className="hp-actions">
                <Link to="/builder" className="hp-btn hp-btn--primary hp-hero__cta">
                  Start Building
                </Link>
                <Link to="/lessons" className="hp-btn hp-btn--ghost">
                  Explore Lessons
                </Link>
              </div>

            </div>

            <div className="hp-hero__visual">
              <HeroMockCard />
            </div>
          </section>

          {/* ════════════════════════════════════════════════════
              WHAT YOU CAN BUILD
          ════════════════════════════════════════════════════ */}
          <section id="hp-what-you-can-build" className="hp-build" aria-labelledby="hp-h2-build">
            <h2 id="hp-h2-build" className="hp-section-title">What you can build</h2>
            <p className="hp-section-sub">Type any idea in plain words. AI builds it in seconds.</p>
            <div className="hp-build__grid">
              {BUILD_CARDS.map((card) => (
                <Link key={card.title} to="/builder" className={`hp-build-card hp-build-card--${card.cls}`}>
                  {card.badge && (
                    <span className="hp-build-card__badge">{card.badge}</span>
                  )}
                  <div className="hp-build-card__icon-wrap">
                    {card.icon}
                  </div>
                  <h3 className="hp-build-card__title">{card.title}</h3>
                  <p className="hp-build-card__desc">{card.desc}</p>
                  <ul className="hp-build-card__examples">
                    {card.examples.map((ex) => (
                      <li key={ex}>{ex}</li>
                    ))}
                  </ul>
                  <span className="hp-build-card__cta">Try this</span>
                </Link>
              ))}
            </div>
          </section>

          {/* ════════════════════════════════════════════════════
              HOW IT WORKS
          ════════════════════════════════════════════════════ */}
          <section className="hp-how" aria-labelledby="hp-h2-how">
            <h2 id="hp-h2-how" className="hp-section-title">How it works</h2>
            <div className="hp-how__steps">
              {[
                {
                  num: '1',
                  title: 'Type an idea',
                  sub: 'Describe anything in plain words — a game, a quiz, a website about anything you love.',
                  link: { to: '/builder', label: 'Open Builder' },
                },
                {
                  num: '2',
                  title: 'AI builds it',
                  sub: 'Watch your idea appear live in seconds. See the code, play the game, interact with the result.',
                  link: null,
                },
                {
                  num: '3',
                  title: 'Learn and improve it',
                  sub: 'Discover which coding concepts made it work. Take a lesson, then use what you learned to make it better.',
                  link: { to: '/lessons', label: 'Browse Lessons' },
                },
              ].map(({ num, title, sub, link }) => (
                <div key={num} className="hp-how__step">
                  <div className="hp-how__num">{num}</div>
                  <h3 className="hp-how__step-title">{title}</h3>
                  <p className="hp-how__step-sub">{sub}</p>
                  {link && (
                    <Link to={link.to} className="hp-how__step-link">{link.label} &rarr;</Link>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* ════════════════════════════════════════════════════
              AVATAR / PROGRESS PROMO
          ════════════════════════════════════════════════════ */}
          <section className="hp-xp" aria-labelledby="hp-h2-xp">
            <div className="hp-xp__inner">
              <div className="hp-xp__copy">
                <span className="hp-xp__eyebrow">Progress system</span>
                <h2 id="hp-h2-xp" className="hp-xp__title">
                  Build projects.<br />Earn XP. Level up.
                </h2>
                <p className="hp-xp__sub">
                  Every project you build, every lesson you complete, every edit you make
                  earns XP. Level up your avatar and watch your coding skills grow.
                </p>
                <div className="hp-xp__actions">
                  <Link to={user ? '/character' : '/register'} className="hp-btn hp-btn--primary">
                    {user ? 'View your avatar' : 'Create your account'}
                  </Link>
                  <Link to="/MainPage" className="hp-btn hp-btn--ghost">See progress</Link>
                </div>
              </div>
              <div className="hp-xp__visual" aria-hidden="true">
                <div className="hp-xp-card">
                  <div className="hp-xp-card__header">
                    <span className="hp-xp-card__level">Level 4</span>
                    <span className="hp-xp-card__total">340 XP</span>
                  </div>
                  <div className="hp-xp-card__bar-wrap">
                    <div className="hp-xp-card__bar" style={{ width: '68%' }} />
                  </div>
                  <p className="hp-xp-card__bar-label">68 / 100 XP to Level 5</p>
                  <div className="hp-xp-card__events">
                    <div className="hp-xp-card__event hp-xp-card__event--orange">+20 XP — Project built</div>
                    <div className="hp-xp-card__event hp-xp-card__event--green">+15 XP — Lesson complete</div>
                    <div className="hp-xp-card__event hp-xp-card__event--blue">+10 XP — Project edited</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ════════════════════════════════════════════════════
              CTA STRIP
          ════════════════════════════════════════════════════ */}
          <section className="hp-cta-strip" aria-label="Get started">
            <div className="hp-cta-strip__inner">
              <div className="hp-cta-strip__copy">
                <h2 className="hp-cta-strip__title">Ready to build something?</h2>
                <p className="hp-cta-strip__sub">
                  No coding experience needed. No software to install. Free to start.
                </p>
              </div>
              <Link
                to={user ? '/builder' : '/register'}
                className="hp-btn hp-btn--primary"
              >
                {user ? 'Open Builder' : 'Start for free'}
              </Link>
            </div>
          </section>

        </main>

        {/* ════════════════════════════════════════════════════
            FOOTER
        ════════════════════════════════════════════════════ */}
        <footer className="hp-footer">
          <div className="hp-footer__main">
            <div className="hp-footer__main-inner">

              <div className="hp-footer__brand">
                <span className="hp-footer__wordmark">
                  Code<span className="hp-footer__wordmark-accent">It</span>
                </span>
                <p className="hp-footer__tagline">
                  AI-powered coding for kids and beginners.
                </p>
              </div>

              <div className="hp-footer__col">
                <p className="hp-footer__col-heading">Product</p>
                <Link to="/builder"   className="hp-footer__col-link">Build with AI</Link>
                <Link to="/lessons"   className="hp-footer__col-link">Lessons</Link>
                <Link to="/character" className="hp-footer__col-link">Avatar</Link>
                <Link to="/MainPage"  className="hp-footer__col-link">Progress</Link>
              </div>

              <div className="hp-footer__col">
                <p className="hp-footer__col-heading">Company</p>
                <Link to="/"               className="hp-footer__col-link">How it works</Link>
                <Link to="/blog"            className="hp-footer__col-link">Blog</Link>
                <Link to="/coding-for-kids" className="hp-footer__col-link">Who we are</Link>
              </div>

              <div className="hp-footer__col">
                <p className="hp-footer__col-heading">Support</p>
                <a href="mailto:hello@codeitlearn.com" className="hp-footer__col-link">Contact</a>
                <Link to="/privacy" className="hp-footer__col-link">Privacy</Link>
                <Link to="/terms"   className="hp-footer__col-link">Terms</Link>
              </div>

            </div>
          </div>

          <div className="hp-footer__lesson-zone">
            <div className="hp-footer__lesson-zone-inner">
              <p className="hp-footer__lesson-heading">Learn Python for Kids — Free Lessons</p>
              <ul className="hp-footer__lesson-list">
                {LESSON_TITLES.slice(1).map((title, idx) => (
                  <li key={idx + 1}>
                    <Link to={`/lesson/${idx + 1}`} className="hp-footer__lesson-link">
                      Lesson {idx + 1}: {title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="hp-footer__bottom">
            <span>&copy; {new Date().getFullYear()} CodeIt. All rights reserved.</span>
          </div>
        </footer>

      </div>
    </>
  );
}
