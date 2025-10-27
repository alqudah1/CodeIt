import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import './Header.css';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();           // clear AuthContext
    navigate('/login'); 
  };

  return (
    <header className="header">
      <div className="logo-area">
        <img src="/images/CodeItLogo.png" alt="Logo" className="logo-img" />
        <span className="logo-text">CodeIt</span>
      </div>

      <nav className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/MainPage">Dashboard</Link>
        <Link to="/lesson/1">Lessons</Link>
        <Link to="/quiz/1">Quizzes</Link>
        <Link to="/games">Puzzles</Link>
        <Link to="/character">Character Lab</Link>
        <Link to="/leaderboard">🏆 Leaderboard</Link>
      </nav>

      <div className="auth-links">
        {user ? (
          <>
            <span className="user-name">{user.name || user.email || "Unknown User"}</span>
            <button onClick={handleLogout} className="logout-link">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="login-link">Login</Link>
            <Link to="/register" className="register-pill">Get Started</Link>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
