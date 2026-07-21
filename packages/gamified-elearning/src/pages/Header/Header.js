import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { useCharacter } from '../../context/CharacterContext';
import CharacterAvatar from '../../components/CharacterAvatar/CharacterAvatar';
import './Header.css';

const NAV_LINKS = [
  { to: '/builder',   label: 'Build with AI', primary: true },
  { to: '/explore',   label: 'Discover' },
  { to: '/lessons',   label: 'Lessons' },
  { to: '/character', label: 'Avatar' },
  { to: '/MainPage',  label: 'Progress' },
];

const XP_PER_LEVEL = 100;

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const { character, stats, pendingXP, clearPendingXP } = useCharacter();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);

  const level = stats?.totalXP >= 0 ? Math.floor(stats.totalXP / XP_PER_LEVEL) + 1 : null;

  useEffect(() => { setMenuOpen(false); setDropOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!dropOpen) return;
    const close = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [dropOpen]);

  const handleLogout = () => {
    setDropOpen(false);
    logout();
    navigate('/login');
  };

  const closeDrop = () => setDropOpen(false);

  return (
    <header className="site-header">
      <div className="site-header__inner">

        {/* Logo */}
        <Link to="/" className="site-header__logo" aria-label="CodeIt home">
          <img src="/brand/CodeItRG.svg" alt="CodeIt" className="site-header__logo-img" />
        </Link>

        {/* Hamburger (mobile) */}
        <button
          className={`site-header__burger${menuOpen ? ' is-open' : ''}`}
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          <span /><span /><span />
        </button>

        {/* Nav + right */}
        <div className={`site-header__body${menuOpen ? ' is-open' : ''}`}>

          <nav className="site-header__nav" aria-label="Main navigation">
            <ul className="site-header__nav-list" role="list">
              {NAV_LINKS.map(({ to, label, primary }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className={[
                      'site-header__nav-link',
                      location.pathname === to ? 'is-active'                      : '',
                      primary                  ? 'site-header__nav-link--primary' : '',
                    ].filter(Boolean).join(' ')}
                    aria-current={location.pathname === to ? 'page' : undefined}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="site-header__right">
            {user ? (
              <>
                <Link to="/builder" className="site-header__cta">Start Building</Link>

                {/* Avatar + XP popup */}
                <div className="site-header__user-menu" ref={dropRef}>

                  {/* XP gained popup */}
                  {pendingXP && (
                    <div
                      key={pendingXP.id}
                      className="site-header__xp-popup"
                      onAnimationEnd={clearPendingXP}
                      aria-live="polite"
                    >
                      +{pendingXP.amount} XP
                    </div>
                  )}

                  <button
                    className={`site-header__avatar-btn${level >= 5 ? ' site-header__avatar-btn--glow' : ''}`}
                    onClick={() => setDropOpen((o) => !o)}
                    aria-label="User menu"
                    aria-expanded={dropOpen}
                    aria-haspopup="true"
                  >
                    <span className="site-header__avatar-clip">
                      <CharacterAvatar character={character} size={44} compact />
                    </span>
                    {level !== null && (
                      <span className="site-header__level-badge" aria-label={`Level ${level}`}>
                        {level}
                      </span>
                    )}
                  </button>

                  {dropOpen && (
                    <div className="site-header__dropdown" role="menu">
                      <div className="site-header__dropdown-name">{user.name || 'My Account'}</div>

                      {stats && (
                        <div className="site-header__dropdown-xp">
                          <div className="site-header__dropdown-xp-row">
                            <span className="site-header__dropdown-xp-label">Level {level}</span>
                            <span className="site-header__dropdown-xp-total">{stats.totalXP} XP</span>
                          </div>
                          <div className="site-header__dropdown-xp-bar">
                            <div
                              className="site-header__dropdown-xp-fill"
                              style={{ width: `${(stats.totalXP % XP_PER_LEVEL) / XP_PER_LEVEL * 100}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <Link to="/profile"   className="site-header__dropdown-item" role="menuitem" onClick={closeDrop}>My Profile</Link>
                      <Link to="/builder"   className="site-header__dropdown-item" role="menuitem" onClick={closeDrop}>My Projects</Link>

                      <div className="site-header__dropdown-divider" />

                      <Link to="/blog"            className="site-header__dropdown-item" role="menuitem" onClick={closeDrop}>Blog</Link>
                      <Link to="/coding-for-kids" className="site-header__dropdown-item" role="menuitem" onClick={closeDrop}>Who we are</Link>

                      <div className="site-header__dropdown-divider" />

                      <button
                        className="site-header__dropdown-item site-header__dropdown-item--logout"
                        role="menuitem"
                        onClick={handleLogout}
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login"    className="site-header__login">Login</Link>
                <Link to="/register" className="site-header__cta">Start Building</Link>
              </>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

export default Header;
