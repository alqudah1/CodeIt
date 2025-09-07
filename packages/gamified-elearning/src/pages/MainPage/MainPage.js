import React from 'react';
import './MainPage.css';
import { useNavigate } from 'react-router-dom';

const MainPage = () => {
  const navigate = useNavigate();

  const navigateToLesson = (num) => navigate(`/lesson/${num}`);
  //const navigateToQuiz = (num) => navigate(`/quiz/${num}`);
  const navigateToQuiz = (num) => {
    const quizIdMap = {
      1: 2, // Quiz 1 -> quiz_id 2
      2: 3, // Quiz 2 -> quiz_id 3
      3: 4, // Quiz 3 -> quiz_id 4
      4: 5, // Quiz 4 -> quiz_id 5
      5: 6, // Quiz 5 -> quiz_id 6
    };
    navigate(`/quiz/${quizIdMap[num]}`);
  };
  const navigateToGame = (num) => navigate(`/game/${num}`);
  const navigateHome = () => navigate('/'); 

  return (
    <div
      className="main-page"
      style={{ backgroundImage: "url('/images/MainBackGround.png')" }}
    >
      <div className="main-header">
        <div className="header-left">
          <img src="/images/CodeItLogo.png" alt="CodeIt Logo" className="top-logo" />
        </div>
        <div className="header-center">
          <button className="floating-home-button" onClick={navigateHome}>🏠 Home</button>
        </div>
      </div>
      <h1 className="main-title">Choose Your Adventure!</h1>

      <div className="section-container">
        <div className="section-card lessons-card">
          <h2>📘 Lessons</h2>
          <p className="tagline">Start Learning</p>
          {[1, 2, 3, 4, 5].map(num => (
            <button 
              key={`lesson-${num}`}
              onClick={() => navigateToLesson(num)}
              className="lesson-btn"
            >
              Lesson {num}
            </button>
          ))}
        </div>

        <div className="section-card quizzes-card">
          <h2>💡 Quizzes</h2>
          <p className="tagline">Test Your Brain!</p>
          {[1, 2, 3, 4, 5].map(num => (
            <button
              key={`quiz-${num}`}
              onClick={() => navigateToQuiz(num)}
              className="quiz-btn"
            >
              Quiz {num}
            </button>
          ))}
        </div>

        <div className="section-card games-card">
          <h2>🎮 Games</h2>
          <p className="tagline">Time to Play!</p>
          {[1, 2, 3, 4, 5].map(num => (
            <button
              key={`game-${num}`}
              onClick={() => navigateToGame(num)}
              className="game-btn"
            >
              Game {num}
            </button>
          ))}
        </div>
      </div>

      <footer className="footer">
        © 2025 <strong>CodeIt</strong>. All rights reserved. | Follow us on
        <a href="#" target="_blank" rel="noopener noreferrer"> Instagram</a> |
        <a href="#" target="_blank" rel="noopener noreferrer"> Twitter</a> |
        <a href="#" target="_blank" rel="noopener noreferrer"> YouTube</a>
      </footer>
    </div>
  );
};

export default MainPage;