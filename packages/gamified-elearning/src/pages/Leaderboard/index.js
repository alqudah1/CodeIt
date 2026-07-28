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
    title:       'Leaderboard | CodeIt',
    description: 'See the top Python coders on CodeIt. Earn XP through lessons, quizzes, and puzzles to climb the global rankings.',
    canonical:   '/leaderboard',
    robots:      'noindex,nofollow',
  });

  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const { user }              = useContext(AuthContext);
  const navigate              = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(ENDPOINTS.rewards.leaderboard, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      });
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const data = await res.json();
      setRows(data.leaderboard || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Type-safe comparison: both user.id and student_id come as numbers from JSON but coerce anyway
  const myRank    = rows.findIndex(
    (r) => user && Number(user.id) === Number(r.student_id)
  );
  const isLoggedIn = !!user;
  const maxXp      = rows.length > 0 ? Math.max(Number(rows[0].xp_points) || 0, 1) : 1;

  return (
    <div className="lb-page">
      <Header />

      <div className="lb-container">

        {/* ── Page header ─────────────────────────────────── */}
        <div className="lb-header">
          <button className="lb-back-btn" onClick={() => navigate('/MainPage')}>
            ← Back to Dashboard
          </button>
          <h1 className="lb-title">🏆 Leaderboard</h1>
          <p className="lb-subtitle">
            Top coders ranked by total XP earned across lessons, quizzes &amp; puzzles.
          </p>
          {!loading && !error && rows.length > 0 && (
            <span className="lb-count-badge">
              {rows.length} {rows.length === 1 ? 'coder' : 'coders'} ranked
            </span>
          )}
        </div>

        {/* ── Your rank callout (on the board) ────────────── */}
        {!loading && !error && myRank >= 0 && (
          <div className="lb-my-rank-card">
            <span className="lb-my-rank-icon">
              {myRank < 3 ? MEDALS[myRank] : '🎯'}
            </span>
            <span className="lb-my-rank-text">
              Your rank:&nbsp;
              <strong>
                {myRank < 3 ? `${MEDALS[myRank]} #${myRank + 1}` : `#${myRank + 1}`}
              </strong>
              &nbsp;—&nbsp;
              <strong>{(Number(rows[myRank]?.xp_points) || 0).toLocaleString()} XP</strong>
            </span>
          </div>
        )}

        {/* ── "Not ranked yet" callout (logged in, no XP yet) */}
        {!loading && !error && isLoggedIn && myRank === -1 && (
          <div className="lb-not-ranked-card">
            <span className="lb-my-rank-icon">🌱</span>
            <span className="lb-my-rank-text">
              You&apos;re not on the board yet —{' '}
              complete lessons &amp; quizzes to earn XP and climb the ranks!
            </span>
          </div>
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
            <span className="lb-state-icon">😕</span>
            <p>Couldn&apos;t load the leaderboard right now.</p>
            <small>{error}</small>
            <button className="lb-retry-btn" onClick={load}>Try again</button>
          </div>
        )}

        {/* ── Empty ───────────────────────────────────────── */}
        {!loading && !error && rows.length === 0 && (
          <div className="lb-state-card">
            <span className="lb-state-icon">🌱</span>
            <p>No scores yet — be the first on the board!</p>
          </div>
        )}

        {/* ── Rankings list ────────────────────────────────── */}
        {!loading && !error && rows.length > 0 && (
          <ol className="lb-list" aria-label="Leaderboard rankings">
            {rows.map((row, idx) => {
              const isMe   = user && Number(user.id) === Number(row.student_id);
              const isTop3 = idx < 3;
              const xpPct  = Math.max(
                Math.round(((Number(row.xp_points) || 0) / maxXp) * 100), 2
              );
              const initial = (row.name || 'P').charAt(0).toUpperCase();
              const bgColour = avatarColour(row.name);

              return (
                <li
                  key={row.student_id ?? idx}
                  className={[
                    'lb-row',
                    isTop3 ? `lb-top${idx + 1}` : '',
                    isMe   ? 'lb-me'             : '',
                  ].filter(Boolean).join(' ')}
                  style={{ animationDelay: `${idx * 0.045}s` }}
                >
                  {/* Rank / medal */}
                  <span className="lb-rank" aria-label={`Rank ${idx + 1}`}>
                    {isTop3 ? MEDALS[idx] : `#${idx + 1}`}
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
                      <span className="lb-name">{row.name || 'Player'}</span>
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
