import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import AdminLayout from './AdminLayout';
import './AdminLayout.css';

const fmt = (n) => (Number(n) || 0).toLocaleString();

const AdminStats = () => {
  const { token } = useContext(AuthContext);
  const navigate  = useNavigate();

  const [stats, setStats]       = useState(null);
  const [progress, setProgress] = useState(null);
  const [error, setError]       = useState(null);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API_BASE_URL}/api/admin/stats`,    { headers }).then(r => r.json()),
      fetch(`${API_BASE_URL}/api/admin/progress`, { headers }).then(r => r.json()),
    ])
      .then(([s, p]) => {
        if (s.error) { setError(s.error); return; }
        setStats(s);
        setProgress(p);
      })
      .catch(() => setError('Failed to load stats'));
  }, [token]);

  if (error) return <AdminLayout><div className="adm-error">{error}</div></AdminLayout>;
  if (!stats) return <AdminLayout><div className="adm-loading">Loading…</div></AdminLayout>;

  const maxLearnerXP = Math.max(...(stats.topLearners || []).map(l => Number(l.total_xp) || 0), 1);

  return (
    <AdminLayout>
      <h2 className="adm-page-title">Stats</h2>

      {/* Distributions */}
      <div className="adm-dist-grid">
        <div className="adm-dist-card">
          <h3>XP Distribution</h3>
          {(stats.xpDistribution || []).map(row => (
            <div className="adm-prog-row" key={row.bucket}>
              <span className="adm-prog-label">{row.bucket}</span>
              <div className="adm-prog-bar-wrap">
                <div className="adm-prog-bar-fill" style={{ width: `${Math.min(100, (row.n / Math.max(...stats.xpDistribution.map(r => r.n), 1)) * 100)}%` }} />
              </div>
              <span className="adm-prog-pct">{fmt(row.n)}</span>
            </div>
          ))}
        </div>

        <div className="adm-dist-card">
          <h3>Streak Distribution</h3>
          {(stats.streakDistribution || []).map(row => (
            <div className="adm-prog-row" key={row.bucket}>
              <span className="adm-prog-label">{row.bucket}</span>
              <div className="adm-prog-bar-wrap">
                <div className="adm-prog-bar-fill" style={{ width: `${Math.min(100, (row.n / Math.max(...stats.streakDistribution.map(r => r.n), 1)) * 100)}%` }} />
              </div>
              <span className="adm-prog-pct">{fmt(row.n)}</span>
            </div>
          ))}
        </div>

        {progress?.dropoff && (
          <div className="adm-dist-card">
            <h3>Lesson Dropoff Funnel</h3>
            {[
              { label: 'Reached L1',  val: progress.dropoff.reached_l1  },
              { label: 'Reached L3',  val: progress.dropoff.reached_l3  },
              { label: 'Reached L5',  val: progress.dropoff.reached_l5  },
              { label: 'Reached L10', val: progress.dropoff.reached_l10 },
            ].map(({ label, val }) => (
              <div className="adm-prog-row" key={label}>
                <span className="adm-prog-label">{label}</span>
                <div className="adm-prog-bar-wrap">
                  <div className="adm-prog-bar-fill" style={{ width: `${Math.min(100, (val / Math.max(progress.dropoff.reached_l1, 1)) * 100)}%` }} />
                </div>
                <span className="adm-prog-pct">{fmt(val)}</span>
              </div>
            ))}
          </div>
        )}

        {stats.quizAccuracy && stats.quizAccuracy.length > 0 && (
          <div className="adm-dist-card">
            <h3>Quiz Avg Score</h3>
            {stats.quizAccuracy.map(row => (
              <div className="adm-prog-row" key={row.quiz_id}>
                <span className="adm-prog-label">Quiz {row.quiz_id}</span>
                <div className="adm-prog-bar-wrap">
                  <div className="adm-prog-bar-fill" style={{ width: `${row.avg_pct || 0}%` }} />
                </div>
                <span className="adm-prog-pct">{row.avg_pct ?? '—'}%</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Daily signups */}
      <div className="adm-section-head">Daily Signups — Last 30 Days</div>
      <div className="adm-table-wrap" style={{ marginBottom: '1.75rem' }}>
        <table className="adm-table">
          <thead>
            <tr><th>Date</th><th>Signups</th></tr>
          </thead>
          <tbody>
            {(stats.signupsByDay || []).length === 0 && (
              <tr><td colSpan={2} className="adm-loading">No signups in the past 30 days.</td></tr>
            )}
            {[...(stats.signupsByDay || [])].reverse().map(row => (
              <tr key={row.day}>
                <td style={{ color: '#718096' }}>{row.day}</td>
                <td>
                  <strong>{row.n}</strong>
                  <span style={{ marginLeft: '0.5rem', display: 'inline-block', height: '8px', width: `${Math.min(200, row.n * 8)}px`, background: 'linear-gradient(90deg,#6c63ff,#FF8A3D)', borderRadius: '4px', verticalAlign: 'middle' }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Top learners */}
      <div className="adm-section-head">Top Learners</div>
      <div className="adm-table-wrap" style={{ marginBottom: '1.75rem' }}>
        <table className="adm-table">
          <thead>
            <tr>
              <th>#</th><th>Name</th><th>XP</th><th>XP Bar</th>
              <th>Streak</th><th>Lessons</th><th>Quizzes</th>
            </tr>
          </thead>
          <tbody>
            {(stats.topLearners || []).map((l, i) => (
              <tr key={l.user_id} className="clickable" onClick={() => navigate(`/admin/users/${l.user_id}`)}>
                <td style={{ color: '#718096', fontWeight: 700 }}>{i + 1}</td>
                <td>
                  <strong>{l.name || '—'}</strong>
                  {l.username && <span style={{ color: '#aaa', fontSize: '0.8rem', marginLeft: '0.4rem' }}>@{l.username}</span>}
                </td>
                <td><strong style={{ color: '#6c63ff' }}>{fmt(l.total_xp)}</strong></td>
                <td style={{ width: '140px' }}>
                  <div style={{ background: '#e8ecf4', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
                    <div style={{ width: `${(l.total_xp / maxLearnerXP) * 100}%`, height: '100%', background: 'linear-gradient(90deg,#6c63ff,#FF8A3D)', borderRadius: '999px' }} />
                  </div>
                </td>
                <td>{l.current_streak ? `${l.current_streak}d` : '—'}</td>
                <td>{l.lessons_done || 0}</td>
                <td>{l.quizzes_done || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Lesson completions */}
      {progress?.lessonStats && progress.lessonStats.length > 0 && (
        <>
          <div className="adm-section-head">Lesson Completion Counts</div>
          <div className="adm-table-wrap" style={{ marginBottom: '1.75rem' }}>
            <table className="adm-table">
              <thead>
                <tr><th>Lesson</th><th>Title</th><th>Completions</th><th>% of Students</th></tr>
              </thead>
              <tbody>
                {progress.lessonStats.map(row => (
                  <tr key={row.lesson_id}>
                    <td>Lesson {row.lesson_id}</td>
                    <td style={{ color: '#4a5568' }}>{row.title || '—'}</td>
                    <td><strong>{fmt(row.completions)}</strong></td>
                    <td>
                      <span className={`adm-badge ${row.pct >= 50 ? 'adm-badge-green' : 'adm-badge-amber'}`}>
                        {row.pct ?? '—'}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Quiz stats */}
      {progress?.quizStats && progress.quizStats.length > 0 && (
        <>
          <div className="adm-section-head">Quiz Attempt Counts</div>
          <div className="adm-table-wrap" style={{ marginBottom: '1.75rem' }}>
            <table className="adm-table">
              <thead>
                <tr><th>Quiz</th><th>Total Attempts</th><th>Unique Students</th><th>Avg Score</th></tr>
              </thead>
              <tbody>
                {progress.quizStats.map(row => (
                  <tr key={row.quiz_id}>
                    <td>Quiz {row.quiz_id}</td>
                    <td>{fmt(row.attempts)}</td>
                    <td>{fmt(row.unique_students)}</td>
                    <td>
                      <span className={`adm-badge ${(row.avg_score_pct||0) >= 70 ? 'adm-badge-green' : 'adm-badge-amber'}`}>
                        {row.avg_score_pct ?? '—'}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export default AdminStats;
