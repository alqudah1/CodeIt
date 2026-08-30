import { useEffect, useState, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import AdminLayout from './AdminLayout';
import './AdminLayout.css';

const PAGE_SIZE = 50;

function calcAge(dob) {
  if (!dob) return ', ';
  const birth = new Date(dob);
  if (isNaN(birth)) return ', ';
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function fmtDate(dt) {
  if (!dt) return ', ';
  return new Date(dt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const COLS = [
  { key: 'user_id',        label: 'ID'       },
  { key: 'username',       label: 'Username' },
  { key: 'name',           label: 'Name'     },
  { key: 'dob',            label: 'Birthday' },
  { key: '_age',           label: 'Age'      },
  { key: 'role',           label: 'Role'     },
  { key: 'family_status',  label: 'Family'   },
  { key: 'created_at',     label: 'Joined'   },
  { key: 'total_xp',       label: 'XP'       },
  { key: 'current_streak', label: 'Streak'   },
  { key: 'lessons_done',   label: 'Lessons'  },
  { key: 'quizzes_done',   label: 'Quizzes'  },
];

const AdminUsers = () => {
  const { token } = useContext(AuthContext);
  const navigate  = useNavigate();

  const [rows, setRows]     = useState([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState('');
  const [draft, setDraft]   = useState('');
  const [sortKey, setSortKey]  = useState('created_at');
  const [sortDir, setSortDir]  = useState('desc');
  const [loading, setLoading]  = useState(false);
  const [error, setError]      = useState(null);

  const load = useCallback((pg, q) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: pg, limit: PAGE_SIZE, search: q });
    fetch(`${API_BASE_URL}/api/admin/users?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return; }
        setRows(d.users || []);
        setTotal(d.total || 0);
      })
      .catch(() => setError('Failed to load users'))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { load(page, search); }, [load, page, search]);

  const doSearch = () => {
    setPage(1);
    setSearch(draft);
  };

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedRows = [...rows].sort((a, b) => {
    let av = sortKey === '_age' ? calcAge(a.dob) : (a[sortKey] ?? '');
    let bv = sortKey === '_age' ? calcAge(b.dob) : (b[sortKey] ?? '');
    if (av === ', ') av = sortDir === 'asc' ? Infinity : -Infinity;
    if (bv === ', ') bv = sortDir === 'asc' ? Infinity : -Infinity;
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
  const arrow = (key) => sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '';

  return (
    <AdminLayout>
      <h2 className="adm-page-title">Users ({total.toLocaleString()})</h2>

      <div className="adm-search-row">
        <input
          className="adm-search-input"
          aria-label="Search users by name, username or email"
          placeholder="Search by name, username or email…"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && doSearch()}
        />
        <button className="adm-btn adm-btn-primary" onClick={doSearch}>Search</button>
        {search && (
          <button className="adm-btn adm-btn-secondary" onClick={() => { setDraft(''); setSearch(''); setPage(1); }}>
            Clear
          </button>
        )}
      </div>

      {error && <div className="adm-error">{error}</div>}
      {loading && <div className="adm-loading">Loading…</div>}

      {!loading && (
        <>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  {COLS.map(c => (
                    <th
                      key={c.key}
                      className={sortKey === c.key ? 'sorted' : ''}
                      onClick={() => toggleSort(c.key)}
                    >
                      {c.label}{arrow(c.key)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedRows.map(u => (
                  <tr
                    key={u.user_id}
                    className="clickable"
                    onClick={() => navigate(`/admin/users/${u.user_id}`)}
                  >
                    <td style={{ color: '#718096' }}>#{u.user_id}</td>
                    <td>{u.username ? `@${u.username}` : <span style={{ color: '#aaa' }}>, </span>}</td>
                    <td><strong>{u.name || ', '}</strong></td>
                    <td style={{ color: '#718096' }}>{u.dob ? fmtDate(u.dob) : ', '}</td>
                    <td>{calcAge(u.dob)}</td>
                    <td><span className={`adm-badge ${roleBadge(u.role)}`}>{u.role || ', '}</span></td>
                    <td>{familyStatus(u.family_status)}</td>
                    <td style={{ color: '#718096' }}>{fmtDate(u.created_at)}</td>
                    <td><strong style={{ color: '#6c63ff' }}>{(Number(u.total_xp) || 0).toLocaleString()}</strong></td>
                    <td>{u.current_streak > 0 ? `${u.current_streak}d` : <span style={{ color: '#ccc' }}>, </span>}</td>
                    <td>{u.lessons_done || 0}</td>
                    <td>{u.quizzes_done || 0}</td>
                  </tr>
                ))}
                {sortedRows.length === 0 && (
                  <tr><td colSpan={COLS.length} className="adm-loading">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="adm-pagination">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span className="adm-pg-info">Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
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

function familyStatus(status) {
  if (!status) return <span style={{ color: '#aaa' }}>, </span>;
  const labels = {
    managed: 'Managed',
    review_sent: 'Review sent',
    review_required: 'Review needed',
  };
  const colors = {
    managed: { background: '#e8f7ee', color: '#236b42' },
    review_sent: { background: '#fff4d8', color: '#7a5412' },
    review_required: { background: '#ffe8df', color: '#9a3f1e' },
  };
  return (
    <span className="adm-badge" style={colors[status] || {}}>
      {labels[status] || status}
    </span>
  );
}

export default AdminUsers;
