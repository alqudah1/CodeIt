import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../Header/Header';
import './Home.css';

/* ── Floating tag pill data ─────────────────────────────────────── */
const FLOAT_TAGS = [
  { label: 'Python',   color: '#FF7A00', bg: 'rgba(255,122,0,0.12)',    x: 62, y: 12, delay: 0     },
  { label: 'Games',    color: '#1F2937', bg: 'rgba(184,242,208,0.55)',  x: 75, y: 38, delay: 0.6   },
  { label: 'AI',       color: '#fff',    bg: '#FF7A00',                  x: 55, y: 65, delay: 1.1   },
  { label: 'Websites', color: '#1F2937', bg: 'rgba(255,142,110,0.22)',  x: 80, y: 70, delay: 0.3   },
  { label: 'Fun',      color: '#FF7A00', bg: 'rgba(255,122,0,0.09)',    x: 88, y: 20, delay: 0.9   },
  { label: 'XP',       color: '#fff',    bg: '#1F2937',                  x: 68, y: 82, delay: 1.5   },
];

/* ── Project wall card data ─────────────────────────────────────── */
const PROJECTS = [
  { title: 'Soccer Click Game',   creator: 'Amir K.',   color: '#FF7A00', icon: '⚽' },
  { title: 'Pizza Shop Website',  creator: 'Sara M.',   color: '#FF8E6E', icon: '🍕' },
  { title: 'Cat Quiz',            creator: 'Lena R.',   color: '#B8F2D0', icon: '🐱' },
  { title: 'Dino Runner',         creator: 'Tom B.',    color: '#FF7A00', icon: '🦕' },
  { title: 'Space Calculator',    creator: 'Mia P.',    color: '#FF8E6E', icon: '🚀' },
  { title: 'Rainbow Painter',     creator: 'Jake S.',   color: '#B8F2D0', icon: '🎨' },
  { title: 'Word Scramble',       creator: 'Priya N.',  color: '#FF7A00', icon: '🔤' },
  { title: 'Number Guesser',      creator: 'Leo D.',    color: '#FF8E6E', icon: '🎯' },
];

/* ── Draggable floating tag ─────────────────────────────────────── */
const FloatTag = ({ label, color, bg, x, y, delay }) => {
  const ref = useRef(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const start = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });

  const onPointerDown = (e) => {
    e.preventDefault();
    dragging.current = true;
    start.current = { mx: e.clientX, my: e.clientY, ox: pos.x, oy: pos.y };
    ref.current?.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!dragging.current) return;
    setPos({
      x: start.current.ox + e.clientX - start.current.mx,
      y: start.current.oy + e.clientY - start.current.my,
    });
  };
  const onPointerUp = () => { dragging.current = false; };

  return (
    <div
      ref={ref}
      className="hp-float-tag"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        background: bg,
        color,
        animationDelay: `${delay}s`,
        cursor: dragging.current ? 'grabbing' : 'grab',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {label}
    </div>
  );
};

