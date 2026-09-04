import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CHEST_EVENT, openChest, pendingChests, whoAmI } from '../../utils/chests';
import Icon from '../Icon/Icon';
import './ChestTray.css';

// ── The chest: a reveal, not a lottery ───────────────────────────────────────
//
// When a chest is earned it does not open. A small chest appears in the corner
// and waits, so a child mid-build is never interrupted (message 61). When
// they tap it, the lid lifts and the fixed contents rise out: the item the
// level unlocked, or the badge, or the palette. Same milestone, same reward,
// every child, and the child has usually seen it greyed out in the Avatar Lab
// already. Anticipation, then payoff.
//
// This is one of the few things in the product that asks for a tap to
// dismiss, so it is careful about it: one chest at a time, Escape closes it,
// and the button after it goes to the place the reward lives.

function readPending() {
  try { return pendingChests(window.localStorage, whoAmI()); } catch { return []; }
}

export default function ChestTray() {
  const navigate = useNavigate();
  const [pending, setPending] = useState(readPending);
  const [open, setOpen] = useState(null); // { id, reward, phase: 'closed' | 'opening' | 'open' }
  const goRef = useRef(null);

  useEffect(() => {
    if (open?.phase === 'open' && goRef.current) goRef.current.focus();
  }, [open]);

  const refresh = useCallback(() => setPending(readPending()), []);

  useEffect(() => {
    window.addEventListener(CHEST_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(CHEST_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => { if (event.key === 'Escape' && open.phase === 'open') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const start = () => {
    const id = pending[0];
    if (!id) return;
    const reward = openChest(window.localStorage, whoAmI(), id);
    if (!reward) { refresh(); return; }
    setOpen({ id, reward, phase: 'closed' });
    // The lid lifts after the shake. Two short beats, then the contents.
    setTimeout(() => setOpen((o) => (o && o.id === id ? { ...o, phase: 'opening' } : o)), 500);
    setTimeout(() => setOpen((o) => (o && o.id === id ? { ...o, phase: 'open' } : o)), 1100);
  };

  const close = () => {
    setOpen(null);
    refresh();
  };

  const goTo = () => {
    const kinds = new Set(open.reward.rewards.map((r) => r.kind));
    close();
    if (kinds.has('avatar')) navigate('/character');
    else if (kinds.has('palette')) navigate('/builder');
    else navigate('/profile');
  };

  if (open) {
    const { reward, phase } = open;
    const kinds = new Set(reward.rewards.map((r) => r.kind));
    const goLabel = kinds.has('avatar') ? 'Wear it' : kinds.has('palette') ? 'Use it in the studio' : 'See it on my profile';
    return (
      <div className="chest" role="dialog" aria-modal="true" aria-labelledby="chest-title">
        <div className={`chest__box chest__box--${phase}`} aria-hidden="true">
          <div className="chest__lid" />
          <div className="chest__body" />
          {phase === 'open' && (
            <ul className="chest__items">
              {reward.rewards.map((r) => (
                <li key={`${r.kind}-${r.id || r.value}`} className={`chest__item chest__item--${r.kind}`}>
                  <Icon name={r.kind === 'avatar' ? 'star' : r.kind === 'palette' ? 'palette' : 'medal1'} size={22} />
                  <span>{r.label}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className={`chest__card${phase === 'open' ? ' is-shown' : ''}`}>
          <p className="chest__kicker">{phase === 'open' ? 'Yours now' : 'Opening'}</p>
          <h2 id="chest-title">{reward.title}</h2>
          {phase === 'open' && (
            <>
              <p className="chest__why">{reward.why}</p>
              <ul className="chest__list">
                {reward.rewards.map((r) => <li key={`${r.kind}-${r.id || r.value}`}>{r.label}</li>)}
              </ul>
              <div className="chest__actions">
                <button type="button" className="chest__go" onClick={goTo} ref={goRef}>{goLabel}</button>
                <button type="button" className="chest__later" onClick={close}>
                  {pending.length > 1 ? 'Next chest' : 'Close'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!pending.length) return null;

  return (
    <button type="button" className="chest-tray" onClick={start} aria-label={pending.length === 1 ? 'You have a chest to open' : `You have ${pending.length} chests to open`}>
      <span className="chest-tray__box" aria-hidden="true" />
      <span className="chest-tray__label">{pending.length === 1 ? 'A chest is waiting' : `${pending.length} chests waiting`}</span>
    </button>
  );
}
