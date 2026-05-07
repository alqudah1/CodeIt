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
  'AI Apprentice',
  'AI Wizard',
  'Master Creator',
  'Legend',
];

function getLevelTitle(level) {
  return LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length - 1)] || 'Master Creator';
}

export default function Profile() {
  useSEO({ title: 'My Profile — CodeIt', description: 'Your avatar, XP, and level on CodeIt.' });

  const { user, token }          = useContext(AuthContext);
  const { character, stats }     = useCharacter();
  const navigate                 = useNavigate();
  const [projectCount, setProjectCount] = useState(null);

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
  }, [user, token, navigate]);

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
              { action: 'Edit with AI',      xp: '+10 XP' },
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
