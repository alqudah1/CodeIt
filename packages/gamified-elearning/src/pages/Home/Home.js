import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Home.css";

export default function Home() {
  const [lesson, setLesson] = useState(45);
  const [quiz, setQuiz] = useState(30);
  const [game, setGame] = useState(60);
  const [sparkles, setSparkles] = useState([]);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

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
  const goToQuiz = () => navigate("/quiz/2");
  const goToGame = () => navigate("/game/1");
  const goToDashboard = () => navigate("/MainPage");

  const bumpLesson = () => setLesson((value) => Math.min(100, value + 10));
  const bumpQuiz = () => setQuiz((value) => Math.min(100, value + 10));
  const bumpGame = () => setGame((value) => Math.min(100, value + 10));

  function ProgressBar({ value, color }) {
    return (
      <div className="progress-bar">
        <div className={`progress-fill ${color}`} style={{ width: `${value}%` }} />
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
          <Link to="/quiz/2">Quizzes</Link>
          <Link to="/game/1">Games</Link>
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
              Dive into sunny lessons, beachy quizzes, and adventurous games that
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
                <strong>{lesson}%</strong> Lesson mastery
              </span>
              <span className="metric-chip">
                <strong>{quiz}%</strong> Quiz accuracy
              </span>
              <span className="metric-chip">
                <strong>{game}%</strong> Game streak
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

            <button type="button" className="cta-card games" onClick={goToGame}>
              <span className="cta-icon" aria-hidden="true">
                🪁
              </span>
              <div>
                <h3>Playful Games</h3>
                <p>Unlock new levels and build creations in colorful worlds.</p>
              </div>
            </button>
          </div>

          <div className="progress-panel">
            <article className="card">
              <header className="card-header">
                <span>Lesson Progress</span>
                <span>{lesson}%</span>
              </header>
              <ProgressBar value={lesson} color="lesson" />
              <button type="button" className="card-link" onClick={bumpLesson}>
                Add a sunny 10% ☀️
              </button>
            </article>

            <article className="card">
              <header className="card-header">
                <span>Quiz Progress</span>
                <span>{quiz}%</span>
              </header>
              <ProgressBar value={quiz} color="quiz" />
              <button type="button" className="card-link" onClick={bumpQuiz}>
                Power up +10% 🍍
              </button>
            </article>

            <article className="card">
              <header className="card-header">
                <span>Game Progress</span>
                <span>{game}%</span>
              </header>
              <ProgressBar value={game} color="game" />
              <button type="button" className="card-link" onClick={bumpGame}>
                Boost the fun +10% 🍧
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