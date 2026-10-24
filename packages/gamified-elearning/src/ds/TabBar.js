// ── The four tabs ───────────────────────────────────────────────────────────
//
// Home, Build, Arcade, Me. On a phone it is the bar at the bottom; on a wide
// screen the site header does the job and this hides itself. Only the pages
// of the new design show it, so the older pages are untouched.
//
// A signed-in adult gets their own four. A teacher on a phone at the front of
// the room was shown a child's Home and Arcade, and no way to the class.

import { useContext } from 'react';
import * as RR from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './ds.css';
import './TabBar.css';

const TABS = [
  { to: '/home', label: 'Home', icon: <path d="M3 11.5 12 4l9 7.5V20H3z" /> },
  { to: '/build', label: 'Build', icon: <path d="m14.5 6.5 3 3L8 19H5v-3zM17.5 3.5l3 3-2 2-3-3z" /> },
  { to: '/arcade', label: 'Arcade', icon: <path d="M6 4h12v3a6 6 0 0 1-12 0zM9 20h6M12 13v7M4 6h2M18 6h2" /> },
  { to: '/profile', label: 'Me', icon: <><circle cx="12" cy="9" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></> },
];

export const ADULT_TABS = [
  { to: '/teach', label: 'Classes', icon: <><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></> },
  { to: '/parent', label: 'This week', icon: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4" /></> },
  TABS[1],
  TABS[3],
];

/** A child, a guest, or a managed profile gets the child's four; an adult gets theirs. */
export function tabsFor(user) {
  if (!user || user.managedProfile) return TABS;
  return String(user.role || '').toLowerCase() === 'student' ? TABS : ADULT_TABS;
}

export default function TabBar() {
  // Link rather than NavLink so the bar renders inside every page's tests,
  // which mock the router with Link alone; "active" is read from the path.
  const Link = RR.Link || ((props) => <a href={props.to} className={props.className}>{props.children}</a>);
  const here = typeof window !== 'undefined' ? window.location.pathname : '';
  const { user } = useContext(AuthContext) || {};
  return (
    <nav className="ci-tabs" aria-label="Main">
      {tabsFor(user).map((tab) => (
        <Link key={tab.to} to={tab.to} className={`ci-tab${here === tab.to || here.startsWith(tab.to + '/') ? ' is-on' : ''}`}>
          <svg viewBox="0 0 24 24" aria-hidden="true">{tab.icon}</svg>
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
