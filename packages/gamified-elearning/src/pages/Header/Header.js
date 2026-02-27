import React, { useContext, useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import LeaderboardPreview from '../../components/LeaderboardPreview';
import './Header.css';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [lbOpen, setLbOpen] = useState(false);
  const lbRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (lbRef.current && !lbRef.current.contains(e.target)) setLbOpen(false);
    };
    if (lbOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [lbOpen]);

  const handleLogout = () => {
    logout();
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
        <Link to="/lessons">Lessons</Link>
        <Link to="/quiz/1">Quizzes</Link>
        <Link to="/games">Puzzles</Link>
        <Link to="/character">Character Lab</Link>
      </nav>

      <div className="hdr-lb-wrap" ref={lbRef}>
        <button
          className="hdr-lb-trigger"
          onClick={() => setLbOpen((o) => !o)}
          aria-expanded={lbOpen}
          aria-haspopup="true"
        >
          🏆 <span className="hdr-lb-label">Top Coders</span>
          <span className="hdr-lb-caret" aria-hidden="true">{lbOpen ? '▴' : '▾'}</span>
        </button>
        {lbOpen && (
          <div className="hdr-lb-panel">
            <LeaderboardPreview />
          </div>
        )}
      </div>

      <div className="auth-links">
        {user ? (
          <>
            <span className="user-name">{user.name || user.email || 'Unknown User'}</span>
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
