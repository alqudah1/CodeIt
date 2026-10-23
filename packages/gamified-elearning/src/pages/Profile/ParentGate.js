// ── The parent gate ─────────────────────────────────────────────────────────
//
// Anything that touches a child's account (parent email, password, the
// family page) sits behind one question a grown-up can answer and a child
// mostly cannot: the year they were born. It is a gate, not a lock; it
// stops a nine-year-old wandering into settings, and that is all it claims.
// A pass lasts for this browser tab's session.

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../../ds/ds.css';
import './ParentGate.css';

export const GATE_KEY = 'codeit.gate.v1';

export function gateOpen(storage) {
  try { return storage.getItem(GATE_KEY) === '1'; } catch { return false; }
}
export function openGate(storage) {
  try { storage.setItem(GATE_KEY, '1'); } catch { /* a private window: the gate just asks again */ }
}

/** Is this a birth year a grown-up could have? 18 to 100 years ago. */
export function isGrownUpYear(raw, now = new Date()) {
  const year = Number(String(raw || '').trim());
  if (!Number.isInteger(year)) return false;
  const age = now.getFullYear() - year;
  return age >= 18 && age <= 100;
}

export default function ParentGate({ onPass, backTo = '/profile', backLabel = 'Back to Me' }) {
  const [year, setYear] = useState('');
  const [tries, setTries] = useState(0);
  const [shake, setShake] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (isGrownUpYear(year)) { openGate(sessionStorage); onPass(); return; }
    setTries((t) => t + 1);
    setShake(true); setTimeout(() => setShake(false), 500);
  };

  return (
    <div className="pg">
      <form className={`pg__card ci-blk ci-blk--paper ci-rise${shake ? ' is-shake' : ''}`} onSubmit={submit} noValidate>
        <div className="ci-ey">For a grown-up</div>
        <h1 className="ci-h1 pg__title">What year were you born?</h1>
        <p className="ci-sub">This part is for parents and teachers: emails, passwords and the family page.</p>
        <input
          className="pg__year"
          value={year}
          onChange={(e) => setYear(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
          inputMode="numeric"
          placeholder="1985"
          aria-label="The year you were born"
          autoComplete="off"
        />
        {tries > 0 && <p className="pg__no" role="alert">{tries >= 3 ? 'Ask a grown-up to type it for you.' : 'Not a grown-up year. Try again.'}</p>}
        <div className="pg__btns">
          <button type="submit" className="ci-btn ci-btn--ink" disabled={year.length < 4}>Continue</button>
          <Link className="ci-btn ci-btn--paper" to={backTo}>{backLabel}</Link>
        </div>
      </form>
    </div>
  );
}
