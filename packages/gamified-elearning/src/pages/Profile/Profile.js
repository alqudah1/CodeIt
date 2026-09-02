import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { useCharacter } from '../../context/CharacterContext';
import CharacterAvatar from '../../components/CharacterAvatar/CharacterAvatar';
import Header from '../Header/Header';
import { API_BASE_URL } from '../../config/api';
import useCountUp from '../../hooks/useCountUp';
import { useSEO } from '../../hooks/useSEO';
import { journeyHeaders } from '../../utils/journey';
import { trackEvent } from '../../utils/trackEvent';
import { conceptsIn } from '../Builder/codeConcepts';
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

// ── The medal case ──────────────────────────────────────────────────────────
//
// The five ideas the studio can actually ask a child to explain, mirroring
// SKILL_FOR_QUESTION in the backend. Showing the un-won ones as empty slots is
// what makes it a collection rather than a list — and it invents nothing: a
// locked medal says "not yet", never that it was earned.
const MEDALS = [
  { id: 'loop-count',     icon: '\u{1F501}', name: 'Loop Reader',   match: /how many times a loop/i },
  { id: 'increment',      icon: '\u{2795}',  name: 'Score Keeper',  match: /adds to the score/i },
  { id: 'clicks',         icon: '\u{1F446}', name: 'Click Master',  match: /run when you click/i },
  { id: 'starting-value', icon: '\u{1F4E6}', name: 'Value Finder',  match: /starting value/i },
  { id: 'background',     icon: '\u{1F3A8}', name: 'Colour Tracer', match: /colour in the stylesheet/i },
];

/** Which medals this learner has actually won, and where. Records only. */
function medalsFrom(records) {
  const won = [];
  for (const medal of MEDALS) {
    for (const record of records || []) {
      const hit = (record.skills || []).find(skill => medal.match.test(skill));
      if (hit) { won.push({ ...medal, projectTitle: record.projectTitle }); break; }
    }
  }
  return won;
}

function getLevelTitle(level) {
  return LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length - 1)] || 'Master Creator';
}

