import React, { useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import Header from '../Header/Header'; 
import './MainPage.css';

const lessonIds = [1, 2, 3, 4, 5];

const MainPage = () => {
  const navigate = useNavigate();
  const { user, logout, loading } = useContext(AuthContext);

  useEffect(() => {
    console.log('MainPage useEffect - user:', user, 'loading:', loading);
    if (!loading && (!user || !user.name)) {
      console.log('Redirecting to login due to invalid or no user');
      navigate('/login');
    }
  }, [user, loading, navigate]);

  const navigateToLesson = (num) => navigate(`/lesson/${num}`);
  const navigateToQuiz = (num) => navigate(`/quiz/${num}`);
  const navigateToGame = (num) => navigate(`/game/${num}`);
  const navigateHome = () => navigate('/');
  const navigateToLogin = () => navigate('/login');
  const navigateToRegister = () => navigate('/register');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) return <div>Loading...</div>;
  if (!user || !user.name) return <div>Please log in to access the dashboard.</div>;

  return (
    <div className="main-page">
      <Header user={user} logout={logout} navigateToLogin={navigateToLogin} navigateToRegister={navigateToRegister} />
      <main className="main-content">
        <section className="overview-card">
          <h2>Keep the sunshine streak going</h2>
          <p>
            Dive into lessons, quizzes, or games to unlock fresh badges and keep your skills glowing brighter
            every day.
          </p>
          <div className="overview-stats">
            <span className="stat-chip">
              <strong>5</strong>
              <small>Active lessons</small>
            </span>
            <span className="stat-chip">
              <strong>12</strong>
              <small>Badges this week</small>
            </span>
            <span className="stat-chip">
              <strong>7</strong>
              <small>Day streak</small>
            </span>
          </div>
        </section>

        <section className="tracks-grid">
          <article className="track-card lessons">
            <header className="track-header">
              <span className="track-icon lessons">📘</span>
              <div>
                <h2>Lessons</h2>
                <p>Surf through step-by-step adventures that build real coding powers.</p>
              </div>
            </header>
            <div className="track-buttons">
              {lessonIds.map((num) => (
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

          <article className="track-card quizzes">
            <header className="track-header">
              <span className="track-icon quizzes">⚡</span>
              <div>
                <h2>Quizzes</h2>
                <p>Race the clock, test your knowledge, and earn fruity power-ups.</p>
              </div>
            </header>
            <div className="track-buttons">
              {lessonIds.map((num) => (
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

          <article className="track-card games">
            <header className="track-header">
              <span className="track-icon games">🎮</span>
              <div>
                <h2>Games</h2>
                <p>Play story-driven missions that turn code into colorful worlds.</p>
              </div>
            </header>
            <div className="track-buttons">
              {lessonIds.map((num) => (
                <button
                  type="button"
                  key={`game-${num}`}
                  className="track-button"
                  onClick={() => navigateToGame(num)}
                >
                  Game {num}
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