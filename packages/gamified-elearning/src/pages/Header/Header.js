import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import './Header.css';

const NAV_LINKS = [
  { to: '/journey',   label: 'Build'       },
  { to: '/lessons',   label: 'Lessons'     },
  { to: '/playground', label: 'Playground' },
  { to: '/character', label: 'Avatar'      },
];

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <header className={`ci-header${scrolled ? ' ci-header--scrolled' : ''}`}>
      <div className="ci-header__inner">

        {/* Logo */}
        <Link to="/" className="ci-header__logo" aria-label="CodeIt home">
          <img
            src="/brand/CodeItRG.svg"
            alt="CodeIt"
            className="ci-header__logo-img"
          />
        </Link>

        {/* Hamburger */}
        <button
          className={`ci-header__burger${menuOpen ? ' is-open' : ''}`}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          <span /><span /><span />
        </button>

        {/* Nav body */}
        <div className={`ci-header__body${menuOpen ? ' is-open' : ''}`}>
          <nav className="ci-header__nav" aria-label="Main navigation">
            {NAV_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`ci-nav-link${location.pathname.startsWith(to) ? ' is-active' : ''}`}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="ci-header__actions">
            {user ? (
              <>
                <Link to="/character" className="ci-header__avatar-btn" aria-label="My avatar">
                  <span className="ci-header__avatar-dot" />
                  <span className="ci-header__username">
                    {user.name || user.email?.split('@')[0] || 'Coder'}
                  </span>
                </Link>
                <button onClick={handleLogout} className="ci-header__logout">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="ci-header__login">Log in</Link>
                <Link to="/register" className="ci-header__cta">
                  Start Building
                </Link>
              </>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};

export default Header;
