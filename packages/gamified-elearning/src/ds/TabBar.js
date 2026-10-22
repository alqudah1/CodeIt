// ── The four tabs ───────────────────────────────────────────────────────────
//
// Home, Build, Arcade, Me. On a phone it is the bar at the bottom; on a wide
// screen the site header does the job and this hides itself. Only the pages
// of the new design show it, so the older pages are untouched.

import { NavLink } from 'react-router-dom';
import './TabBar.css';

const TABS = [
  { to: '/home', label: 'Home', icon: <path d="M3 11.5 12 4l9 7.5V20H3z" /> },
  { to: '/build', label: 'Build', icon: <path d="m14.5 6.5 3 3L8 19H5v-3zM17.5 3.5l3 3-2 2-3-3z" /> },
  { to: '/explore', label: 'Arcade', icon: <path d="M6 4h12v3a6 6 0 0 1-12 0zM9 20h6M12 13v7M4 6h2M18 6h2" /> },
  { to: '/profile', label: 'Me', icon: <><circle cx="12" cy="9" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></> },
];

export default function TabBar() {
  return (
    <nav className="ci-tabs" aria-label="Main">
      {TABS.map((tab) => (
        <NavLink key={tab.to} to={tab.to} className={({ isActive }) => `ci-tab${isActive ? ' is-on' : ''}`}>
          <svg viewBox="0 0 24 24" aria-hidden="true">{tab.icon}</svg>
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
