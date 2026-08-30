import React, { useEffect, useState, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ENDPOINTS } from '../../config/api';
import { AuthContext } from '../../context/AuthContext';
import Header from '../Header/Header';
import { useSEO } from '../../hooks/useSEO';
import './Leaderboard.css';

const MEDALS = ['🥇', '🥈', '🥉'];

// Assign a consistent avatar colour based on the first character of a name
const AVATAR_COLOURS = [
  '#ff6b6b', '#ff9f43', '#ffd32a', '#1dd1a1',
  '#54a0ff', '#5f27cd', '#ff9ff3', '#48dbfb',
];
const avatarColour = (name) => {
  const code = (name || 'P').toUpperCase().charCodeAt(0);
  return AVATAR_COLOURS[code % AVATAR_COLOURS.length];
};

const Leaderboard = () => {
  useSEO({
    canonical:   '/leaderboard',
    robots:      'noindex,nofollow',
  });

  const [rows, setRows]       = useState([]);
  const [summary, setSummary] = useState({
    totalRanked: 0,
    currentRank: null,
    currentXp: 0,
    xpToNextRank: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const { user }              = useContext(AuthContext);
  const navigate              = useNavigate();

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(ENDPOINTS.rewards.leaderboard, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      });
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const data = await res.json();
      setRows(data.leaderboard || []);
      setSummary({
        totalRanked: Number(data.total_ranked) || 0,
        currentRank: Number(data.current_rank) || null,
        currentXp: Number(data.current_xp) || 0,
        xpToNextRank: Number(data.xp_to_next_rank) || 0,
      });
    } catch (err) {
      console.error('Leaderboard load failed:', err.message);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // Type-safe comparison: both user.id and student_id come as numbers from JSON but coerce anyway
  const isLoggedIn = !!user;
  const maxXp      = rows.length > 0 ? Math.max(Number(rows[0].xp_points) || 0, 1) : 1;

  return (
    <div className="lb-page">
      <Header />

      <div className="lb-container">

        {/* ── Page header ─────────────────────────────────── */}
        <div className="lb-header">
          <button className="lb-back-btn" onClick={() => navigate('/MainPage')}>
            ← Back to your progress
          </button>
          <h1 className="lb-title">🏆 Leaderboard</h1>
          <p className="lb-subtitle">
            CodeIt creators ranked by XP from projects, lessons, quizzes, and puzzles.
          </p>
          {!loading && !error && rows.length > 0 && (
            <span className="lb-count-badge">
              {summary.totalRanked} {summary.totalRanked === 1 ? 'coder' : 'coders'} ranked
            </span>
          )}
        </div>

        {/* ── Your rank callout (on the board) ────────────── */}
        {!loading && !error && summary.currentRank && (
          <div className="lb-my-rank-card">
            <span className="lb-my-rank-icon">
              {summary.currentRank <= 3 ? MEDALS[summary.currentRank - 1] : '🎯'}
            </span>
            <span className="lb-my-rank-text">
              Your rank:&nbsp;
              <strong>
                #{summary.currentRank}
              </strong>
              &nbsp;, &nbsp;
              <strong>{summary.currentXp.toLocaleString()} XP</strong>
              {summary.xpToNextRank > 0 && (
                <span> · {summary.xpToNextRank.toLocaleString()} XP to pass the next coder</span>
              )}
            </span>
          </div>
        )}

        {/* ── "Not ranked yet" callout (logged in, no XP yet) */}
        {!loading && !error && isLoggedIn && !summary.currentRank && (
          <div className="lb-not-ranked-card">
            <span className="lb-my-rank-icon">🌱</span>
            <span className="lb-my-rank-text">
              You&apos;re not on the board yet , {' '}
              save a project or complete a lesson to earn XP and climb the ranks!
            </span>
          </div>
        )}

        {!loading && !isLoggedIn && (
          <div className="lb-state-card">
            <span className="lb-state-icon">🏆</span>
            <h2>Sign in to join the competition</h2>
            <p>Your rank is private to CodeIt members, and every coder uses a playful alias.</p>
            <button className="lb-retry-btn" onClick={() => navigate('/login')}>
              Log in or create an account
            </button>
          </div>
        )}

        {!loading && !error && isLoggedIn && (
          <section className="lb-how-card" aria-labelledby="lb-how-title">
            <div>
              <span className="lb-eyebrow">HOW TO MOVE UP</span>
              <h2 id="lb-how-title">Learn. Solve. Climb.</h2>
              <p>Save original projects, publish eligible work, and complete coding challenges. Your XP updates the all-time board automatically.</p>
            </div>
            <div className="lb-action-row">
              <button onClick={() => navigate('/builder')}>Build a project</button>
              <button onClick={() => navigate('/lessons')}>Earn XP in a lesson</button>
            </div>
            <small>For student privacy, everyone else sees a fun coder alias, not your real name.</small>
          </section>
        )}

        {/* ── Loading ─────────────────────────────────────── */}
        {loading && (
          <div className="lb-state-card">
            <span className="lb-spinner" aria-hidden="true" />
            <p>Loading champions…</p>
          </div>
        )}

        {/* ── Error ───────────────────────────────────────── */}
        {!loading && error && (
          <div className="lb-state-card lb-state-error">
            <span className="lb-state-icon">😴</span>
            <p>The scoreboard is taking a nap.</p>
            {/* Never the raw error — "Unexpected token '<'" was reaching
                children's screens. The technical detail goes to the console
                for us; the kid gets one honest sentence and a button. */}
            <small>Give it a second, then try again.</small>
            <button className="lb-retry-btn" onClick={load}>Try again</button>
          </div>
        )}

        {/* ── Empty ───────────────────────────────────────── */}
        {!loading && !error && isLoggedIn && rows.length === 0 && (
          <div className="lb-state-card">
            <span className="lb-state-icon">🌱</span>
            <p>No scores yet. Be the first on the board!</p>
          </div>
        )}

        {/* ── Rankings list ────────────────────────────────── */}
        {!loading && !error && rows.length > 0 && (
          <ol className="lb-list" aria-label="Leaderboard rankings">
            {rows.map((row, idx) => {
              const isMe   = Boolean(row.is_current_user);
              const isTop3 = row.rank <= 3;
              const xpPct  = Math.max(
                Math.round(((Number(row.xp_points) || 0) / maxXp) * 100), 2
              );
              const displayName = isMe ? 'You' : (row.display_name || 'Coder');
              const initial = displayName.charAt(0).toUpperCase();
              const bgColour = avatarColour(row.display_name);

              return (
                <li
                  key={`${row.rank}-${row.display_name}`}
                  className={[
                    'lb-row',
                    isTop3 ? `lb-top${row.rank}` : '',
                    isMe   ? 'lb-me'             : '',
                  ].filter(Boolean).join(' ')}
                  style={{ animationDelay: `${idx * 0.045}s` }}
                >
                  {/* Rank / medal */}
                  <span className="lb-rank" aria-label={`Rank ${idx + 1}`}>
                    {isTop3 ? MEDALS[row.rank - 1] : `#${row.rank}`}
                  </span>

                  {/* Avatar circle */}
                  <span
                    className="lb-avatar"
                    aria-hidden="true"
                    style={{ background: bgColour }}
                  >
                    {initial}
                  </span>

                  {/* Name + XP bar */}
                  <div className="lb-name-col">
                    <div className="lb-name-row">
                      <span className="lb-name">{displayName}</span>
                      {isMe && <span className="lb-you-badge">You</span>}
                    </div>
                    <div className="lb-bar-track">
                      <div className="lb-bar-fill" style={{ width: `${xpPct}%` }} />
                    </div>
                  </div>

                  {/* XP count */}
                  <span className="lb-xp">
                    <strong>{(Number(row.xp_points) || 0).toLocaleString()}</strong>
                    <small> XP</small>
                  </span>
                </li>
              );
            })}
          </ol>
        )}

      </div>
    </div>
  );
};

export default Leaderboard;
