import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CharacterAvatar from '../../components/CharacterAvatar/CharacterAvatar';
import { useCharacter } from '../../context/CharacterContext';
import { useAuth } from '../../context/AuthContext';
import Header from '../Header/Header';
import { useSEO } from '../../hooks/useSEO';
import { usePlayerProgress } from '../../hooks/usePlayerProgress';
import { isUnlocked, unlockAt, getNextUnlock, getNextUnlockLabel } from '../../data/unlocks';
import { ENDPOINTS } from '../../config/api';
import './CharacterLab.css';

// ── Option data ──────────────────────────────────────────────
const GENDER_OPTIONS = [
  { value: 'female', label: 'Female' },
  { value: 'male',   label: 'Male'   },
];

const SKIN_OPTIONS = [
  { value: 'sunset',  label: 'Sunset',  swatch: '#f6c7a3' },
  { value: 'sand',    label: 'Sand',    swatch: '#ebb190' },
  { value: 'cocoa',   label: 'Cocoa',   swatch: '#c88762' },
  { value: 'deep',    label: 'Ember',   swatch: '#8d5238' },
  { value: 'pearl',   label: 'Pearl',   swatch: '#f4ddd0' },
];

const HAIR_STYLE_OPTIONS = [
  { value: 'wave',  label: 'Wave'  },
  { value: 'crown', label: 'Crown' },
  { value: 'bun',   label: 'Bun'   },
  { value: 'curls', label: 'Curls' },
  { value: 'pixie', label: 'Pixie' },
];

const HAIR_COLOR_OPTIONS = [
  { value: 'mocha',    label: 'Brown',  swatch: '#4b2e2b' },
  { value: 'midnight', label: 'Black',  swatch: '#1d1a39' },
  { value: 'copper',   label: 'Copper', swatch: '#c6643d' },
  { value: 'gold',     label: 'Gold',   swatch: '#f6c06b' },
  { value: 'ocean',    label: 'Blue',   swatch: '#2b7de9' },
  { value: 'lavender', label: 'Purple', swatch: '#8660c1' },
];

const OUTFIT_OPTIONS = [
  { value: 'astronaut', label: 'Astronaut', desc: 'Ready for cosmic missions.' },
  { value: 'explorer',  label: 'Explorer',  desc: 'Finds clues in every challenge.' },
  { value: 'hacker',    label: 'Hacker',    desc: 'Debugs glitches with style.' },
  { value: 'artist',    label: 'Artist',    desc: 'Paints vibrant code worlds.' },
];

const ACCENT_OPTIONS = [
  { value: 'headphones', label: 'Headphones' },
  { value: 'glasses',    label: 'Glasses'    },
  { value: 'cape',       label: 'Cape'       },
  { value: 'none',       label: 'None'       },
];

const EXPRESSION_OPTIONS = [
  { value: 'smile', label: 'Smile' },
  { value: 'laugh', label: 'Laugh' },
  { value: 'wink',  label: 'Wink'  },
];

