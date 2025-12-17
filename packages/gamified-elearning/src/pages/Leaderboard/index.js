import React, { useEffect, useState } from 'react';
import { ENDPOINTS } from '../../config/api';
import './Leaderboard.css';

const Leaderboard = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(ENDPOINTS.rewards.leaderboard, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          },
        });
        if (!res.ok) throw new Error(`Failed to load leaderboard: ${res.status}`);
        const data = await res.json();
        setRows(data.leaderboard || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="leaderboard-page">Loading leaderboard...</div>;
  if (error) return <div className="leaderboard-page error">Error: {error}</div>;

  return (
    <div className="leaderboard-page">
      <h1>Leaderboard</h1>
      {rows.length === 0 ? (
        <p>No entries yet.</p>
      ) : (
        <ol className="leaderboard-list">
          {rows.map((row, idx) => (
            <li key={row.student_id || idx}>
              <span className="rank">#{idx + 1}</span>
              <span className="name">{row.name || 'Player'}</span>
              <span className="xp">{row.xp_points || 0} XP</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};

export default Leaderboard;
