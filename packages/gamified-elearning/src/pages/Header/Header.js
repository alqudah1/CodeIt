import React, { useContext, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { useCharacter } from "../../context/CharacterContext";
import CharacterAvatar from "../../components/CharacterAvatar/CharacterAvatar";
import BrandLogo from "../../components/BrandLogo/BrandLogo";
import "./Header.css";

const PUBLIC_NAV = [
  { to: "/builder", label: "Build", primary: true },
  { to: "/explore", label: "Explore" },
  { to: "/lessons", label: "Learn" },
  { to: "/playground", label: "Playground" },
  { to: "/pricing", label: "Pricing" },
  { to: "/coding-for-kids", label: "For parents" },
];

const MEMBER_NAV = [
  ...PUBLIC_NAV.slice(0, 4),
  { to: "/pricing", label: "Pricing" },
  { to: "/character", label: "Avatar" },
  { to: "/MainPage", label: "Progress" },
];

const XP_PER_LEVEL = 100;

export default function Header() {
  const { user, logout } = useContext(AuthContext);
  const { character, stats, pendingXP, clearPendingXP } = useCharacter();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);

  const navLinks = user ? MEMBER_NAV : PUBLIC_NAV;
  const level = stats?.totalXP >= 0 ? Math.floor(stats.totalXP / XP_PER_LEVEL) + 1 : null;

  useEffect(() => {
    setMenuOpen(false);
    setDropOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!dropOpen) return undefined;
    const close = (event) => {
      if (dropRef.current && !dropRef.current.contains(event.target)) setDropOpen(false);
    };
    const closeWithEscape = (event) => {
      if (event.key === "Escape") setDropOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, [dropOpen]);

  const handleLogout = () => {
    setDropOpen(false);
    logout();
    navigate("/login");
  };

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link to="/" className="site-header__logo" aria-label="CodeIt home">
          <BrandLogo className="site-header__brand" alt="" />
        </Link>

        <button
          type="button"
          className={`site-header__burger${menuOpen ? " is-open" : ""}`}
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-controls="site-navigation"
          aria-expanded={menuOpen}
        >
          <span /><span /><span />
        </button>

        <div id="site-navigation" className={`site-header__body${menuOpen ? " is-open" : ""}`}>
          <nav className="site-header__nav" aria-label="Main navigation">
            <ul className="site-header__nav-list">
              {navLinks.map(({ to, label, primary }) => {
                const active = location.pathname === to;
                return (
                  <li key={to}>
                    <Link
                      to={to}
                      className={[
                        "site-header__nav-link",
                        active ? "is-active" : "",
                        primary ? "site-header__nav-link--primary" : "",
                      ].filter(Boolean).join(" ")}
                      aria-current={active ? "page" : undefined}
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="site-header__right">
            <Link to="/builder" className="site-header__cta">
              {user ? "Open studio" : "Start a project"}
            </Link>

            {user ? (
              <div className="site-header__user-menu" ref={dropRef}>
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
                  type="button"
                  className={`site-header__avatar-btn${level >= 5 ? " site-header__avatar-btn--glow" : ""}`}
                  onClick={() => setDropOpen((open) => !open)}
                  aria-label="Open account menu"
                  aria-expanded={dropOpen}
                  aria-haspopup="menu"
                >
                  <span className="site-header__avatar-clip">
                    <CharacterAvatar character={character} size={44} compact />
                  </span>
                  {level !== null && <span className="site-header__level-badge">{level}</span>}
                </button>

                {dropOpen && (
                  <div className="site-header__dropdown" role="menu">
                    <div className="site-header__dropdown-name">{user.name || "My account"}</div>
                    {stats && (
                      <div className="site-header__dropdown-xp">
                        <div className="site-header__dropdown-xp-row">
                          <span className="site-header__dropdown-xp-label">Level {level}</span>
                          <span className="site-header__dropdown-xp-total">{stats.totalXP} XP</span>
                        </div>
                        <div className="site-header__dropdown-xp-bar">
                          <div className="site-header__dropdown-xp-fill" style={{ width: `${((stats.totalXP % XP_PER_LEVEL) / XP_PER_LEVEL) * 100}%` }} />
                        </div>
                      </div>
                    )}
                    <Link to="/profile" className="site-header__dropdown-item" role="menuitem">My profile</Link>
                    <Link to="/builder?view=projects" className="site-header__dropdown-item" role="menuitem">My projects</Link>
                    <div className="site-header__dropdown-divider" />
                    <Link to="/blog" className="site-header__dropdown-item" role="menuitem">Guides and ideas</Link>
                    <button
                      type="button"
                      className="site-header__dropdown-item site-header__dropdown-item--logout"
                      role="menuitem"
                      onClick={handleLogout}
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="site-header__login">Log in</Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
