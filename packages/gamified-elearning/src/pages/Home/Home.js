import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import ProgressBar from '../ProgressBar/progressBar';

const Home = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    //navigate('/MainPage');
    window.location.href = 'http://localhost:8080';
  };

  return (
    <div className="homepage">
      <div className="top-bar">
        <div className="logo-area">
          <img src="/images/CodeItLogo.png" alt="Logo" className="top-logo" />
          <span className="site-name">CodeIt</span>
        </div>
        <div className="nav-links">
          <a href="#">Home</a>
          <a href="#">About</a>
          <a href="#">Contact</a>
        </div>
      </div>

      <h1>Students of Today, Developers of Tomorrow</h1>

      <div className="content-wrapper">
        <div className="main-content">
          {/* Left Column: Buttons */}
          <div className="left-panel">
            <button className="fun-button">
              📖 Learn
            </button>
            <button className="fun-button">
              💡 Quiz
            </button>
            <button className="fun-button">
              🧩 Play
            </button>
          </div>

          {/* Center Column: Text + Progress */}
          <div className="intro-text">
          <ul className="fun-list">
  <li>🚀 Turn coding into an exciting adventure!</li>
  <li>🐍 Learn Python in a super fun way!</li>
  <li>🎮 Play games while mastering coding skills!</li>
  <li>🧩 Solve puzzles and challenges!</li>
  <li>🏆 Level up as you learn!</li>
</ul>
            <div className="progress-section">
              <ProgressBar label="Lesson Progress" progress={0} />
              <ProgressBar label="Quiz Progress" progress={0} />
              <ProgressBar label="Game Progress" progress={0} />
            </div>
            <button className="start-button" onClick={handleStart}> ✅ Start</button>
          </div>

          {/* Right Column: Logo */}
          <div className="logo-panel">
            <img src="/images/CodeItLogo.png" alt="CodeIt Logo" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;