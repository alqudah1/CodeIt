import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ENDPOINTS } from "../config/api";
import Header from "../pages/Header/Header";
import LeaderboardPreview from "../components/LeaderboardPreview";
import CharacterSpotlight from "../components/CharacterSpotlight/CharacterSpotlight";
import "./HomeOld.css";

const LESSON_TITLES = [
  null,
  "Intro to Python",
  "Variables & Types",
  "Control Flow",
  "Functions",
  "Lists & Strings",
  "Dictionaries & Sets",
  "File Handling",
  "Exception Handling",
  "OOP Basics",
  "Modules & Libraries",
];

export default function Home() {
  const [lesson, setLesson] = useState(0);
  const [quiz, setQuiz] = useState(0);
  const [game, setGame] = useState(0);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [sparkles, setSparkles] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Derive next unlocked lesson
  const nextLesson = (() => {
    for (let i = 1; i <= 10; i++) {
      if (!completedLessons.includes(i)) return i;
    }
    return null;
  })();

  const fetchData = async () => {
    if (!user) { setLoading(false); return; }
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const [progressRes, lessonsRes] = await Promise.all([
        fetch(ENDPOINTS.rewards.progress, { headers }),
        fetch(ENDPOINTS.lessons.progress, { headers }),
      ]);
      if (progressRes.ok) {
        const data = await progressRes.json();
        if (data.success) {
          setLesson(data.progress.lesson || 0);
          setQuiz(data.progress.quiz || 0);
          setGame(data.progress.game || 0);
        }
      }
      if (lessonsRes.ok) {
        const data = await lessonsRes.json();
        if (data.success) setCompletedLessons(data.completedLessons || []);
      }
    } catch (e) {
      console.error('Home fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user]);

  useEffect(() => {
    const id = setInterval(() => {
      setSparkles((prev) => [
        ...prev.slice(-14),
        { id: Date.now(), x: Math.random() * 100, y: Math.random() * 100 },
      ]);
    }, 2600);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <Header />
      <div className="homepage">
        {sparkles.map((s) => (
          <div key={s.id} className="sparkle" style={{ left: `${s.x}%`, top: `${s.y}%` }}>✨</div>
        ))}

        <main className="hp-content">

          {/* ── HERO ────────────────────────────────────────── */}
          <section className="hp-hero">
            <div className="hp-hero__copy">
              <p className="hp-eyebrow">🚀 Your Python adventure starts here</p>
              <h1 className="hp-h1">
                {user
                  ? <><span className="hp-welcome">Hey {user.name || 'Coder'}!</span><br /></>
                  : null}
                Learn Python.<br />
                <span className="hp-h1-accent">Play. Compete. Level Up.</span>
              </h1>
              <p className="hp-sub">
                Interactive lessons, skill-testing quizzes, and coding puzzles — all in one
                colourful place built for young developers.
              </p>
              <div className="hp-actions">
                <button className="btn-glass btn-glass--primary" onClick={() => navigate('/lesson/1')}>
                  🏄 Start Learning
                </button>
                <button className="btn-glass btn-glass--secondary" onClick={() => navigate('/MainPage')}>
                  📊 My Dashboard
                </button>
              </div>
            </div>

            <div className="hp-hero__visual">
              <div className="hp-hero__glow" />
              <img src="/images/CodeItLogo.png" alt="CodeIt mascot" className="hp-hero__img" />
              <div className="hp-hero__badge">☀️ 1,200+ achievements this week</div>
            </div>
          </section>

          {/* ── STATS STRIP ─────────────────────────────────── */}
          <section className="hp-stats">
            {[
              { emoji: "📚", total: 10, label: "Lessons",  pct: lesson, cls: "lesson", nav: "/lessons"  },
              { emoji: "🎯", total: 10, label: "Quizzes",  pct: quiz,   cls: "quiz",   nav: "/quiz/1"  },
              { emoji: "🧩", total: 10, label: "Puzzles",  pct: game,   cls: "puzzle", nav: "/games"   },
            ].map(({ emoji, total, label, pct, cls, nav }) => (
              <button key={label} className={`hp-stat hp-stat--${cls}`} onClick={() => navigate(nav)}>
                <span className="hp-stat__emoji">{emoji}</span>
                <div className="hp-stat__info">
                  <span className="hp-stat__num">{total}</span>
                  <span className="hp-stat__label">{label}</span>
                </div>
                {user && (
                  <div className="hp-stat__right">
                    <span className="hp-stat__pct">{loading ? '…' : `${pct}%`}</span>
                    <div className="hp-stat__bar">
                      <div className={`hp-stat__fill hp-stat__fill--${cls}`} style={{ width: loading ? '0%' : `${pct}%` }} />
                    </div>
                  </div>
                )}
              </button>
            ))}
          </section>

          {/* ── FEATURE CARDS ───────────────────────────────── */}
          <section className="hp-features">
            {[
              { emoji: "🏄", title: "Lessons",       sub: "Interactive Python lessons with live code editors",  cls: "lesson",  nav: "/lessons"    },
              { emoji: "🌈", title: "Quizzes",        sub: "Test your knowledge and earn XP badges",             cls: "quiz",    nav: "/quiz/1"     },
              { emoji: "🧩", title: "Puzzles",        sub: "Solve coding challenges in fun game worlds",         cls: "puzzle",  nav: "/games"      },
              { emoji: "🎨", title: "Character Lab",  sub: "Customise your coding avatar",                       cls: "lab",     nav: "/character"  },
            ].map(({ emoji, title, sub, cls, nav }) => (
              <button key={title} className={`hp-feat hp-feat--${cls}`} onClick={() => navigate(nav)}>
                <span className="hp-feat__icon">{emoji}</span>
                <div className="hp-feat__text">
                  <h3 className="hp-feat__title">{title}</h3>
                  <p className="hp-feat__sub">{sub}</p>
                </div>
                <span className="hp-feat__arrow">→</span>
              </button>
            ))}
          </section>

          {/* ── LOWER GRID: Continue + Leaderboard ──────────── */}
          <section className="hp-lower">

            <div className="hp-lower__left">

              {/* Continue Learning */}
              {user && nextLesson && (
                <div className="hp-continue glass-card">
                  <span className="hp-continue__badge">📍 Continue Learning</span>
                  <h3 className="hp-continue__title">
                    Lesson {nextLesson}: {LESSON_TITLES[nextLesson]}
                  </h3>
                  <p className="hp-continue__sub">
                    {completedLessons.length} of 10 lessons completed · Keep the streak going!
                  </p>
                  <button
                    className="btn-glass btn-glass--primary"
                    onClick={() => navigate(`/lesson/${nextLesson}`)}
                  >
                    Resume Lesson →
                  </button>
                </div>
              )}

              {user && !nextLesson && !loading && (
                <div className="hp-continue glass-card">
                  <span className="hp-continue__badge">🏆 All Complete!</span>
                  <h3 className="hp-continue__title">You've finished all 10 lessons!</h3>
                  <p className="hp-continue__sub">Now master the quizzes and puzzles to top the leaderboard.</p>
                  <button className="btn-glass btn-glass--primary" onClick={() => navigate('/quiz/1')}>
                    Take a Quiz →
                  </button>
                </div>
              )}

              {!user && (
                <div className="hp-continue glass-card">
                  <span className="hp-continue__badge">🔓 Get Started Free</span>
                  <h3 className="hp-continue__title">Begin Your Python Journey</h3>
                  <p className="hp-continue__sub">
                    Create a free account to track progress, earn XP, and compete on the leaderboard.
                  </p>
                  <div className="hp-actions" style={{ marginTop: '1.2rem' }}>
                    <button className="btn-glass btn-glass--primary" onClick={() => navigate('/register')}>
                      🚀 Sign Up Free
                    </button>
                    <button className="btn-glass btn-glass--secondary" onClick={() => navigate('/login')}>
                      Login
                    </button>
                  </div>
                </div>
              )}

              {/* Progress stack */}
              <div className="hp-progress-stack">
                {[
                  { label: 'Lesson Progress',  value: lesson, cls: 'lesson', emoji: '📚', nav: '/lessons'  },
                  { label: 'Quiz Progress',    value: quiz,   cls: 'quiz',   emoji: '🎯', nav: '/quiz/1'  },
                  { label: 'Puzzle Progress',  value: game,   cls: 'puzzle', emoji: '🧩', nav: '/games'   },
                ].map(({ label, value, cls, emoji, nav }) => (
                  <article key={label} className="hp-prog-card glass-card">
                    <div className="hp-prog-card__header">
                      <span>{emoji} {label}</span>
                      <span className="hp-prog-card__pct">
                        {user ? (loading ? '…' : `${value}%`) : '—'}
                      </span>
                    </div>
                    <div className="hp-prog-bar">
                      <div
                        className={`hp-prog-fill hp-prog-fill--${cls}`}
                        style={{ width: user && !loading ? `${value}%` : '0%' }}
                      />
                    </div>
                    <button className="btn-glass btn-glass--sm" onClick={() => navigate(nav)}>
                      {label.split(' ')[0]}s →
                    </button>
                  </article>
                ))}
              </div>
            </div>

            <div className="hp-lower__right">
              <LeaderboardPreview />
            </div>
          </section>

          {/* ── CHARACTER SPOTLIGHT ─────────────────────────── */}
          <section className="hp-character">
            <CharacterSpotlight headline="Meet your sidekick" cta="Customise your buddy" />
          </section>

        </main>
      </div>
    </>
  );
}
