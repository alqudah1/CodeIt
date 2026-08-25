import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import AdminLayout from './AdminLayout';
import './AdminEvidence.css';

const fmt = (value) => (Number(value) || 0).toLocaleString();

const fmtDate = (value) => {
  if (!value) return 'Not recorded';
  return new Date(value).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default function AdminEvidence() {
  const { token } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/admin/evidence`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok || body.error) throw new Error(body.error || 'Could not load evidence.');
        setData(body);
      })
      .catch(() => setError('The historical evidence could not be loaded.'));
  }, [token]);

  const totals = data?.totals || {};
  const activity = data?.activity || {};
  const cards = [
    ['Accounts in database', totals.accounts],
    ['Student profiles', totals.student_profiles],
    ['Learners with XP', totals.learners_with_xp],
    ['XP recorded', totals.total_xp],
    ['Lesson completions', totals.lesson_completions],
    ['Quiz attempts', totals.quiz_attempts],
    ['Puzzle completions', totals.puzzle_completions],
    ['Saved projects', totals.saved_projects],
  ];
  const maxLessonReach = Math.max(
    ...(data?.lessonReach || []).map((row) => Number(row.learners) || 0),
    1
  );
  const maxXpBucket = Math.max(
    ...(data?.xpDistribution || []).map((row) => Number(row.learners) || 0),
    1
  );

  return (
    <AdminLayout>
      <div className="evidence">
        <header className="evidence__header">
          <p>Private founder view</p>
          <h1>Historical product evidence</h1>
          <span>Aggregate activity only, no student names, emails, birthdays, or passwords appear here.</span>
        </header>

        {error && <div className="adm-error">{error}</div>}
        {!data && !error && <div className="adm-loading">Loading verified database totals…</div>}

        {data && (
          <>
            <section className="evidence__truth" aria-label="Important interpretation">
              <strong>What these numbers mean</strong>
              <p>{data.caveat}</p>
              <p>{data.loginTracking}</p>
            </section>

            <section className="evidence__cards" aria-label="Historical database totals">
              {cards.map(([label, value]) => (
                <article key={label}>
                  <strong>{fmt(value)}</strong>
                  <span>{label}</span>
                </article>
              ))}
            </section>

            <section className="evidence__activity" aria-label="Measured active users">
              <header>
                <p>Measured from signed-in visits, not streaks</p>
                <h2>Recent active users</h2>
                <span>{activity.definition}</span>
              </header>
              <div>
                <article><strong>{fmt(activity.daily_active_users)}</strong><span>Active today (DAU)</span></article>
                <article><strong>{fmt(activity.weekly_active_users)}</strong><span>Active in 7 days (WAU)</span></article>
                <article><strong>{fmt(activity.monthly_active_users)}</strong><span>Active in 30 days (MAU)</span></article>
              </div>
              <p>{activity.measurement_note}</p>
            </section>

            <section className="evidence__dates">
              <article><span>First account record</span><strong>{fmtDate(totals.first_account_date)}</strong></article>
              <article><span>Latest account record</span><strong>{fmtDate(totals.latest_account_date)}</strong></article>
              <article><span>Latest recorded learner activity</span><strong>{fmtDate(totals.latest_recorded_activity)}</strong></article>
              <article><span>Students who completed a lesson</span><strong>{fmt(totals.lesson_learners)}</strong></article>
              <article><span>Students who attempted a quiz</span><strong>{fmt(totals.quiz_learners)}</strong></article>
              <article><span>Students who completed a puzzle</span><strong>{fmt(totals.puzzle_learners)}</strong></article>
            </section>

            <section className="evidence__charts">
              <article>
                <h2>Lesson reach</h2>
                <p>Unique learners with a completion record at each lesson.</p>
                <div>
                  {(data.lessonReach || []).map((row) => (
                    <div className="evidence__bar" key={row.lesson_id}>
                      <span>Lesson {row.lesson_id}</span>
                      <i><b style={{ width: `${(Number(row.learners) / maxLessonReach) * 100}%` }} /></i>
                      <strong>{fmt(row.learners)}</strong>
                    </div>
                  ))}
                </div>
              </article>
              <article>
                <h2>XP distribution</h2>
                <p>Student profiles grouped by stored XP.</p>
                <div>
                  {(data.xpDistribution || []).map((row) => (
                    <div className="evidence__bar" key={row.bucket}>
                      <span>{row.bucket}</span>
                      <i><b style={{ width: `${(Number(row.learners) / maxXpBucket) * 100}%` }} /></i>
                      <strong>{fmt(row.learners)}</strong>
                    </div>
                  ))}
                </div>
              </article>
            </section>

            <footer className="evidence__footer">
              Use this page during a meeting instead of showing the Users page. It communicates
              product activity without exposing personal information.
            </footer>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
