import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCharacter } from '../../context/CharacterContext';
import { ITEM_DISPLAY_NAMES } from '../../data/unlocks';
import './LevelUp.css';

// ── Level up ─────────────────────────────────────────────────────────────────
//
// One of exactly two pop-ups in the product. Every extra interruption costs
// attention, and a child who learns to dismiss pop-ups will dismiss the one
// that matters. This one is honest because something genuinely changed: a
// level in data/unlocks.js was crossed, and an outfit, an accent or a hair
// colour that was locked in the Avatar Lab is now open.
//
// It stays until the child answers it. A reward that vanishes after five
// seconds while they are still reading is a reward they did not get.
export default function LevelUp() {
  const { levelUp, dismissLevelUp } = useCharacter();
  const navigate = useNavigate();
  const buttonRef = useRef(null);

  useEffect(() => {
    if (levelUp && buttonRef.current) buttonRef.current.focus();
  }, [levelUp]);

  useEffect(() => {
    if (!levelUp) return undefined;
    const onKey = (event) => { if (event.key === 'Escape') dismissLevelUp(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [levelUp, dismissLevelUp]);

  if (!levelUp) return null;

  const names = levelUp.items
    .map((item) => ITEM_DISPLAY_NAMES[item.category]?.[item.value] || item.value);

  return (
    <div className="levelup" role="dialog" aria-modal="true" aria-labelledby="levelup-title">
      <div className="levelup__card surface-card">
        <p className="levelup__eyebrow">Level {levelUp.level}</p>
        <h2 id="levelup-title">{levelUp.title}</h2>
        {names.length > 0 ? (
          <p className="levelup__unlocked">
            Unlocked in the Avatar Lab: <strong>{names.join(', ')}</strong>.
          </p>
        ) : (
          <p className="levelup__unlocked">Nothing new to wear this time. The next level has something.</p>
        )}
        <div className="levelup__actions">
          <button
            ref={buttonRef}
            type="button"
            className="levelup__go"
            onClick={() => { dismissLevelUp(); navigate('/character'); }}
          >
            Open the Avatar Lab
          </button>
          <button type="button" className="levelup__later" onClick={dismissLevelUp}>
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
