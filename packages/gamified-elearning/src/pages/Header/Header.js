import React, { useContext, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { useCharacter } from "../../context/CharacterContext";
import CharacterAvatar from "../../components/CharacterAvatar/CharacterAvatar";
import BrandLogo from "../../components/BrandLogo/BrandLogo";
import Icon from "../../components/Icon/Icon";
import { DEFAULT_BILLING_STATE, fetchBillingStatus, isPlusMember } from "../../utils/billing";
import { trackEvent } from "../../utils/trackEvent";
import { getXpProgress } from "../../data/unlocks";
import "./Header.css";

// Nine controls used to sit in this header — logo, six nav links, the primary
// button and Log in — and a browser check found that on every page outside the
// studio, nine of the eleven-to-fourteen things competing for a child's first
// tap were these. No page can get under the bar while its header spends the
// whole budget before the page has rendered anything.
//
// "Studio" went first: it and the primary button beside it both went to
// /builder. Two controls, one destination, four positions apart — a child
// learns from that that the words are decoration.
//
// Playground went second, to the footer and the pages that already link it in
// a sentence, on the reasoning that it is a tool you go to on purpose.
//
// That was wrong, and production said so. The playground and lesson 1 are the
// two strongest things this site owns: both open with no account, both run
// real Python, and neither has any AI in it. They are the exact answer to the
// one objection a sceptical parent arrives with — "the computer will do it for
// them" — and a parent could reach neither from the top of any page. Google
// agrees about what we are: "python for kids free" is our best non-brand rank
// on the whole site at position 13, while the homepage argued we were an AI
// website builder.
//
// So Playground is back in the bar, and "Learn" became "Lessons". A parent
// scanning a nav knows what a lesson is; "Learn" could mean anything.
const PUBLIC_NAV = [
  { to: "/explore", label: "Explore" },
  { to: "/lessons", label: "Lessons" },
  { to: "/playground", label: "Playground" },
  { to: "/pricing", label: "Pricing" },
  { to: "/coding-for-kids", label: "For parents" },
];

// Listed in full rather than sliced from PUBLIC_NAV: the slice silently
// dropped Pricing, so signed-in parents had no way to reach the plan page.
//
// Four across the top, not eight. A signed-in child's header used to hold
// eight destinations plus a logo, a Studio button and an account menu: eleven
// controls, which on a 1280px laptop is the entire budget of ten spent before
// the page below it has rendered anything at all.
//
// Nothing is unreachable. The four that moved are all about this one child —
// their progress, their rank, their avatar, their plan — and the account menu
// they moved into is where a person looks for exactly that. The four that
// stayed are the four places to go and do something.
// Three verbs a child understands, matching what each place does: you PLAY
// other kids' games, you LEARN lessons, and the big key MAKEs your own.
const MEMBER_NAV = [
  { to: "/explore", label: "Play" },
  { to: "/lessons", label: "Lessons" },
];

// Reached from the account menu rather than the top bar. Nothing here became
// unreachable; it became reachable from the place a person looks for it.
const MEMBER_ACCOUNT_NAV = [
  { to: "/MainPage", label: "My progress" },
  { to: "/leaderboard", label: "Compete" },
  { to: "/character", label: "My avatar" },
  { to: "/playground", label: "Python playground" },
  { to: "/pricing", label: "Plan", adultsOnly: true },
];

// The level is data/unlocks.js's level. This file kept its own flat hundred
// per level, which disagreed with the unlock system at every threshold.

export default function Header() {
  const { user, token, logout } = useContext(AuthContext);
  const { character, stats, pendingXP, clearPendingXP } = useCharacter();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [billing, setBilling] = useState(DEFAULT_BILLING_STATE);
  const dropRef = useRef(null);

  // CodeIt does not sell to children, so a managed child profile never sees
  // the plan link. The page itself refuses them too; this just avoids
  // dangling a price in front of a nine-year-old.
  const navLinks = (user ? MEMBER_NAV : PUBLIC_NAV)
    .filter(link => !link.adultsOnly || !user?.managedProfile);

  // The first family to pay said it took too many buttons, and they were
  // right: from a signed-in adult's studio, the plan page was two taps behind
  // an avatar. This is one tap, and only for the person allowed to buy.
  const isAdultAccount = Boolean(user)
    && !user.managedProfile
    && String(user.role || "").toLowerCase() !== "student";
  const showGetPlus = isAdultAccount && billing.billingEnabled && !isPlusMember(billing);

  // Two controls with one destination is the mistake this header already made
  // once with Studio. When Get Plus is in the top bar, Plan leaves the menu;
  // when it is not, Plan is how a subscriber manages their billing.
  const accountLinks = (user ? MEMBER_ACCOUNT_NAV : [])
    .filter(link => !link.adultsOnly || !user?.managedProfile)
    .filter(link => !(showGetPlus && link.to === "/pricing"));
  const progress = stats?.totalXP >= 0 ? getXpProgress(stats.totalXP) : null;
  const level = progress ? progress.level : null;

  useEffect(() => {
    setMenuOpen(false);
    setDropOpen(false);
  }, [location.pathname]);

  // Asked once per mount, and only for an adult account. A failure is silent:
  // the header keeps the default free-plan state, which shows nothing new.
  useEffect(() => {
    if (!token || !isAdultAccount) return undefined;
    let cancelled = false;
    fetchBillingStatus(token)
      .then((state) => { if (!cancelled) setBilling(state); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [token, isAdultAccount]);

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

  // Once per mount, and only when the control is actually rendered. Without a
  // shown count, a click count is a number with no denominator: nobody could
  // tell a control nobody presses from a control nobody is offered.
  const plusShownRef = useRef(false);
  useEffect(() => {
    if (!showGetPlus || plusShownRef.current) return;
    plusShownRef.current = true;
    void trackEvent("upgrade_prompt_shown", "header", token);
  }, [showGetPlus, token]);

  const handleLogout = () => {
    setDropOpen(false);
    logout();
    navigate("/login");
  };

  // The skip link every audit looks for first. Pages own their <main>, so the
  // link finds the current page's main landmark at click time rather than
  // hard-coding an id into eighteen files.
  const skipToContent = (event) => {
    event.preventDefault();
    const main = document.querySelector('main') || document.querySelector('[role="main"]');
    if (!main) return;
    main.setAttribute('tabindex', '-1');
    main.focus({ preventScroll: false });
    main.scrollIntoView();
  };

  return (
    <header className="site-header">
      <a className="site-header__skip" href="#main" onClick={skipToContent}>
        Skip to content
      </a>
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
            {/* The nav item beside this one goes to the same place. Two labels
                for one destination taught a child that the words are decoration,
                so the button now says what it opens and the nav names it. */}
            {showGetPlus && (
              <Link
                to="/pricing#codeit-plus"
                className="site-header__plus"
                onClick={() => void trackEvent("upgrade_click", "header", token)}
              >
                Get Plus
              </Link>
            )}

            <Link to="/builder" className="site-header__cta">
              {user ? <><Icon name="game" size={18} /> Make something</> : "Start building"}
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
                          <div className="site-header__dropdown-xp-fill" style={{ width: `${progress ? progress.pct : 0}%` }} />
                        </div>
                      </div>
                    )}
                    <Link to="/profile" className="site-header__dropdown-item" role="menuitem">My profile</Link>
                    <Link to="/builder?view=projects" className="site-header__dropdown-item" role="menuitem">My projects</Link>
                    {accountLinks.map(({ to, label }) => (
                      <Link key={to} to={to} className="site-header__dropdown-item" role="menuitem">{label}</Link>
                    ))}
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
