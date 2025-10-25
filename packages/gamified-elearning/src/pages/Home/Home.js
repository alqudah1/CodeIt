import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Home.css";

export default function Home() {
  const [lesson, setLesson] = useState(0);
  const [quiz, setQuiz] = useState(0);
  const [game, setGame] = useState(0);
  const [sparkles, setSparkles] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Fetch progress data from backend
  const fetchProgressData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/rewards/progress-percentages', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setLesson(data.progress.lesson);
          setQuiz(data.progress.quiz);
          setGame(data.progress.game);
          console.log('Progress data fetched:', data.progress);
        }
      } else {
        console.error('Failed to fetch progress data. Status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgressData();
  }, [user]);

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
  const goToGame = () => navigate("/game/1");
  const goToDashboard = () => navigate("/MainPage");

  const bumpLesson = () => {
    setLoading(true);
    fetchProgressData();
  };
  const bumpQuiz = () => {
    setLoading(true);
    fetchProgressData();
  };
  const bumpGame = () => {
    setLoading(true);
    fetchProgressData();
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
          <Link to="/game/1">Puzzles</Link>
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
              Dive into sunny lessons, beachy quizzes, and adventurous Puzzles that
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
                <strong>{loading ? '...' : `${lesson}%`}</strong> Lesson mastery
              </span>
              <span className="metric-chip">
                <strong>{loading ? '...' : `${quiz}%`}</strong> Quiz accuracy
              </span>
              <span className="metric-chip">
                <strong>{loading ? '...' : `${game}%`}</strong> Puzzles streak
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
                <h3>Playful Puzzles</h3>
                <p>Unlock new levels and build creations in colorful worlds.</p>
              </div>
            </button>
          </div>

          <div className="progress-panel">
            <article className="card">
              <header className="card-header">
                <span>Lesson Progress</span>
                <span>{loading ? '...' : `${lesson}%`}</span>
              </header>
              <ProgressBar value={lesson} color="lesson" loading={loading} />
              <button type="button" className="card-link" onClick={bumpLesson}>
                {loading ? 'Loading...' : 'Refresh Progress ☀️'}
              </button>
            </article>

            <article className="card">
              <header className="card-header">
                <span>Quiz Progress</span>
                <span>{loading ? '...' : `${quiz}%`}</span>
              </header>
              <ProgressBar value={quiz} color="quiz" loading={loading} />
              <button type="button" className="card-link" onClick={bumpQuiz}>
                {loading ? 'Loading...' : 'Refresh Progress 🍍'}
              </button>
            </article>

            <article className="card">
              <header className="card-header">
                <span>Puzzles Progress</span>
                <span>{loading ? '...' : `${game}%`}</span>
              </header>
              <ProgressBar value={game} color="game" loading={loading} />
              <button type="button" className="card-link" onClick={bumpGame}>
                {loading ? 'Loading...' : 'Refresh Progress 🍧'}
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