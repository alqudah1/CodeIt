import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { play } from './kit/sound';
import { haptic } from './kit/haptic';
import World from './World';
import './Arcade.css';

// ── The child's shell ────────────────────────────────────────────────────────
//
// One full-screen living app, no site header, four tabs always in reach of a
// thumb. The adult site (home, pricing, guides) stays outside it. This round:
// Learn is the world; Play, Explore and Me still open the existing screens
// until each is rebuilt inside the shell.

const TABS = [
  { id: 'learn', label: 'Learn', to: '/play', icon: <svg viewBox="0 0 22 22"><path d="M3 5h16v13H3z" fill="none" stroke="currentColor" strokeWidth="2.5" /><path d="M7 10h8M7 14h5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg> },
  { id: 'play', label: 'Play', to: '/builder?start=catch-stars', icon: <svg viewBox="0 0 22 22"><path d="M5 4l13 7-13 7z" fill="currentColor" /></svg> },
  { id: 'explore', label: 'Explore', to: '/explore', icon: <svg viewBox="0 0 22 22"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2.5" /><circle cx="11" cy="11" r="2.5" fill="currentColor" /></svg> },
  { id: 'me', label: 'Me', to: '/profile', icon: <svg viewBox="0 0 22 22"><circle cx="11" cy="7" r="4" fill="currentColor" /><path d="M3 20c0-4 4-7 8-7s8 3 8 7" fill="currentColor" /></svg> },
];

export default function Arcade() {
  const { user } = useContext(AuthContext) || {};
  const { pathname } = useLocation();
  return (
    <div className="arcade">
      <main className="arcade__stage">
        <World />
      </main>
      <nav className="arcade__tabs" aria-label="Arcade">
        {TABS.map((tab) => {
          const to = tab.id === 'me' && !user ? '/login' : tab.to;
          const on = tab.id === 'learn' && pathname.startsWith('/play');
          return (
            <Link key={tab.id} to={to} className={`arcade__tab${on ? ' is-on' : ''}`} aria-current={on ? 'page' : undefined} onPointerDown={() => { play('tap'); haptic('tap'); }}>
              {tab.icon}<span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
