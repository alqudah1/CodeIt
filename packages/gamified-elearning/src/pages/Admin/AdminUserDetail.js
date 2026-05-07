import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import AdminLayout from './AdminLayout';
import './AdminLayout.css';

function fmtDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtDateTime(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function calcAge(dob) {
  if (!dob) return '—';
  const birth = new Date(dob);
  if (isNaN(birth)) return '—';
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return `${age} yrs`;
}
const fmt = (n) => (Number(n) || 0).toLocaleString();

const AdminUserDetail = () => {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const [data, setData]   = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError('Failed to load user'));
  }, [id, token]);

  if (error) return (
    <AdminLayout>
      <button className="adm-back-btn" onClick={() => navigate('/admin/users')}>← Back to Users</button>
      <div className="adm-error">{error}</div>
    </AdminLayout>
  );

  if (!data) return (
    <AdminLayout>
      <div className="adm-loading">Loading…</div>
    </AdminLayout>
  );

  const { user, student, character, lessons, quizAttempts, puzzles, gameScores, achievements } = data;

  // Quiz accuracy per quiz_id
  const quizMap = {};
  (quizAttempts || []).forEach(qa => {
    if (!quizMap[qa.quiz_id]) quizMap[qa.quiz_id] = [];
    quizMap[qa.quiz_id].push(qa);
  });

  return (
    <AdminLayout>
      <button className="adm-back-btn" onClick={() => navigate('/admin/users')}>← Back to Users</button>

      <h2 className="adm-page-title">
        {user.name || user.username || `User #${user.user_id}`}
        <span style={{ marginLeft: '0.75rem', fontSize: '0.9rem', fontWeight: 600, color: '#718096' }}>
          #{user.user_id}
        </span>
      </h2>

      <div className="adm-detail-grid">
        {/* Profile */}
        <div className="adm-detail-card">
          <h3>Profile</h3>
          <div className="adm-kv"><span className="k">Name</span>      <span className="v">{user.name || '—'}</span></div>
          <div className="adm-kv"><span className="k">Username</span>  <span className="v">@{user.username || '—'}</span></div>
          <div className="adm-kv"><span className="k">Email</span>     <span className="v">{user.email || '—'}</span></div>
          <div className="adm-kv"><span className="k">Role</span>      <span className="v">{user.role || '—'}</span></div>
          <div className="adm-kv"><span className="k">Birthday</span>  <span className="v">{fmtDate(user.dob)}</span></div>
          <div className="adm-kv"><span className="k">Age</span>       <span className="v">{calcAge(user.dob)}</span></div>
          <div className="adm-kv"><span className="k">Parent email</span> <span className="v">{user.parent_email || '—'}</span></div>
          <div className="adm-kv"><span className="k">Joined</span>    <span className="v">{fmtDate(user.created_at)}</span></div>
        </div>

        {/* Progress */}
        {student && (
          <div className="adm-detail-card">
            <h3>Progress</h3>
            <div className="adm-kv"><span className="k">Total XP</span>     <span className="v" style={{ color: '#6c63ff', fontWeight: 800 }}>{fmt(student.total_xp)}</span></div>
            <div className="adm-kv"><span className="k">Weekly XP</span>    <span className="v">{fmt(student.weekly_xp)}</span></div>
            <div className="adm-kv"><span className="k">Level</span>        <span className="v">{student.level_id || '—'}</span></div>
            <div className="adm-kv"><span className="k">Current streak</span> <span className="v">{student.current_streak || 0} days</span></div>
            <div className="adm-kv"><span className="k">Longest streak</span> <span className="v">{student.longest_streak || 0} days</span></div>
            <div className="adm-kv"><span className="k">Last active</span>  <span className="v">{fmtDate(student.last_active_date)}</span></div>
            <div className="adm-kv"><span className="k">Lessons done</span> <span className="v">{(lessons || []).length}</span></div>
            <div className="adm-kv"><span className="k">Puzzles done</span> <span className="v">{(puzzles || []).length}</span></div>
          </div>
        )}

        {/* Avatar */}
        {character && (
          <div className="adm-detail-card">
            <h3>Avatar</h3>
            {[['Nickname', character.nickname], ['Gender', character.gender],
              ['Skin Tone', character.skin_tone], ['Hair Style', character.hair_style],
              ['Hair Color', character.hair_color], ['Outfit', character.outfit],
              ['Accent', character.accent], ['Expression', character.expression],
              ['Updated', fmtDate(character.updated_at)],
            ].map(([k, v]) => (
              <div className="adm-kv" key={k}>
                <span className="k">{k}</span>
                <span className="v">{v || '—'}</span>
              </div>
            ))}
          </div>
        )}

        {/* Game Scores */}
        {gameScores && gameScores.length > 0 && (
          <div className="adm-detail-card">
            <h3>Game High Scores</h3>
            {gameScores.map(g => (
              <div className="adm-kv" key={g.game_key}>
                <span className="k">{g.game_key}</span>
                <span className="v">{fmt(g.high_score)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Achievements */}
        {achievements && achievements.length > 0 && (
          <div className="adm-detail-card">
            <h3>Achievements ({achievements.length})</h3>
            <div style={{ marginTop: '0.25rem' }}>
              {achievements.map(a => (
                <span key={a.achievement_key} className="adm-chip">{a.label || a.achievement_key}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lessons */}
      <div className="adm-section-head">Lessons Completed ({(lessons || []).length})</div>
      {lessons && lessons.length > 0 ? (
        <div className="adm-table-wrap" style={{ marginBottom: '1.5rem' }}>
          <table className="adm-table">
            <thead>
              <tr><th>Lesson ID</th><th>XP Earned</th><th>Completed At</th></tr>
            </thead>
            <tbody>
              {lessons.map(l => (
                <tr key={l.lesson_id}>
                  <td>Lesson {l.lesson_id}</td>
                  <td><span className="adm-badge adm-badge-purple">{l.xp_earned} XP</span></td>
                  <td style={{ color: '#718096' }}>{fmtDateTime(l.completed_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p style={{ color: '#aaa', fontSize: '0.88rem', marginBottom: '1.5rem' }}>No lessons completed yet.</p>}

      {/* Quiz Attempts */}
      <div className="adm-section-head">Quiz Attempts ({(quizAttempts || []).length})</div>
      {quizAttempts && quizAttempts.length > 0 ? (
        <div className="adm-table-wrap" style={{ marginBottom: '1.5rem' }}>
          <table className="adm-table">
            <thead>
              <tr><th>Quiz</th><th>Score</th><th>XP</th><th>Date</th></tr>
            </thead>
            <tbody>
              {quizAttempts.map((qa, i) => {
                const pct = qa.total_questions > 0
                  ? Math.round((qa.correct_count / qa.total_questions) * 100) : 0;
                return (
                  <tr key={i}>
                    <td>Quiz {qa.quiz_id}</td>
                    <td>
                      <span className={`adm-badge ${pct >= 80 ? 'adm-badge-green' : pct >= 50 ? 'adm-badge-amber' : 'adm-badge-red'}`}>
                        {qa.correct_count}/{qa.total_questions} ({pct}%)
                      </span>
                    </td>
                    <td>{qa.xp_earned || 0} XP</td>
                    <td style={{ color: '#718096' }}>{fmtDateTime(qa.completed_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : <p style={{ color: '#aaa', fontSize: '0.88rem', marginBottom: '1.5rem' }}>No quiz attempts yet.</p>}

      {/* Puzzles */}
      <div className="adm-section-head">Puzzles Completed ({(puzzles || []).length})</div>
      {puzzles && puzzles.length > 0 ? (
        <div className="adm-table-wrap" style={{ marginBottom: '1.5rem' }}>
          <table className="adm-table">
            <thead>
              <tr><th>Puzzle ID</th><th>XP Earned</th><th>Completed At</th></tr>
            </thead>
            <tbody>
              {puzzles.map(p => (
                <tr key={p.puzzle_id}>
                  <td>Puzzle {p.puzzle_id}</td>
                  <td><span className="adm-badge adm-badge-teal">{p.xp_earned} XP</span></td>
                  <td style={{ color: '#718096' }}>{fmtDateTime(p.completed_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p style={{ color: '#aaa', fontSize: '0.88rem', marginBottom: '1.5rem' }}>No puzzles completed yet.</p>}
    </AdminLayout>
  );
};

export default AdminUserDetail;
