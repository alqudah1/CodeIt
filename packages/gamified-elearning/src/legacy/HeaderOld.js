import React, { useContext, useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import LeaderboardPreview from '../../components/LeaderboardPreview';
import './Header.css';

const NAV_LINKS = [
  { to: '/',           label: 'Home'          },
  { to: '/MainPage',   label: 'Dashboard'     },
  { to: '/lessons',    label: 'Lessons'       },
  { to: '/quiz/1',     label: 'Quizzes'       },
  { to: '/games',      label: 'Puzzles'       },
  { to: '/character',  label: 'Character Lab' },
  { to: '/leaderboard', label: 'Leaderboard'  },
];

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [lbOpen, setLbOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const lbRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (lbRef.current && !lbRef.current.contains(e.target)) setLbOpen(false);
    };
    if (lbOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [lbOpen]);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); setLbOpen(false); }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="site-header">
      <div className="site-header__inner">

        {/* Logo */}
        <Link to="/" className="site-header__logo">
          <img src="/images/CodeItLogo.png" alt="CodeIt logo" className="site-header__logo-img" />
          <span className="site-header__logo-text">CodeIt</span>
        </Link>

        {/* Hamburger (mobile) */}
        <button
          className={`site-header__burger${menuOpen ? ' is-open' : ''}`}
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle navigation"
        >
          <span /><span /><span />
        </button>

        {/* Nav + actions */}
        <div className={`site-header__body${menuOpen ? ' is-open' : ''}`}>
          <nav className="site-header__nav" aria-label="Main navigation">
            {NAV_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`site-header__nav-link${location.pathname === to ? ' is-active' : ''}`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Leaderboard quick-peek dropdown */}
          <div className="site-header__lb-wrap" ref={lbRef}>
            <button
              className="site-header__lb-trigger"
              onClick={() => setLbOpen((o) => !o)}
              aria-expanded={lbOpen}
              aria-haspopup="true"
            >
              🏆 <span className="site-header__lb-label">Top Coders</span>
              <span aria-hidden="true">{lbOpen ? '▴' : '▾'}</span>
            </button>
            {lbOpen && (
              <div className="site-header__lb-panel">
                <LeaderboardPreview />
              </div>
            )}
          </div>

          {/* Auth */}
          <div className="site-header__auth">
            {user ? (
              <>
                <span className="site-header__username">
                  {user.name || user.email || 'Coder'}
                </span>
                <button onClick={handleLogout} className="site-header__logout">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login"    className="site-header__login">Login</Link>
                <Link to="/register" className="site-header__cta">Get Started</Link>
              </>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};

export default Header;
