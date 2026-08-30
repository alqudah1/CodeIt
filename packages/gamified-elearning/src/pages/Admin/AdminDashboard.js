import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import AdminLayout from './AdminLayout';
import './AdminLayout.css';

const fmt = (n) => (Number(n) || 0).toLocaleString();

const AdminDashboard = () => {
  const { token, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [data, setData]   = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/admin/overview`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async r => ({ status: r.status, body: await r.json() }))
      .then(({ status, body }) => {
        if (status === 401) {
          logout();
          navigate('/login', { replace: true, state: { message: 'Your session expired. Please sign in again.' } });
          return;
        }
        if (body.error) setError(body.error);
        else setData(body);
      })
      .catch(() => setError('Failed to load overview'));
  }, [token, logout, navigate]);

  const t = data?.totals || {};
  const activity = data?.activity || {};

  // One-time database maintenance. Exists because the owner's machine has no
  // psql and the connection string in Vercel is sealed as sensitive — the
  // deployed backend is the only thing that can reach the production
  // database. The endpoint applies exactly two reviewed changes and is
  // idempotent, so this button is safe to press twice.
  const [maint, setMaint] = useState(null);
  const runMaintenance = async () => {
    setMaint('running');
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/maintenance/apply-pending`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();
      setMaint(body.success
        ? `Done. Table ${body.understandingTable}, ${body.descriptionsUpdated} descriptions set.`
        : (body.error || 'Failed.'));
    } catch {
      setMaint('Failed — network error.');
    }
  };

  const CARDS = [
    { key: 'daily_active_users',     label: 'Active Today (DAU)',    cls: 'accent', source: activity },
    { key: 'weekly_active_users',    label: 'Active 7 Days (WAU)',   cls: 'green',  source: activity },
    { key: 'monthly_active_users',   label: 'Active 30 Days (MAU)',  cls: 'orange', source: activity },
    { key: 'total_users',            label: 'Total Users',           cls: 'accent' },
    { key: 'signups_today',          label: 'Signups Today',         cls: 'green'  },
    { key: 'signups_week',           label: 'Signups This Week',     cls: 'orange' },
    { key: 'total_xp_earned',        label: 'Total XP Awarded',      cls: 'teal'   },
    { key: 'total_lesson_completions', label: 'Lesson Completions',  cls: ''       },
    { key: 'total_quiz_attempts',    label: 'Quiz Attempts',         cls: ''       },
    { key: 'journey_puzzle_completions', label: 'Puzzle Completions', cls: ''      },
    { key: 'avatars_customised',     label: 'Avatars Customised',    cls: ''       },
    { key: 'students_with_streak',   label: 'Learners With a Streak', cls: 'orange' },
    { key: 'longest_active_streak',  label: 'Longest Streak',        cls: 'teal'   },
  ];

  return (
    <AdminLayout>
      <h2 className="adm-page-title">Overview</h2>

      {error && <div className="adm-error">{error}</div>}

      {!data && !error && <div className="adm-loading">Loading…</div>}

      {data && (
        <>
          <div className="adm-info">
            <strong>Active-user definition:</strong>{' '}
            {activity.definition || 'A non-admin signed-in account that opened or used CodeIt during the selected period.'}
            {' '}Tracking {activity.tracking_started_at
              ? `started ${fmtDate(activity.tracking_started_at)}`
              : 'starts with this release'}; historical accounts are not backfilled.
          </div>
          <div className="adm-stat-grid">
            {CARDS.map(({ key, label, cls, source }) => (
              <div key={key} className="adm-stat-card">
                <div className={`adm-stat-num${cls ? ` ${cls}` : ''}`}>{fmt((source || t)[key])}</div>
                <div className="adm-stat-lbl">{label}</div>
              </div>
            ))}
          </div>

          <div className="adm-section-head">Database maintenance</div>
          <div className="adm-info">
            Applies the two pending changes: the understanding-records table and seven corrected
            lesson descriptions. Safe to run more than once.
            {' '}
            <button
              type="button"
              className="adm-maint-btn"
              onClick={runMaintenance}
              disabled={maint === 'running'}
            >
              {maint === 'running' ? 'Running…' : 'Apply pending changes'}
            </button>
            {maint && maint !== 'running' && <span className="adm-maint-result"> {maint}</span>}
          </div>

          <div className="adm-section-head">Recent Signups</div>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name / Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>XP</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {(data.recentSignups || []).map(u => (
                  <tr
                    key={u.user_id}
                    className="clickable"
                    onClick={() => navigate(`/admin/users/${u.user_id}`)}
                  >
                    <td className="adm-badge adm-badge-gray" style={{ display: 'table-cell' }}>
                      #{u.user_id}
                    </td>
                    <td>
                      <strong>{u.name || ', '}</strong>
                      {u.username && <span style={{ color: '#718096', marginLeft: '0.4rem', fontSize: '0.82rem' }}>@{u.username}</span>}
                    </td>
                    <td style={{ color: '#718096' }}>{u.email || ', '}</td>
                    <td>
                      <span className={`adm-badge ${roleBadge(u.role)}`}>{u.role || ', '}</span>
                    </td>
                    <td><strong>{fmt(u.xp)}</strong></td>
                    <td style={{ color: '#718096' }}>{fmtDate(u.created_at)}</td>
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

function roleBadge(role) {
  const r = (role || '').toLowerCase();
  if (r === 'admin')   return 'adm-badge-purple';
  if (r === 'student') return 'adm-badge-teal';
  return 'adm-badge-gray';
}

function fmtDate(dt) {
  if (!dt) return ', ';
  return new Date(dt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default AdminDashboard;