export default function Profile() {
  useSEO({
    canonical: '/profile',
    robots: 'noindex,nofollow',
  });

  const { user, token, logout }  = useContext(AuthContext);
  const { character, stats }     = useCharacter();
  const navigate                 = useNavigate();
  const [projectCount, setProjectCount] = useState(null);
  // The trophy wall: sentences the server wrote when this kid explained code
  // in their own projects. Real records only — an empty wall stays empty.
  const [trophies, setTrophies] = useState([]);
  const [parentSettings, setParentSettings] = useState(null);
  const [progressSummary, setProgressSummary] = useState(null);
  const [parentStatus, setParentStatus] = useState('');
  const [savingParent, setSavingParent] = useState(false);
  const [parentLoading, setParentLoading] = useState(true);
  const [parentLoadError, setParentLoadError] = useState('');
  const [familyStatus, setFamilyStatus] = useState(null);
  // The evidence, per child, loaded when a parent asks for it. null = never
  // asked, 'loading', 'error', or the payload.
  const [evidence, setEvidence] = useState({});
  const [evidenceOpen, setEvidenceOpen] = useState(null);
  // The sendable link: child.id -> 'making' | copied/shown URL | 'error'.
  const [shareLinks, setShareLinks] = useState({});
  const [familyLoading, setFamilyLoading] = useState(false);
  const [familyMessage, setFamilyMessage] = useState('');
  const [familySaving, setFamilySaving] = useState(false);
  const [passwordResetId, setPasswordResetId] = useState(null);
  const [newChildPassword, setNewChildPassword] = useState('');
  const [childForm, setChildForm] = useState({
    username: '',
    password: '',
    dob: '',
    relationship: 'parent',
    consent: false,
    progressEmails: false,
  });

  const totalXP    = stats?.totalXP ?? 0;

  // Juice: XP counts up on arrival.

  const shownXP = useCountUp(totalXP);
  const earnedMedals = medalsFrom(trophies);
  const level      = Math.floor(totalXP / XP_PER_LEVEL) + 1;
  const xpInLevel  = totalXP % XP_PER_LEVEL;
  const xpProgress = (xpInLevel / XP_PER_LEVEL) * 100;
  const nextLevel  = level + 1;
  const title      = getLevelTitle(level);
  const nextTitle  = getLevelTitle(nextLevel);

  useEffect(() => {
    if (!user || !token || String(user.role).toLowerCase() === 'student') return;
    if (window.location.hash !== '#family-controls') return;
    const accountKey = user.id || user.user_id || 'account';
    const storageKey = `codeit_new_account_family_setup_${accountKey}`;
    if (sessionStorage.getItem(storageKey)) return;
    sessionStorage.setItem(storageKey, '1');
    void trackEvent('new_account_family_setup_view', null, token);
  }, [token, user]);

  useEffect(() => {
    if (!user) {
      const from = window.location.pathname + window.location.search;
      navigate('/login', { state: { from } });
      return;
    }
    if (!token) return;
    fetch(`${API_BASE_URL}/api/builder/projects`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.success) setProjectCount(d.projects.length); })
      .catch(() => {});
    if (String(user?.role).toLowerCase() === 'student') {
      fetch(`${API_BASE_URL}/api/understanding`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.json())
        .then(d => { if (d.success) setTrophies((d.records || []).filter(rec => (rec.skills || []).length > 0)); })
        .catch(() => {});
    }

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
    } else {
      setFamilyLoading(true);
      fetch(`${API_BASE_URL}/api/family`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(async response => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) throw new Error(data.error || 'Family controls are unavailable.');
        setFamilyStatus(data);
        const params = new URLSearchParams(window.location.search);
        if (params.get('familyVerified') === '1') setFamilyMessage('Adult email confirmed. You can now create a private learner profile.');
        if (params.get('familyVerified') === '0') setFamilyMessage('That confirmation link is invalid or expired. Send a new one below.');
      }).catch(error => {
        setFamilyMessage(error.message);
      }).finally(() => {
        setFamilyLoading(false);
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

  const sendFamilyVerification = async () => {
    setFamilySaving(true);
    setFamilyMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/family/verification`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not send the confirmation email.');
      setFamilyStatus(data.status || familyStatus);
      setFamilyMessage(data.alreadyVerified
        ? 'This adult email is already confirmed.'
        : 'Confirmation email sent. Open it within 48 hours, then return here.');
    } catch (error) {
      setFamilyMessage(error.message);
    } finally {
      setFamilySaving(false);
    }
  };

  const updateChildField = (field, value) => {
    setChildForm(current => ({ ...current, [field]: value }));
    setFamilyMessage('');
  };

  const createChildProfile = async (event) => {
    event.preventDefault();
    setFamilySaving(true);
    setFamilyMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/family/children`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...journeyHeaders(),
        },
        body: JSON.stringify({
          ...childForm,
          noticeVersion: familyStatus.noticeVersion,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not create the learner profile.');
      setFamilyStatus(data.status);
      setChildForm({
        username: '',
        password: '',
        dob: '',
        relationship: 'parent',
        consent: false,
        progressEmails: false,
      });
      setFamilyMessage(`Private learner profile “${data.child.username}” created. Use “Switch to learner” below to open their first project.`);
    } catch (error) {
      setFamilyMessage(error.message);
    } finally {
      setFamilySaving(false);
    }
  };

  const deleteChildProfile = async (child) => {
    if (!window.confirm(`Delete ${child.username}'s managed profile and all connected projects and progress? This cannot be undone.`)) return;
    setFamilySaving(true);
    setFamilyMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/family/children/${child.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not delete the learner profile.');
      setFamilyStatus(data.status);
      setFamilyMessage(`${child.username}'s profile and connected data were deleted.`);
    } catch (error) {
      setFamilyMessage(error.message);
    } finally {
      setFamilySaving(false);
    }
  };

  const resetChildPassword = async (event, child) => {
    event.preventDefault();
    setFamilySaving(true);
    setFamilyMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/family/children/${child.id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: newChildPassword }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not update the learner password.');
      setPasswordResetId(null);
      setNewChildPassword('');
      setFamilyMessage(`${child.username}'s password was updated.`);
    } catch (error) {
      setFamilyMessage(error.message);
    } finally {
      setFamilySaving(false);
    }
  };

  const toggleChildProgressEmails = async (child) => {
    setFamilySaving(true);
    setFamilyMessage('');
    try {
      const enabled = !child.progressEmailsEnabled;
      const response = await fetch(`${API_BASE_URL}/api/family/children/${child.id}/progress-emails`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not update progress emails.');
      setFamilyStatus(data.status);
      setFamilyMessage(enabled
        ? `Progress emails are on for ${child.username}.`
        : `Progress emails are paused for ${child.username}.`);
    } catch (error) {
      setFamilyMessage(error.message);
    } finally {
      setFamilySaving(false);
    }
  };

  // ── The evidence a parent is paying for ────────────────────────────────────
  //
  // The summary line above says "4 projects · 12 lessons", and counts are what
  // every learning product shows because counts are cheap. The question GOAL.md
  // wrote down — "the computer made it, so what did my child actually do?" —
  // is answered from the child's own newest file, read by the same concept
  // finder the child's code tab uses (codeConcepts.js), so parent and child
  // are shown the same truth: the concept, how often, and the child's own
  // line. Nothing here is generated or estimated.
  async function openEvidence(child) {
    if (evidenceOpen === child.id) { setEvidenceOpen(null); return; }
    setEvidenceOpen(child.id);
    if (evidence[child.id] && evidence[child.id] !== 'error') return;
    setEvidence(prev => ({ ...prev, [child.id]: 'loading' }));
    try {
      const res = await fetch(`${API_BASE_URL}/api/family/children/${child.id}/evidence`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Could not load');
      const newest = data.projects?.[0] || null;
      setEvidence(prev => ({
        ...prev,
        [child.id]: {
          project: newest ? { title: newest.title, prompt: newest.prompt, updatedAt: newest.updatedAt } : null,
          concepts: newest ? conceptsIn(newest.code).slice(0, 5) : [],
          lessonsDone: data.lessonsDone || [],
          // What they EXPLAINED — sentences written by the server when the
          // child answered questions about their own code. The strongest
          // evidence on the page, so it renders first.
          understood: data.understood || [],
        },
      }));
      void trackEvent('parent_evidence_open', null, token);
    } catch (err) {
      setEvidence(prev => ({ ...prev, [child.id]: 'error' }));
    }
  }

  // Mint the link a parent can send — to a grandparent, a teacher, the other
  // parent. It opens on any phone with no account and shows only the child's
  // first name and the sentences they earned.
  async function makeShareLink(child) {
    setShareLinks(prev => ({ ...prev, [child.id]: 'making' }));
    try {
      const res = await fetch(`${API_BASE_URL}/api/understanding/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ childId: child.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Could not make the link');
      const url = `${window.location.origin}${data.path}`;
      try { await navigator.clipboard.writeText(url); } catch { /* shown below either way */ }
      setShareLinks(prev => ({ ...prev, [child.id]: url }));
    } catch {
      setShareLinks(prev => ({ ...prev, [child.id]: 'error' }));
    }
  }

  const switchToLearner = (child) => {
    const confirmed = window.confirm(
      `Switch to ${child.username}? This signs out the parent account on this device and opens the learner sign-in.`
    );
    if (!confirmed) return;
    logout();
    navigate('/login', {
      state: { managedUsername: child.username, from: '/builder' },
    });
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
              <p className="profile-xp-total">{shownXP} XP total</p>
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
            {/* Was `projectCount ?? ', '` — a find-replace casualty that showed
                a child a literal comma. A stat renders a number, always. */}
            <span className="profile-stat__num">{Number(projectCount) || 0}</span>
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
            <span className="profile-stat__num">{shownXP}</span>
            <span className="profile-stat__lbl">Total XP</span>
          </div>
        </div>

        {/* ── The trophy wall ─────────────────────────────────────────────
            Every plaque is a sentence the server wrote only after this kid
            answered questions about code in their own project. Kids collect;
            nothing here can be earned by just showing up. */}
        {String(user.role).toLowerCase() === 'student' && (
          <section className="profile-card profile-medals" aria-labelledby="profile-medals-title">
            <p className="profile-medals__eyebrow">Your medal case</p>
            <h2 id="profile-medals-title" className="profile-medals__title">
              {earnedMedals.length} of {MEDALS.length} medals earned
            </h2>
            <p className="profile-medals__how">
              A medal is only yours once you have explained that idea inside a project you made.
            </p>
            <ul className="profile-medals__case">
              {MEDALS.map(medal => {
                const won = earnedMedals.find(e => e.id === medal.id);
                return (
                  <li className={`medal${won ? ' medal--won' : ''}`} key={medal.id}>
                    <span className="medal__disc" aria-hidden="true">
                      <span className="medal__face">{won ? medal.icon : '?'}</span>
                      <span className="medal__ribbon medal__ribbon--l" />
                      <span className="medal__ribbon medal__ribbon--r" />
                    </span>
                    <span className="medal__name">{medal.name}</span>
                    {won
                      ? <span className="medal__where">in {won.projectTitle}</span>
                      : <span className="medal__locked">Not yet</span>}
                  </li>
                );
              })}
            </ul>
            <p className="profile-medals__hint">
              {earnedMedals.length === 0
                ? 'Open a project in the studio and press Prove it to win your first one.'
                : 'Win the rest by pressing Prove it after you play your own projects.'}
            </p>
          </section>
        )}

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

            {/* Never infrastructure words on a kid's screen. The old copy
                talked about "this server" and "the email service" — that
                sentence was for us, not for her. */}
            {!parentLoading && parentLoadError && (
              <div className="profile-parent__notice is-planned" role="status">
                <strong>Parent updates aren&rsquo;t switched on right now.</strong>
                <p>Your grown-up can still see everything you make on the family page.</p>
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

        {String(user.role).toLowerCase() !== 'student' && (
          <section id="family-controls" className="profile-card profile-card--parent profile-family" aria-labelledby="family-controls-title">
            <div className="profile-parent__heading">
              <div>
                <p className="profile-parent__eyebrow">Parent-managed access</p>
                <h2 id="family-controls-title">Private profiles for ages 5 to 12</h2>
              </div>
              {familyStatus && (
                <span className={`profile-parent__status ${familyStatus.emailVerified ? 'is-verified' : 'is-pending'}`}>
                  {familyStatus.emailVerified ? 'Email confirmed' : 'Email confirmation needed'}
                </span>
              )}
            </div>

            <div className="profile-parent__notice">
              <strong>What CodeIt stores</strong>
              <p>
                A non-identifying username, birthday, password hash, learning progress, and private projects.
                Managed younger profiles cannot publish projects publicly.
              </p>
            </div>

            {familyLoading && <p className="profile-parent__message" role="status">Loading family controls…</p>}
            {familyMessage && <p className="profile-parent__message" aria-live="polite">{familyMessage}</p>}

            {!familyLoading && familyStatus && !familyStatus.emailVerified && (
              <div className="profile-family__verify">
                <p>
                  Confirm <strong>{familyStatus.adultEmail}</strong> before creating a learner profile.
                  The confirmation link expires after 48 hours.
                </p>
                <button type="button" onClick={sendFamilyVerification} disabled={familySaving || !familyStatus.emailConfigured}>
                  {familySaving ? 'Sending…' : familyStatus.emailConfigured ? 'Send confirmation email' : 'Email service unavailable'}
                </button>
              </div>
            )}

            {!familyLoading && familyStatus?.emailVerified && (
              <>
                <form className="profile-family__form" onSubmit={createChildProfile}>
                  <h3>Create a private learner profile</h3>
                  <p>Use a nickname, not the child’s full name. The learner signs in with this username and password.</p>
                  <div className="profile-family__fields">
                    <label>
                      Learner username
                      <input
                        value={childForm.username}
                        onChange={event => updateChildField('username', event.target.value)}
                        pattern="[A-Za-z0-9_]{3,20}"
                        minLength="3"
                        maxLength="20"
                        placeholder="creative_coder"
                        required
                      />
                    </label>
                    <label>
                      Learner birthday
                      <input
                        type="date"
                        value={childForm.dob}
                        onChange={event => updateChildField('dob', event.target.value)}
                        required
                      />
                    </label>
                    <label>
                      Learner password
                      <input
                        type="password"
                        value={childForm.password}
                        onChange={event => updateChildField('password', event.target.value)}
                        minLength="10"
                        maxLength="128"
                        autoComplete="new-password"
                        required
                      />
                    </label>
                    <label>
                      Your relationship
                      <select
                        value={childForm.relationship}
                        onChange={event => updateChildField('relationship', event.target.value)}
                      >
                        <option value="parent">Parent</option>
                        <option value="guardian">Guardian</option>
                      </select>
                    </label>
                  </div>
                  <label className="profile-family__consent">
                    <input
                      type="checkbox"
                      checked={childForm.consent}
                      onChange={event => updateChildField('consent', event.target.checked)}
                      required
                    />
                    <span>
                      I am this learner’s parent or legal guardian. I reviewed the <Link to="/privacy">privacy notice</Link>,
                      consent to this private managed profile, and understand public publishing is disabled.
                    </span>
                  </label>
                  <label className="profile-family__consent">
                    <input
                      type="checkbox"
                      checked={childForm.progressEmails}
                      onChange={event => updateChildField('progressEmails', event.target.checked)}
                    />
                    <span>
                      Email me when this learner completes lessons, exercises, or creates projects.
                      I can pause these updates at any time.
                    </span>
                  </label>
                  <button type="submit" disabled={familySaving}>
                    {familySaving ? 'Creating…' : 'Create private learner profile'}
                  </button>
                </form>

                <div className="profile-family__children">
                  <h3>Managed learner profiles</h3>
                  {familyStatus.children.length === 0 ? (
                    <p>No managed profiles yet.</p>
                  ) : familyStatus.children.map(child => (
                    <article key={child.id}>
                      <div className="profile-family__child-summary">
                        <div>
                          <strong>{child.username}</strong>
                          <span>
                            {child.totalXP} XP · {child.lessons} lessons · {child.quizzes} quizzes ·
                            {' '}{child.puzzles} puzzles · {child.projects} projects
                          </span>
                          <span>
                            Private publishing · Progress emails {child.progressEmailsEnabled ? 'on' : 'off'}
                          </span>
                        </div>
                        <div className="profile-family__child-actions">
                          <button
                            className="is-primary"
                            type="button"
                            onClick={() => switchToLearner(child)}
                            disabled={familySaving}
                          >
                            Switch to learner
                          </button>
                          <button
                            className="is-secondary"
                            type="button"
                            onClick={() => openEvidence(child)}
                          >
                            {evidenceOpen === child.id ? 'Hide the evidence' : 'What did they actually do?'}
                          </button>
                          <button
                            className="is-secondary"
                            type="button"
                            onClick={() => toggleChildProgressEmails(child)}
                            disabled={familySaving}
                          >
                            {child.progressEmailsEnabled ? 'Pause emails' : 'Start emails'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPasswordResetId(current => current === child.id ? null : child.id);
                              setNewChildPassword('');
                            }}
                            disabled={familySaving}
                          >
                            Change password
                          </button>
                          <button type="button" onClick={() => deleteChildProfile(child)} disabled={familySaving}>
                            Delete profile
                          </button>
                        </div>
                      </div>
                      {evidenceOpen === child.id && (
                        <div className="profile-evidence">
                          {evidence[child.id] === 'loading' && <p className="profile-evidence__quiet">Reading {child.username}'s own files…</p>}
                          {evidence[child.id] === 'error' && <p className="profile-evidence__quiet">Could not load the evidence just now. Try again in a moment.</p>}
                          {typeof evidence[child.id] === 'object' && evidence[child.id] !== null
                            && (evidence[child.id].understood || []).length > 0 && (
                            <div className="profile-evidence__understood">
                              <p className="profile-evidence__intro">
                                What {child.username} explained, in their own projects:
                              </p>
                              <ul className="profile-evidence__list">
                                {evidence[child.id].understood.slice(0, 5).map(entry => (
                                  <li key={`${entry.projectTitle}-${entry.at}`}>
                                    <span className="profile-evidence__what">
                                      <strong>{entry.projectTitle}</strong>
                                      {entry.at ? ` · ${new Date(entry.at).toLocaleDateString()}` : ''}
                                    </span>
                                    {entry.skills.map(skill => (
                                      <span className="profile-evidence__skill" key={skill}>✓ {skill}</span>
                                    ))}
                                  </li>
                                ))}
                              </ul>
                              <div className="profile-evidence__share">
                                <button
                                  type="button"
                                  onClick={() => makeShareLink(child)}
                                  disabled={shareLinks[child.id] === 'making'}
                                >
                                  {shareLinks[child.id] === 'making' ? 'Making the link…' : 'Send this to someone'}
                                </button>
                                {typeof shareLinks[child.id] === 'string'
                                  && shareLinks[child.id] !== 'making' && shareLinks[child.id] !== 'error' && (
                                  <p className="profile-evidence__share-link">
                                    Link copied. It opens on any phone, no account needed:{' '}
                                    <a href={shareLinks[child.id]} target="_blank" rel="noreferrer">{shareLinks[child.id]}</a>
                                  </p>
                                )}
                                {shareLinks[child.id] === 'error' && (
                                  <p className="profile-evidence__share-link">Could not make the link just now. Try again in a moment.</p>
                                )}
                              </div>
                            </div>
                          )}
                          {typeof evidence[child.id] === 'object' && evidence[child.id] !== null && (
                            evidence[child.id].project ? (
                              <>
                                <p className="profile-evidence__intro">
                                  In <strong>{evidence[child.id].project.title}</strong>, {child.username} is using:
                                </p>
                                <ul className="profile-evidence__list">
                                  {evidence[child.id].concepts.map(concept => (
                                    <li key={concept.id}>
                                      <span className="profile-evidence__what">
                                        <strong>{concept.label}</strong>
                                        {concept.count > 1 ? ` · ${concept.count} times` : ''}
                                      </span>
                                      <code className="profile-evidence__line">line {concept.line}: {concept.snippet}</code>
                                    </li>
                                  ))}
                                </ul>
                                <p className="profile-evidence__note">
                                  Every line above is from {child.username}'s own file, not an example, not a summary.
                                  {evidence[child.id].lessonsDone.length > 0 && (
                                    <> Lessons finished: {evidence[child.id].lessonsDone.map(l => l.title).join(', ')}.</>
                                  )}
                                </p>
                                {/* The offer, at the only moment it is earned.
                                    A pricing page is an interruption; this is a
                                    parent who has just read their child's own
                                    line of code. One quiet sentence, honest
                                    about the price (the pilot is free, and
                                    nothing charges today), and one link. */}
                                <div className="profile-evidence__offer">
                                  <span>
                                    Want more of this? The family pilot is free: more projects,
                                    two learners, and one email a month with exactly this kind of evidence.
                                  </span>
                                  <Link
                                    to="/pricing#family-pilot"
                                    className="profile-evidence__offer-link"
                                    onClick={() => void trackEvent('parent_cta_click', 'evidence-pilot', token)}
                                  >
                                    See the pilot
                                  </Link>
                                </div>
                              </>
                            ) : (
                              <p className="profile-evidence__quiet">
                                No saved projects yet. The evidence starts with their first save.
                              </p>
                            )
                          )}
                        </div>
                      )}
                      {passwordResetId === child.id && (
                        <form className="profile-family__password" onSubmit={event => resetChildPassword(event, child)}>
                          <label>
                            New learner password
                            <input
                              type="password"
                              value={newChildPassword}
                              onChange={event => setNewChildPassword(event.target.value)}
                              minLength="10"
                              maxLength="128"
                              autoComplete="new-password"
                              required
                            />
                          </label>
                          <button type="submit" disabled={familySaving}>
                            {familySaving ? 'Updating…' : 'Update password'}
                          </button>
                        </form>
                      )}
                    </article>
                  ))}
                </div>
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
              Earn {XP_PER_LEVEL - xpInLevel} more XP. Build a project, edit it, or save it.
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
