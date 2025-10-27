import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useProgress } from "../../context/ProgressContext";
import CharacterSpotlight from "../../components/CharacterSpotlight/CharacterSpotlight";
import "./Home.css";

export default function Home() {
  const [sparkles, setSparkles] = useState([]);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { progress, refreshProgress, isLoading: progressLoading } = useProgress();

  const computePercent = (section) => {
    const entries = Object.values(progress?.[section] || {});
    if (!entries.length) {
      return 0;
    }
    const completed = entries.filter(Boolean).length;
    return Math.round((completed / entries.length) * 100);
  };

  const lessonPercent = computePercent("lessons");
  const quizPercent = computePercent("quizzes");
  const puzzlePercent = computePercent("puzzles");

  useEffect(() => {
    if (user) {
      refreshProgress();
    }
  }, [user, refreshProgress]);

  useEffect(() => {
    const id = setInterval(() => {
      setSparkles((prev) => [
        ...prev.slice(-12),
        { id: Date.now(), x: Math.random() * 100, y: Math.random() * 100 },
      ]);
    }, 2800);

    return () => clearInterval(id);
  }, []);

  const goToLesson = () => navigate("/lesson/1");
  const goToQuiz = () => navigate("/quiz/1");
  const goToPuzzle = () => navigate("/puzzles");
  const goToDashboard = () => navigate("/MainPage");

  const bumpLesson = () => {
    refreshProgress();
  };
  const bumpQuiz = () => {
    refreshProgress();
  };
  const bumpPuzzle = () => {
    refreshProgress();
  };

  function ProgressBar({ value, color, loading }) {
    return (
      <div className="progress-bar">
        <div 
          className={`progress-fill ${color}`} 
          style={{ width: `${loading ? 0 : value}%` }} 
        />
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Debug log to check user object
  useEffect(() => {
    console.log("User object:", user);
  }, [user]);

  return (
    <div className="homepage">
      {sparkles.map((s) => (
        <div
          key={s.id}
          className="sparkle"
          style={{ left: `${s.x}%`, top: `${s.y}%` }}
        >
          ✨
        </div>
      ))}

      <header className="header">
        <div className="logo-area">
          <img src="/logo192.png" alt="Logo" className="logo-img" />
          <span className="logo-text">CodeIt</span>
        </div>
        <nav className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/MainPage">Dashboard</Link>
          <Link to="/lesson/1">Lessons</Link>
          <Link to="/quiz/1">Quizzes</Link>
          <Link to="/puzzles">Puzzles</Link>
          <Link to="/character">Character Lab</Link>
        </nav>
        <div className="auth-links">
          {user ? (
            <>
              <span className="user-name">{user.name || user.email || "Unknown User"}</span>
              <Link to="#" onClick={handleLogout} className="logout-link">
                Logout
              </Link>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register" className="register-pill">
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="content">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Summer of code fun</p>
            <h2>
              {user && <span className="welcome-text">Welcome {user.name || user.email || "Guest"}! </span>}
              Sunshine, Snacks, and Supercharged Coding Skills
            </h2>
            <p>
              Dive into sunny lessons, beachy quizzes, and brainy puzzles that
              turn every coding session into a summer quest.
            </p>
            <div className="hero-actions">
              <button type="button" className="primary-action" onClick={goToLesson}>
                🏖️ Start Learning
              </button>
              <button type="button" className="secondary-action" onClick={goToDashboard}>
                🍉 Explore Dashboard
              </button>
            </div>
            <div className="hero-metrics">
              <span className="metric-chip">
                <strong>{progressLoading ? '...' : `${lessonPercent}%`}</strong> Lesson mastery
              </span>
              <span className="metric-chip">
                <strong>{progressLoading ? '...' : `${quizPercent}%`}</strong> Quiz accuracy
              </span>
              <span className="metric-chip">
                <strong>{progressLoading ? '...' : `${puzzlePercent}%`}</strong> Puzzle streak
              </span>
            </div>
          </div>
          <div className="hero-visual">
            <img src="/logo192.png" alt="CodeIt mascot" className="hero-illustration" />
            <div className="hero-badge">
              <span>☀️ 1,200 sunny achievements this week</span>
            </div>
          </div>
        </section>

        <CharacterSpotlight headline="Meet your sidekick" cta="Customize your buddy" />

        <section className="dashboard-grid">
          <div className="cta-panel">
            <button type="button" className="cta-card start" onClick={goToLesson}>
              <span className="cta-icon" aria-hidden="true">
                🏄
              </span>
              <div>
                <h3>Surf the Lessons</h3>
                <p>Ride the wave of new concepts with splashy mini projects.</p>
              </div>
            </button>

            <button type="button" className="cta-card quiz" onClick={goToQuiz}>
              <span className="cta-icon" aria-hidden="true">
                🌈
              </span>
              <div>
                <h3>Rainbow Quizzes</h3>
                <p>Beat the buzzer and collect juicy fruit badges for accuracy.</p>
              </div>
            </button>

            <button type="button" className="cta-card puzzles" onClick={goToPuzzle}>
              <span className="cta-icon" aria-hidden="true">
                🧩
              </span>
              <div>
                <h3>Brainy Puzzles</h3>
                <p>Unlock logic quests and discover patterns with every win.</p>
              </div>
            </button>
          </div>

          <div className="progress-panel">
            <article className="card">
              <header className="card-header">
                <span>Lesson Progress</span>
                <span>{progressLoading ? '...' : `${lessonPercent}%`}</span>
              </header>
              <ProgressBar value={lessonPercent} color="lesson" loading={progressLoading} />
              <button type="button" className="card-link" onClick={bumpLesson}>
                {progressLoading ? 'Loading...' : 'Refresh Progress ☀️'}
              </button>
            </article>

            <article className="card">
              <header className="card-header">
                <span>Quiz Progress</span>
                <span>{progressLoading ? '...' : `${quizPercent}%`}</span>
              </header>
              <ProgressBar value={quizPercent} color="quiz" loading={progressLoading} />
              <button type="button" className="card-link" onClick={bumpQuiz}>
                {progressLoading ? 'Loading...' : 'Refresh Progress 🍍'}
              </button>
            </article>

            <article className="card">
              <header className="card-header">
                <span>Puzzle Progress</span>
                <span>{progressLoading ? '...' : `${puzzlePercent}%`}</span>
              </header>
              <ProgressBar value={puzzlePercent} color="puzzle" loading={progressLoading} />
              <button type="button" className="card-link" onClick={bumpPuzzle}>
                {progressLoading ? 'Loading...' : 'Refresh Progress 🧊'}
              </button>
            </article>

            <button type="button" className="journey-btn" onClick={goToDashboard}>
              See the full summer roadmap
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}