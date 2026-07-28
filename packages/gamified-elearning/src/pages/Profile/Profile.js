import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { useCharacter } from '../../context/CharacterContext';
import CharacterAvatar from '../../components/CharacterAvatar/CharacterAvatar';
import Header from '../Header/Header';
import { API_BASE_URL } from '../../config/api';
import { useSEO } from '../../hooks/useSEO';
import './Profile.css';

const XP_PER_LEVEL = 100;

const LEVEL_TITLES = [
  '',
  'Beginner Builder',
  'Code Explorer',
  'Creative Coder',
  'Project Apprentice',
  'Project Wizard',
  'Master Creator',
  'Legend',
];

function getLevelTitle(level) {
  return LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length - 1)] || 'Master Creator';
}

export default function Profile() {
  useSEO({
    title: 'My Profile — CodeIt',
    description: 'Your avatar, XP, and level on CodeIt.',
    canonical: '/profile',
    robots: 'noindex,nofollow',
  });

  const { user, token }          = useContext(AuthContext);
  const { character, stats }     = useCharacter();
  const navigate                 = useNavigate();
  const [projectCount, setProjectCount] = useState(null);
  const [parentSettings, setParentSettings] = useState(null);
  const [progressSummary, setProgressSummary] = useState(null);
  const [parentStatus, setParentStatus] = useState('');
  const [savingParent, setSavingParent] = useState(false);
  const [parentLoading, setParentLoading] = useState(true);
  const [parentLoadError, setParentLoadError] = useState('');

  const totalXP    = stats?.totalXP ?? 0;
  const level      = Math.floor(totalXP / XP_PER_LEVEL) + 1;
  const xpInLevel  = totalXP % XP_PER_LEVEL;
  const xpProgress = (xpInLevel / XP_PER_LEVEL) * 100;
  const nextLevel  = level + 1;
  const title      = getLevelTitle(level);
  const nextTitle  = getLevelTitle(nextLevel);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (!token) return;
    fetch(`${API_BASE_URL}/api/builder/projects`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.success) setProjectCount(d.projects.length); })
      .catch(() => {});

    if (String(user.role).toLowerCase() === 'student') {
      setParentLoading(true);
      setParentLoadError('');
      Promise.all([
        fetch(`${API_BASE_URL}/api/progress-notifications/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(async response => {
          const data = await response.json().catch(() => ({}));
          if (!response.ok || !data.success) throw new Error('settings unavailable');
          return data;
        }),
        fetch(`${API_BASE_URL}/api/progress-notifications/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(async response => {
          const data = await response.json().catch(() => ({}));
          if (!response.ok || !data.success) throw new Error('summary unavailable');
          return data;
        }),
      ]).then(([settingsData, summaryData]) => {
        setParentSettings(settingsData.settings);
        setProgressSummary(summaryData);
      }).catch(() => {
        setParentLoadError('Parent updates are not connected in this preview yet.');
      }).finally(() => {
        setParentLoading(false);
      });
    }
  }, [user, token, navigate]);

  const updateParentField = (field, value) => {
    setParentSettings(current => ({ ...current, [field]: value }));
    setParentStatus('');
  };

  const saveParentSettings = async (event) => {
    event.preventDefault();
    setSavingParent(true);
    setParentStatus('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/progress-notifications/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(parentSettings),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save parent updates');
      setParentSettings(data.settings);
      setParentStatus(
        data.settings.verified
          ? 'Parent update preferences saved.'
          : data.verificationDelivery?.status === 'not_configured'
            ? 'Preferences saved. Email delivery still needs to be connected by CodeIt.'
            : 'Confirmation email sent. Updates begin after the parent confirms.'
      );
    } catch (error) {
      setParentStatus(error.message);
    } finally {
      setSavingParent(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <Header />
      <div className="profile-page">

        {/* ── Avatar hero ── */}
        <section className="profile-hero">
          <div className={`profile-avatar-ring profile-avatar-ring--lv${Math.min(level, 5)}`}>
            <CharacterAvatar character={character} size={110} className="profile-avatar" />
          </div>

          <div className="profile-hero__copy">
            <h1 className="profile-name">{user.name || user.username}</h1>
            <div className="profile-title-badge">{title}</div>
          </div>
        </section>

        {/* ── Level + XP card ── */}
        <div className="profile-card profile-card--xp">
          <div className="profile-xp-header">
            <div className="profile-level-bubble">
              <span className="profile-level-num">{level}</span>
              <span className="profile-level-lbl">Level</span>
            </div>
            <div className="profile-xp-meta">
              <p className="profile-xp-total">{totalXP} XP total</p>
              <p className="profile-xp-next">{XP_PER_LEVEL - xpInLevel} XP to Level {nextLevel}</p>
            </div>
          </div>

          <div className="profile-bar-wrap" role="progressbar" aria-valuenow={xpInLevel} aria-valuemin={0} aria-valuemax={XP_PER_LEVEL}>
            <div className="profile-bar-fill" style={{ width: `${xpProgress}%` }} />
          </div>

          <div className="profile-xp-labels">
            <span>Level {level}</span>
            <span>Level {nextLevel}</span>
          </div>
        </div>

        {/* ── Stats grid ── */}
        <div className="profile-stats">
          <div className="profile-stat">
            <span className="profile-stat__num">{projectCount ?? '—'}</span>
            <span className="profile-stat__lbl">Projects built</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat__num">{stats?.currentStreak ?? 0}</span>
            <span className="profile-stat__lbl">Day streak</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat__num">{stats?.longestStreak ?? 0}</span>
            <span className="profile-stat__lbl">Best streak</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat__num">{totalXP}</span>
            <span className="profile-stat__lbl">Total XP</span>
          </div>
        </div>

        {String(user.role).toLowerCase() === 'student' && (
          <section className="profile-card profile-card--parent" aria-labelledby="parent-updates-title">
            <div className="profile-parent__heading">
              <div>
                <p className="profile-parent__eyebrow">Family progress updates</p>
                <h2 id="parent-updates-title">Keep a parent in the loop</h2>
              </div>
              {parentSettings?.parentEmail && (
                <span className={`profile-parent__status ${parentSettings.verified ? 'is-verified' : 'is-pending'}`}>
                  {parentSettings.verified ? 'Confirmed' : 'Confirmation pending'}
                </span>
              )}
            </div>

            {parentLoading && (
              <div className="profile-parent__notice" role="status">
                <strong>Checking parent update availability…</strong>
              </div>
            )}

            {!parentLoading && parentLoadError && (
              <div className="profile-parent__notice is-planned" role="status">
                <strong>{parentLoadError}</strong>
                <p>
                  CodeIt can track learning milestones, but this server has not enabled the parent
                  confirmation and email service. No parent email has been collected here.
                </p>
              </div>
            )}

            {!parentLoading && !parentLoadError && parentSettings && (
              <>
                {progressSummary && (
                  <div className="profile-parent__counts" aria-label="Tracked milestones">
                    <span><strong>{progressSummary.counts.lessons}</strong> lessons</span>
                    <span><strong>{progressSummary.counts.exercises}</strong> exercises</span>
                    <span><strong>{progressSummary.counts.projects}</strong> projects</span>
                    <span><strong>{progressSummary.counts.published}</strong> published</span>
                  </div>
                )}

                {!parentSettings.emailConfigured && (
                  <div className="profile-parent__notice is-planned" role="status">
                    <strong>Email delivery is not connected yet.</strong>
                    <p>You can save the parent details and choices, but CodeIt will not claim that a confirmation email was sent.</p>
                  </div>
                )}

                <form className="profile-parent__form" onSubmit={saveParentSettings}>
                  <label htmlFor="parent-progress-email">Parent or guardian email</label>
                  <input
                    id="parent-progress-email"
                    type="email"
                    value={parentSettings.parentEmail || ''}
                    onChange={event => updateParentField('parentEmail', event.target.value)}
                    placeholder="parent@example.com"
                    required
                  />
                  <fieldset>
                    <legend>Email them when I:</legend>
                    {[
                      ['notifyLessons', 'finish a lesson'],
                      ['notifyExercises', 'finish an exercise, challenge, or quiz'],
                      ['notifyProjects', 'create a website or project'],
                      ['notifyPublishing', 'publish a project'],
                    ].map(([field, label]) => (
                      <label className="profile-parent__check" key={field}>
                        <input
                          type="checkbox"
                          checked={parentSettings[field] ?? true}
                          onChange={event => updateParentField(field, event.target.checked)}
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </fieldset>
                  <button type="submit" disabled={savingParent}>
                    {savingParent
                      ? 'Saving…'
                      : parentSettings.verified
                        ? 'Save update choices'
                        : parentSettings.emailConfigured
                          ? 'Send parent confirmation'
                          : 'Save parent details'}
                  </button>
                  {parentStatus && <p className="profile-parent__message" aria-live="polite">{parentStatus}</p>}
                  <p className="profile-parent__privacy">
                    Progress emails start only after the parent confirms. Every email includes an unsubscribe link.
                  </p>
                </form>

                {progressSummary?.recent?.length > 0 && (
                  <div className="profile-parent__recent">
                    <h3>Recently tracked</h3>
                    <ul>
                      {progressSummary.recent.slice(0, 4).map((item, index) => (
                        <li key={`${item.eventType}-${item.occurredAt}-${index}`}>
                          <span>{progressSummary.eventLabels[item.eventType] || 'Milestone'}</span>
                          <strong>{item.title}</strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* ── Next level preview ── */}
        <div className="profile-card profile-card--next">
          <div className="profile-next__icon">{nextLevel}</div>
          <div className="profile-next__copy">
            <p className="profile-next__label">Next level</p>
            <p className="profile-next__title">{nextTitle}</p>
            <p className="profile-next__hint">
              Earn {XP_PER_LEVEL - xpInLevel} more XP — build a project, edit it, or save it.
            </p>
          </div>
        </div>

        {/* ── How to earn XP ── */}
        <div className="profile-earn">
          <h2 className="profile-earn__title">How to earn XP</h2>
          <div className="profile-earn__grid">
            {[
              { action: 'Build a project',   xp: '+20 XP' },
              { action: 'Save a project',    xp: '+15 XP' },
              { action: 'Improve a project', xp: '+10 XP' },
            ].map(({ action, xp }) => (
              <div key={action} className="profile-earn__item">
                <span className="profile-earn__action">{action}</span>
                <span className="profile-earn__xp">{xp}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTAs ── */}
        <div className="profile-actions">
          <Link to="/builder"   className="profile-cta profile-cta--primary">Build something</Link>
          <Link to="/character" className="profile-cta profile-cta--secondary">Customise avatar</Link>
        </div>

      </div>
    </>
  );
}
