import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import AdminLayout from './AdminLayout';
import './AdminLayout.css';

function fmtDate(dt) {
  if (!dt) return ', ';
  return new Date(dt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const FIELDS = ['gender', 'skin_tone', 'hair_style', 'hair_color', 'outfit', 'accent', 'expression'];
const FIELD_LABELS = {
  gender: 'Gender', skin_tone: 'Skin Tone', hair_style: 'Hair Style',
  hair_color: 'Hair Color', outfit: 'Outfit', accent: 'Accent', expression: 'Expression',
};

const AdminAvatars = () => {
  const { token } = useContext(AuthContext);
  const [data, setData]   = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/admin/avatars`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError('Failed to load avatar data'));
  }, [token]);

  if (error) return <AdminLayout><div className="adm-error">{error}</div></AdminLayout>;
  if (!data)  return <AdminLayout><div className="adm-loading">Loading…</div></AdminLayout>;

  const { avatars = [], outfitDistribution = [] } = data;

  // Build distribution counts for each field across all avatars
  const distMap = {};
  FIELDS.forEach(f => { distMap[f] = {}; });
  avatars.forEach(av => {
    FIELDS.forEach(f => {
      const val = av[f] || 'none';
      distMap[f][val] = (distMap[f][val] || 0) + 1;
    });
  });

  return (
    <AdminLayout>
      <h2 className="adm-page-title">Avatars ({avatars.length} customised)</h2>

      {/* Outfit distribution (from backend) */}
      {outfitDistribution.length > 0 && (
        <>
          <div className="adm-section-head">Outfit Distribution</div>
          <div className="adm-dist-card" style={{ marginBottom: '1.5rem', maxWidth: '380px' }}>
            {outfitDistribution.map(row => (
              <div className="adm-prog-row" key={row.outfit}>
                <span className="adm-prog-label">{row.outfit || 'none'}</span>
                <div className="adm-prog-bar-wrap">
                  <div className="adm-prog-bar-fill" style={{
                    width: `${Math.min(100, (row.n / outfitDistribution[0].n) * 100)}%`
                  }} />
                </div>
                <span className="adm-prog-pct">{row.n}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Per-field distributions */}
      <div className="adm-section-head">All Field Distributions</div>
      <div className="adm-dist-grid" style={{ marginBottom: '1.75rem' }}>
        {FIELDS.filter(f => f !== 'outfit').map(f => {
          const entries = Object.entries(distMap[f]).sort((a, b) => b[1] - a[1]);
          const maxN = entries[0]?.[1] || 1;
          return (
            <div className="adm-dist-card" key={f}>
              <h3>{FIELD_LABELS[f]}</h3>
              {entries.map(([val, n]) => (
                <div className="adm-prog-row" key={val}>
                  <span className="adm-prog-label">{val}</span>
                  <div className="adm-prog-bar-wrap">
                    <div className="adm-prog-bar-fill" style={{ width: `${(n / maxN) * 100}%` }} />
                  </div>
                  <span className="adm-prog-pct">{n}</span>
                </div>
              ))}
              {entries.length === 0 && <span style={{ color: '#aaa', fontSize: '0.83rem' }}>No data</span>}
            </div>
          );
        })}
      </div>

      {/* Recent avatar updates table */}
      <div className="adm-section-head">Recent Avatar Updates</div>
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Nickname</th>
              <th>Gender</th>
              <th>Outfit</th>
              <th>Hair</th>
              <th>Expression</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {avatars.slice(0, 50).map(av => (
              <tr key={av.user_id}>
                <td>
                  <strong>{av.name || av.username || ', '}</strong>
                  <span style={{ color: '#aaa', fontSize: '0.78rem', marginLeft: '0.3rem' }}>#{av.user_id}</span>
                </td>
                <td style={{ color: '#718096' }}>{av.nickname || ', '}</td>
                <td>
                  {av.gender && <span className="adm-chip">{av.gender}</span>}
                </td>
                <td>
                  {av.outfit && <span className="adm-chip">{av.outfit}</span>}
                </td>
                <td style={{ color: '#4a5568', fontSize: '0.83rem' }}>
                  {[av.hair_style, av.hair_color].filter(Boolean).join(' / ') || ', '}
                </td>
                <td>
                  {av.expression && <span className="adm-chip">{av.expression}</span>}
                </td>
                <td style={{ color: '#718096' }}>{fmtDate(av.updated_at)}</td>
              </tr>
            ))}
            {avatars.length === 0 && (
              <tr><td colSpan={7} className="adm-loading">No avatars customised yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export default AdminAvatars;