// ── Component ────────────────────────────────────────────────
const AvatarLab = () => {
  useSEO({
    canonical:   '/character',
    robots:      'noindex,nofollow',
  });

  const navigate = useNavigate();
  const { character, updateCharacter, resetCharacter } = useCharacter();
  const { token } = useAuth();
  const [savedFlash, setSavedFlash] = useState(false);

  // ── Player level & XP ────────────────────────────────────
  const { xp, level, progress, needed, pct, loading: xpLoading } = usePlayerProgress(token);

  // ── Parent email state ────────────────────────────────────
  const [parentEmailInput, setParentEmailInput] = useState('');
  const [peStatus, setPeStatus] = useState(null);
  const [peError, setPeError] = useState('');

  useEffect(() => {
    if (!token) return;
    fetch(ENDPOINTS.profile.get, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.parentEmail) setParentEmailInput(data.parentEmail);
      })
      .catch(() => {});
  }, [token]);

  const handleParentEmailSave = async () => {
    setPeStatus('saving');
    setPeError('');
    try {
      const res = await fetch(ENDPOINTS.profile.parentEmail, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ parent_email: parentEmailInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPeError(data.error || 'Failed to save');
        setPeStatus('error');
      } else {
        setPeStatus('saved');
        setTimeout(() => setPeStatus(null), 3000);
      }
    } catch {
      setPeError('Network error. Please try again.');
      setPeStatus('error');
    }
  };

  const set = useCallback((key, value) => {
    updateCharacter({ [key]: value });
  }, [updateCharacter]);

  // ── Guarded setter — ignores locked items ─────────────────
  const setIfUnlocked = useCallback((category, value) => {
    if (!isUnlocked(category, value, level)) return;
    updateCharacter({ [category]: value });
  }, [updateCharacter, level]);

  const handleSave = () => {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2200);
  };

  const nickname = character.nickname || '';

  const outfitDesc = useMemo(() => {
    return OUTFIT_OPTIONS.find(o => o.value === character.outfit)?.desc || 'Ready for coding adventures.';
  }, [character.outfit]);

  // Which specific item is the global next unlock (used to highlight it)
  const nextUnlock = useMemo(() => (!xpLoading ? getNextUnlock(level) : null), [level, xpLoading]);

  return (
    <div className="al-page">
      <Header />

      <main className="al-main">

        {/* ── Page hero ─────────────────────────────────── */}
        <div className="al-hero">
          <div className="al-hero__back">
            <button type="button" className="al-back-btn" onClick={() => navigate(-1)}>
              Back
            </button>
          </div>
          <h1 className="al-hero__title">Your Coding Avatar</h1>
          <p className="al-hero__sub">
            Make it yours. Pick your look, name your character, and level up through lessons to unlock new outfits and styles.
          </p>
        </div>

        {/* ── 2-col layout ──────────────────────────────── */}
        <div className="al-layout">

          {/* LEFT. Sticky preview card */}
          <aside className="al-preview-col">
            <div className="al-preview-card">

              {savedFlash && (
                <div className="al-toast" role="status">Avatar saved!</div>
              )}

              {/* Level badge + XP bar */}
              {token && !xpLoading && (
                <div className="al-level-block">
                  <div className="al-level-row">
                    <span className="al-level-badge">Level {level}</span>
                    <span className="al-level-xp">{xp} XP total</span>
                  </div>
                  <div className="al-xp-bar-track">
                    <div
                      className="al-xp-bar-fill"
                      style={{ width: `${pct}%` }}
                      role="progressbar"
                      aria-valuenow={progress}
                      aria-valuemin={0}
                      aria-valuemax={needed}
                      aria-label={`XP progress: ${progress} of ${needed}`}
                    />
                  </div>
                  <p className="al-xp-label">{progress} / {needed} XP to Level {level + 1}</p>
                  {(() => {
                    const nu = getNextUnlock(level);
                    if (!nu) return null;
                    return (
                      <div className="al-next-unlock">
                        <span className="al-next-unlock__label">Next unlock</span>
                        <span className="al-next-unlock__item">
                          {getNextUnlockLabel(nu)} at Level {nu.atLevel}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="al-preview-avatar">
                <CharacterAvatar character={character} size={190} />
              </div>

              <h2 className="al-preview-name">
                {nickname || 'Your Avatar'}
              </h2>
              <p className="al-preview-desc">{outfitDesc}</p>

              <div className="al-field">
                <label htmlFor="al-nickname" className="al-field__label">Nickname</label>
                <input
                  id="al-nickname"
                  className="al-field__input"
                  type="text"
                  value={nickname}
                  maxLength={28}
                  placeholder="E.g. Pixel Wizard"
                  onChange={e => set('nickname', e.target.value.slice(0, 28))}
                />
              </div>

              <div className="al-preview-actions">
                <button
                  type="button"
                  className="al-btn al-btn--primary"
                  onClick={handleSave}
                >
                  Save Avatar
                </button>
                <button
                  type="button"
                  className="al-btn al-btn--ghost"
                  onClick={() => resetCharacter()}
                >
                  Reset
                </button>
              </div>
            </div>
          </aside>

          {/* RIGHT. Customiser sections */}
          <div className="al-options-col">

            {/* Base Style */}
            <section className="al-section">
              <h3 className="al-section__title">Base Style</h3>
              <div className="al-pills">
                {GENDER_OPTIONS.map(o => (
                  <button
                    key={o.value}
                    type="button"
                    className={`al-pill${character.gender === o.value ? ' is-active' : ''}`}
                    onClick={() => set('gender', o.value)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Skin Tone. Always unlocked */}
            <section className="al-section">
              <h3 className="al-section__title">Skin Tone</h3>
              <div className="al-swatches">
                {SKIN_OPTIONS.map(o => (
                  <button
                    key={o.value}
                    type="button"
                    className={`al-swatch${character.skinTone === o.value ? ' is-active' : ''}`}
                    style={{ '--sw': o.swatch }}
                    onClick={() => set('skinTone', o.value)}
                    title={o.label}
                    aria-pressed={character.skinTone === o.value}
                  >
                    <span className="al-swatch__dot" />
                    <span className="al-swatch__name">{o.label}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Hair Style */}
            <section className="al-section">
              <h3 className="al-section__title">
                Hair Style
                {HAIR_STYLE_OPTIONS.filter(o => !isUnlocked('hairStyle', o.value, level)).length > 0 && (
                  <span className="al-section__lock-hint">
                    {HAIR_STYLE_OPTIONS.filter(o => !isUnlocked('hairStyle', o.value, level)).length} locked
                  </span>
                )}
              </h3>
              <div className="al-pills">
                {HAIR_STYLE_OPTIONS.map(o => {
                  const locked = !isUnlocked('hairStyle', o.value, level);
                  const isNext = locked && nextUnlock?.category === 'hairStyle' && nextUnlock?.value === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      className={`al-pill${character.hairStyle === o.value ? ' is-active' : ''}${locked ? ' is-locked' : ''}${isNext ? ' is-next-unlock' : ''}`}
                      onClick={() => setIfUnlocked('hairStyle', o.value)}
                      title={locked ? `Unlocks at Level ${unlockAt('hairStyle', o.value)}` : o.label}
                      aria-disabled={locked}
                    >
                      {o.label}
                      {locked && <span className="al-pill__lock">Lv.{unlockAt('hairStyle', o.value)}</span>}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Hair Color */}
            <section className="al-section">
              <h3 className="al-section__title">
                Hair Color
                {HAIR_COLOR_OPTIONS.filter(o => !isUnlocked('hairColor', o.value, level)).length > 0 && (
                  <span className="al-section__lock-hint">
                    {HAIR_COLOR_OPTIONS.filter(o => !isUnlocked('hairColor', o.value, level)).length} locked
                  </span>
                )}
              </h3>
              <div className="al-swatches">
                {HAIR_COLOR_OPTIONS.map(o => {
                  const locked = !isUnlocked('hairColor', o.value, level);
                  const isNext = locked && nextUnlock?.category === 'hairColor' && nextUnlock?.value === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      className={`al-swatch${character.hairColor === o.value ? ' is-active' : ''}${locked ? ' is-locked' : ''}${isNext ? ' is-next-unlock' : ''}`}
                      style={{ '--sw': locked ? '#888' : o.swatch }}
                      onClick={() => setIfUnlocked('hairColor', o.value)}
                      title={locked ? `Unlocks at Level ${unlockAt('hairColor', o.value)}` : o.label}
                      aria-pressed={!locked && character.hairColor === o.value}
                      aria-disabled={locked}
                    >
                      <span className="al-swatch__dot" />
                      <span className="al-swatch__name">
                        {locked ? `Lv.${unlockAt('hairColor', o.value)}` : o.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Outfit */}
            <section className="al-section">
              <h3 className="al-section__title">
                Outfit
                {OUTFIT_OPTIONS.filter(o => !isUnlocked('outfit', o.value, level)).length > 0 && (
                  <span className="al-section__lock-hint">
                    {OUTFIT_OPTIONS.filter(o => !isUnlocked('outfit', o.value, level)).length} locked
                  </span>
                )}
              </h3>
              <div className="al-outfit-grid">
                {OUTFIT_OPTIONS.map(o => {
                  const locked = !isUnlocked('outfit', o.value, level);
                  const isNext = locked && nextUnlock?.category === 'outfit' && nextUnlock?.value === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      className={`al-outfit-card${character.outfit === o.value ? ' is-active' : ''}${locked ? ' is-locked' : ''}${isNext ? ' is-next-unlock' : ''}`}
                      onClick={() => setIfUnlocked('outfit', o.value)}
                      aria-pressed={!locked && character.outfit === o.value}
                      aria-disabled={locked}
                      title={locked ? `Unlocks at Level ${unlockAt('outfit', o.value)}` : undefined}
                    >
                      <span className="al-outfit-card__label">{o.label}</span>
                      <span className="al-outfit-card__desc">
                        {locked ? `Unlocks at Level ${unlockAt('outfit', o.value)}` : o.desc}
                      </span>
                      {locked && <span className="al-outfit-card__lock-badge">Locked</span>}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Accessories */}
            <section className="al-section">
              <h3 className="al-section__title">
                Accessories
                {ACCENT_OPTIONS.filter(o => !isUnlocked('accent', o.value, level)).length > 0 && (
                  <span className="al-section__lock-hint">
                    {ACCENT_OPTIONS.filter(o => !isUnlocked('accent', o.value, level)).length} locked
                  </span>
                )}
              </h3>
              <div className="al-pills">
                {ACCENT_OPTIONS.map(o => {
                  const locked = !isUnlocked('accent', o.value, level);
                  const isNext = locked && nextUnlock?.category === 'accent' && nextUnlock?.value === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      className={`al-pill${character.accent === o.value ? ' is-active' : ''}${locked ? ' is-locked' : ''}${isNext ? ' is-next-unlock' : ''}`}
                      onClick={() => setIfUnlocked('accent', o.value)}
                      title={locked ? `Unlocks at Level ${unlockAt('accent', o.value)}` : o.label}
                      aria-disabled={locked}
                    >
                      {o.label}
                      {locked && <span className="al-pill__lock">Lv.{unlockAt('accent', o.value)}</span>}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Expression. Always unlocked */}
            <section className="al-section">
              <h3 className="al-section__title">Expression</h3>
              <div className="al-pills">
                {EXPRESSION_OPTIONS.map(o => (
                  <button
                    key={o.value}
                    type="button"
                    className={`al-pill${character.expression === o.value ? ' is-active' : ''}`}
                    onClick={() => set('expression', o.value)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Parent Email */}
            <section className="al-section">
              <h3 className="al-section__title">Parent Email</h3>
              <p className="al-section__hint">
                Add a parent email to receive progress updates when you hit milestones.
              </p>
              <div className="al-parent-email-row">
                <input
                  className="al-field__input"
                  type="email"
                  value={parentEmailInput}
                  placeholder="parent@example.com"
                  onChange={e => { setParentEmailInput(e.target.value); setPeStatus(null); setPeError(''); }}
                />
                <button
                  type="button"
                  className="al-btn al-btn--primary"
                  onClick={handleParentEmailSave}
                  disabled={peStatus === 'saving'}
                >
                  {peStatus === 'saving' ? 'Saving...' : parentEmailInput ? 'Update' : 'Save'}
                </button>
              </div>
              {peStatus === 'saved' && (
                <p className="al-pe-feedback al-pe-feedback--ok">Parent email saved!</p>
              )}
              {peStatus === 'error' && (
                <p className="al-pe-feedback al-pe-feedback--err">{peError}</p>
              )}
            </section>

            {/* Bottom actions row */}
            <div className="al-bottom-row">
              <button
                type="button"
                className="al-btn al-btn--primary al-btn--wide"
                onClick={handleSave}
              >
                Save Avatar
              </button>
              <button
                type="button"
                className="al-btn al-btn--secondary al-btn--wide"
                onClick={() => navigate('/')}
              >
                Done
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default AvatarLab;