/* ── Auto-scrolling project wall ────────────────────────────────── */
const ProjectWall = () => {
  const trackRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame;
    let pos = 0;
    const speed = 0.6;
    const step = () => {
      pos -= speed;
      const half = track.scrollWidth / 2;
      if (Math.abs(pos) >= half) pos = 0;
      track.style.transform = `translateX(${pos}px)`;
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);

    const pause = () => cancelAnimationFrame(frame);
    const resume = () => { frame = requestAnimationFrame(step); };
    track.addEventListener('mouseenter', pause);
    track.addEventListener('mouseleave', resume);
    return () => {
      cancelAnimationFrame(frame);
      track.removeEventListener('mouseenter', pause);
      track.removeEventListener('mouseleave', resume);
    };
  }, []);

  const doubled = [...PROJECTS, ...PROJECTS];

  return (
    <div className="hp-wall__overflow">
      <div className="hp-wall__track" ref={trackRef}>
        {doubled.map((p, i) => (
          <div key={i} className="hp-project-card" style={{ '--accent': p.color }}>
            <div className="hp-project-card__thumb" style={{ background: `linear-gradient(135deg, ${p.color}22, ${p.color}55)` }}>
              <span className="hp-project-card__icon">{p.icon}</span>
            </div>
            <div className="hp-project-card__info">
              <p className="hp-project-card__title">{p.title}</p>
              <p className="hp-project-card__creator">by {p.creator}</p>
            </div>
            <button
              className="hp-project-card__play"
              style={{ background: p.color }}
              onClick={() => navigate('/journey')}
              aria-label={`Play ${p.title}`}
            >
              Play
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Main page ──────────────────────────────────────────────────── */
export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <>
      <Header />
      <div className="hp">

        {/* ── HERO ──────────────────────────────────────────────── */}
        <section className="hp-hero">
          {/* Ambient glows */}
          <div className="hp-hero__glow hp-hero__glow--a" />
          <div className="hp-hero__glow hp-hero__glow--b" />

          <div className="hp-hero__inner">

            {/* LEFT — copy */}
            <div className="hp-hero__copy">
              <div className="hp-hero__eyebrow">Creative coding for kids</div>
              <h1 className="hp-hero__h1">
                Build with AI.<br />
                <span className="hp-hero__h1-accent">Learn by creating.</span>
              </h1>
              <p className="hp-hero__sub">
                Kids build games, websites, and creative projects — then learn the code behind what they made.
              </p>
              <div className="hp-hero__btns">
                <button
                  className="hp-btn hp-btn--primary"
                  onClick={() => navigate(user ? '/journey' : '/register')}
                >
                  Start Building
                </button>
                <button
                  className="hp-btn hp-btn--ghost"
                  onClick={() => navigate('/playground')}
                >
                  Explore Playground
                </button>
              </div>
            </div>

            {/* RIGHT — interactive playground preview */}
            <div className="hp-hero__playground">
              {/* Code editor mockup */}
              <div className="hp-code-preview">
                <div className="hp-code-preview__bar">
                  <span className="hp-dot hp-dot--red" />
                  <span className="hp-dot hp-dot--yellow" />
                  <span className="hp-dot hp-dot--green" />
                  <span className="hp-code-preview__label">my_game.py</span>
                </div>
                <div className="hp-code-preview__body">
                  <div className="hp-code-line"><span className="c-kw">for</span> <span className="c-id">i</span> <span className="c-kw">in</span> <span className="c-fn">range</span><span className="c-op">(</span><span className="c-num">10</span><span className="c-op">):</span></div>
                  <div className="hp-code-line hp-code-line--indent"><span className="c-fn">print</span><span className="c-op">(</span><span className="c-str">"You scored!"</span><span className="c-op">)</span></div>
                  <div className="hp-code-line"><span className="c-cm"># Change the number above</span></div>
                  <div className="hp-code-line"><span className="c-cm"># and see what happens!</span></div>
                  <div className="hp-code-preview__cursor" />
                </div>
                <div className="hp-code-preview__output">
                  <span className="hp-code-preview__output-label">Output</span>
                  <span className="hp-code-preview__output-text">You scored! x10</span>
                </div>
              </div>

              {/* Floating draggable tags */}
              {FLOAT_TAGS.map(tag => (
                <FloatTag key={tag.label} {...tag} />
              ))}

              {/* Floating achievement badge */}
              <div className="hp-hero__badge">
                <span className="hp-hero__badge-icon">+50 XP</span>
                <span>Loop complete!</span>
              </div>
            </div>

          </div>
        </section>

        {/* ── PROJECT WALL ──────────────────────────────────────── */}
        <section className="hp-section hp-section--wall">
          <div className="hp-section__head">
            <h2 className="hp-section__title">What kids are building</h2>
            <button className="hp-section__link" onClick={() => navigate('/journey')}>
              See all projects
            </button>
          </div>
          <ProjectWall />
        </section>

        {/* ── HOW IT WORKS ──────────────────────────────────────── */}
        <section className="hp-section hp-section--how">
          <div className="hp-section__inner">
            <h2 className="hp-section__title hp-section__title--center">
              Build. Play. Edit. Improve.
            </h2>
            <p className="hp-section__sub hp-section__sub--center">
              Every project teaches real code. Every lesson unlocks a new creation.
            </p>
            <div className="hp-steps">
              {[
                { num: '01', title: 'Pick a project', sub: 'Soccer game, quiz, website — your choice.', color: '#FF7A00' },
                { num: '02', title: 'Build it with AI', sub: 'AI builds the starter. You customize everything.', color: '#FF8E6E' },
                { num: '03', title: 'Learn the code', sub: 'See exactly which Python concepts you just used.', color: '#B8F2D0' },
                { num: '04', title: 'Level up your avatar', sub: 'Earn XP, unlock outfits, climb the leaderboard.', color: '#FF7A00' },
              ].map(({ num, title, sub, color }) => (
                <div key={num} className="hp-step" style={{ '--step-color': color }}>
                  <div className="hp-step__num" style={{ color, borderColor: color }}>{num}</div>
                  <h3 className="hp-step__title">{title}</h3>
                  <p className="hp-step__sub">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── AVATAR CTA ────────────────────────────────────────── */}
        <section className="hp-section hp-section--avatar">
          <div className="hp-avatar-cta">
            <div className="hp-avatar-cta__orb" />
            <div className="hp-avatar-cta__copy">
              <h2 className="hp-avatar-cta__title">
                Your avatar grows with you
              </h2>
              <p className="hp-avatar-cta__sub">
                Build projects. Earn XP. Unlock astronaut suits, robot parts, and more. Your avatar is your identity on CodeIt.
              </p>
              <button
                className="hp-btn hp-btn--primary"
                onClick={() => navigate(user ? '/character' : '/register')}
              >
                {user ? 'Customize Avatar' : 'Create Your Avatar'}
              </button>
            </div>
          </div>
        </section>

        {/* ── FOOTER ────────────────────────────────────────────── */}
        <footer className="hp-footer">
          <div className="hp-footer__inner">
            <div className="hp-footer__brand">
              <img src="/brand/CodeItRG.svg" alt="CodeIt" className="hp-footer__logo" />
              <p className="hp-footer__tagline">A creative internet playground for kids.</p>
            </div>
            <nav className="hp-footer__links" aria-label="Footer navigation">
              <a href="/lessons" className="hp-footer__link">Lessons</a>
              <a href="/journey" className="hp-footer__link">Build</a>
              <a href="/playground" className="hp-footer__link">Playground</a>
              <a href="/leaderboard" className="hp-footer__link">Leaderboard</a>
              <a href="/character" className="hp-footer__link">Avatar</a>
            </nav>
            <p className="hp-footer__copy">&copy; {new Date().getFullYear()} CodeIt. Made with creativity.</p>
          </div>
        </footer>

      </div>
    </>
  );
}
