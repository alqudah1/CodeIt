import React, { useEffect, useState } from 'react';
import Icon from './Icon/Icon';
import { useNavigate } from 'react-router-dom';
import { ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';
import './LeaderboardPreview.css';

const MEDALS = ['medal1', 'medal2', 'medal3'];

const AVATAR_COLOURS = [
  '#ff6b6b', '#ff9f43', '#ffd32a', '#1dd1a1',
  '#54a0ff', '#5f27cd', '#ff9ff3', '#48dbfb',
];

const avatarColour = (name) => {
  const code = (name || 'P').toUpperCase().charCodeAt(0);
  return AVATAR_COLOURS[code % AVATAR_COLOURS.length];
};

const LeaderboardPreview = () => {
  const [rows, setRows]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const navigate                = useNavigate();

  const { token } = useAuth();
  const isLoggedIn = !!token;

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    fetch(ENDPOINTS.rewards.leaderboard, { headers })
      .then((r) => {
        if (!r.ok) {
          setErrorMsg('unavailable');
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data?.leaderboard) setRows(data.leaderboard.slice(0, 5));
      })
      .catch(() => setErrorMsg('unavailable'))
      .finally(() => setLoading(false));
  }, [token, isLoggedIn]);

  return (
    <section className="lb-prev" aria-label="Leaderboard preview">
      <header className="lb-prev-header">
        <div className="lb-prev-title-group">
          <span className="lb-prev-icon"><Icon name="trophy" size={22} /></span>
          <div>
            <h2 className="lb-prev-h2">Top Coders</h2>
            <p className="lb-prev-tagline">Ranked by total XP</p>
          </div>
        </div>
        <button
          className="lb-prev-all-btn"
          onClick={() => navigate('/leaderboard')}
        >
          View All →
        </button>
      </header>

      {/* Not logged in */}
      {!isLoggedIn && (
        <div className="lb-prev-state lb-prev-state--login">
          <Icon name="lock" size={18} />
          <span>
            <button className="lb-prev-login-link" onClick={() => navigate('/login')}>
              Login
            </button>{' '}
            to see the leaderboard
          </span>
        </div>
      )}

      {/* Loading */}
      {isLoggedIn && loading && (
        <div className="lb-prev-state">
          <span className="lb-prev-spinner" aria-hidden="true" />
          Loading leaderboard…
        </div>
      )}

      {/* Error */}
      {isLoggedIn && !loading && errorMsg === 'unavailable' && (
        <div className="lb-prev-state lb-prev-state--warn">
          Leaderboard unavailable right now.
        </div>
      )}

      {/* Empty */}
      {isLoggedIn && !loading && !errorMsg && rows.length === 0 && (
        <div className="lb-prev-state">
          No scores yet. Be the first on the board!
        </div>
      )}

      {/* Rows */}
      {isLoggedIn && !loading && !errorMsg && rows.length > 0 && (
        <ol className="lb-prev-list" aria-label="Top 5 coders">
          {rows.map((row, idx) => (
            <li
              key={`${row.rank}-${row.display_name}`}
              className={`lb-prev-row${idx < 3 ? ` lb-prev-top${idx + 1}` : ''}${row.is_current_user ? ' lb-prev-me' : ''}`}
            >
              <span className="lb-prev-rank">
                {row.rank <= 3 ? MEDALS[row.rank - 1] : `#${row.rank}`}
              </span>
              <span
                className="lb-prev-avatar"
                aria-hidden="true"
                style={{ background: avatarColour(row.display_name) }}
              >
                {(row.display_name || 'P').charAt(0).toUpperCase()}
              </span>
              <span className="lb-prev-name">
                {row.is_current_user ? 'You' : (row.display_name || 'Coder')}
              </span>
              <span className="lb-prev-xp">
                <strong>{(Number(row.xp_points) || 0).toLocaleString()}</strong>
                <small> XP</small>
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};

export default LeaderboardPreview;
