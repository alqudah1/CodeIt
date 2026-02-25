import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { ENDPOINTS } from '../../config/api';
import { games as puzzleCatalog } from '../Games/gameCatalog';
import Header from '../Header/Header';
import './MainPage.css';

const TOTAL = 10;
const allIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const MainPage = () => {
  const navigate = useNavigate();
  const { user, logout, loading } = useContext(AuthContext);

  // Completion counts derived from progress percentages
  const [completedLessons, setCompletedLessons] = useState(null);
  const [completedQuizzes, setCompletedQuizzes] = useState(null);
  const [completedPuzzles, setCompletedPuzzles] = useState(null);
  const [progressLoading, setProgressLoading] = useState(true);

  useEffect(() => {
    console.log('MainPage useEffect - user:', user, 'loading:', loading);
    if (!loading && (!user || !user.name)) {
      console.log('Redirecting to login due to invalid or no user');
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchProgress = async () => {
      try {
        const token = localStorage.getItem('token') || '';
        const res = await fetch(ENDPOINTS.rewards.progress, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.success) {
          // pct = round((count / TOTAL) * 100)  →  count = round(pct / 10)
          setCompletedLessons(Math.round((data.progress.lesson || 0) / 10));
          setCompletedQuizzes(Math.round((data.progress.quiz   || 0) / 10));
          setCompletedPuzzles(Math.round((data.progress.game   || 0) / 10));
        }
      } catch (_) {
        /* silently ignore — counts will show as null */
      } finally {
        setProgressLoading(false);
      }
    };
    fetchProgress();
  }, [user]);

  const navigateToLesson = (num) => navigate(`/lesson/${num}`);
  const navigateToQuiz   = (num) => navigate(`/quiz/${num}`);
  const navigateToGame   = (num) => navigate(`/game/${num}`);
  const navigateToLogin  = () => navigate('/login');
  const navigateToRegister = () => navigate('/register');

  if (loading) return <div>Loading...</div>;
  if (!user || !user.name) return <div>Please log in to access the dashboard.</div>;

  const countLabel = (done, total) => {
    if (done === null) return `${total}`;
    return `${done}/${total}`;
  };

  return (
    <div className="main-page">
      <Header
        user={user}
        logout={logout}
        navigateToLogin={navigateToLogin}
        navigateToRegister={navigateToRegister}
      />
      <main className="main-content">
        <section className="overview-card">
          <h2>Keep the sunshine streak going</h2>
          <p>
            Dive into lessons, quizzes, or Puzzles to unlock fresh badges and keep your skills glowing brighter
            every day.
          </p>
          <div className="overview-stats">
            <div className="stat-chip stat-chip--lessons">
              <small>📘 Lessons</small>
              <strong>{progressLoading ? '…' : countLabel(completedLessons, TOTAL)}</strong>
              {!progressLoading && completedLessons !== null && (
                <div className="stat-chip__bar">
                  <div
                    className="stat-chip__bar-fill stat-chip__bar-fill--lessons"
                    style={{ width: `${(completedLessons / TOTAL) * 100}%` }}
                  />
                </div>
              )}
            </div>
            <div className="stat-chip stat-chip--quizzes">
              <small>⚡ Quizzes</small>
              <strong>{progressLoading ? '…' : countLabel(completedQuizzes, TOTAL)}</strong>
              {!progressLoading && completedQuizzes !== null && (
                <div className="stat-chip__bar">
                  <div
                    className="stat-chip__bar-fill stat-chip__bar-fill--quizzes"
                    style={{ width: `${(completedQuizzes / TOTAL) * 100}%` }}
                  />
                </div>
              )}
            </div>
            <div className="stat-chip stat-chip--puzzles">
              <small>🎮 Puzzles</small>
              <strong>{progressLoading ? '…' : countLabel(completedPuzzles, TOTAL)}</strong>
              {!progressLoading && completedPuzzles !== null && (
                <div className="stat-chip__bar">
                  <div
                    className="stat-chip__bar-fill stat-chip__bar-fill--puzzles"
                    style={{ width: `${(completedPuzzles / TOTAL) * 100}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="tracks-grid">
          {/* Lessons */}
          <article className="track-card lessons">
            <header className="track-header">
              <span className="track-icon lessons">📘</span>
              <div>
                <h2>
                  Lessons
                  <span className="track-total-badge">{TOTAL} total</span>
                </h2>
                <p>Surf through step-by-step adventures that build real coding powers.</p>
              </div>
            </header>
            <div className="track-buttons">
              {allIds.map((num) => (
                <button
                  type="button"
                  key={`lesson-${num}`}
                  className="track-button"
                  onClick={() => navigateToLesson(num)}
                >
                  Lesson {num}
                </button>
              ))}
            </div>
          </article>

          {/* Quizzes */}
          <article className="track-card quizzes">
            <header className="track-header">
              <span className="track-icon quizzes">⚡</span>
              <div>
                <h2>
                  Quizzes
                  <span className="track-total-badge">{TOTAL} total</span>
                </h2>
                <p>Race the clock, test your knowledge, and earn fruity power-ups.</p>
              </div>
            </header>
            <div className="track-buttons">
              {allIds.map((num) => (
                <button
                  type="button"
                  key={`quiz-${num}`}
                  className="track-button"
                  onClick={() => navigateToQuiz(num)}
                >
                  Quiz {num}
                </button>
              ))}
            </div>
          </article>

          {/* Puzzles */}
          <article className="track-card games">
            <header className="track-header">
              <span className="track-icon games">🎮</span>
              <div>
                <h2>
                  Puzzles
                  <span className="track-total-badge">{TOTAL} total</span>
                </h2>
                <p>Play story-driven missions that turn code into colorful worlds.</p>
              </div>
            </header>
            <div className="track-buttons">
              {puzzleCatalog.map((puzzle) => (
                <button
                  type="button"
                  key={`game-${puzzle.id}`}
                  className={`track-button${puzzle.comingSoon ? ' track-button--soon' : ''}`}
                  onClick={() => navigateToGame(Number(puzzle.id))}
                  title={puzzle.comingSoon ? 'Coming Soon' : puzzle.title}
                >
                  <span className="track-button__emoji">{puzzle.heroEmoji}</span>
                  <span className="track-button__label">{puzzle.title}</span>
                </button>
              ))}
            </div>
          </article>
        </section>
      </main>

      <footer className="main-footer">
        © 2025 <strong>CodeIt</strong>. All rights reserved. | Follow us on
        <a href="#" target="_blank" rel="noopener noreferrer"> Instagram</a> |
        <a href="#" target="_blank" rel="noopener noreferrer"> Twitter</a> |
        <a href="#" target="_blank" rel="noopener noreferrer"> YouTube</a>
      </footer>
    </div>
  );
};

export default MainPage;
