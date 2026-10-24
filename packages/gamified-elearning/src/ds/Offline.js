// ── When CodeIt cannot be reached ───────────────────────────────────────────
//
// School Wi-Fi drops. Before this, a teacher with three classes was told
// "No classes yet", the board said "Loading the board." for ever, and a child
// typing the right code was told to check it. None of that was true.
//
// The rule here: say what happened in words a person can act on, say that
// nothing is lost, keep showing whatever this device already has, and try
// again by itself so nobody has to know where the reload button is.

import React, { useEffect, useRef, useState } from 'react';
import './Offline.css';

export const RETRY_MS = 15000;

/** A fetch that failed because nothing answered, not because the answer was no. */
export function isUnreachable(err, res) {
  if (res) return res.status === 502 || res.status === 504 || res.status === 0;
  if (!err) return false;
  if (err.name === 'AbortError') return true;
  // Chrome, Firefox, Safari and Node each word it differently.
  return /failed to fetch|networkerror|network request failed|load failed|fetch failed/i.test(String(err.message || ''));
}

export function deviceOffline() {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

/** The one sentence that says why. */
export function whyUnreachable() {
  return deviceOffline()
    ? 'This device is not connected to the internet.'
    : 'CodeIt is not answering right now.';
}

/** While `on`, call `fn` every `ms` and the moment the device comes back online. */
export function useRetry(fn, on, ms = RETRY_MS) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    if (!on) return undefined;
    const tick = () => ref.current();
    const id = setInterval(tick, ms);
    window.addEventListener('online', tick);
    return () => { clearInterval(id); window.removeEventListener('online', tick); };
  }, [on, ms]);
}

/** True once something has been loading for longer than a person would wait quietly. */
export function useSlow(active, ms = 8000) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!active) { setSlow(false); return undefined; }
    const id = setTimeout(() => setSlow(true), ms);
    return () => clearTimeout(id);
  }, [active, ms]);
  return slow;
}

/** A loading line that admits it when the wait gets long. */
export function Waiting({ what, active = true }) {
  const slow = useSlow(active);
  return (
    <p className="ci-sub off__wait" role="status">
      {slow ? `Still waiting for ${what}. The connection is slow, so this page keeps trying.` : `Loading ${what}.`}
    </p>
  );
}

/** The card. `detail` says what is safe; `children` is whatever still works. */
export default function Offline({ title = 'This cannot load right now.', detail, onRetry, children, className = '', level = 2 }) {
  // The page's own heading when nothing else on the page loaded.
  const Title = level === 1 ? 'h1' : 'h2';
  const [trying, setTrying] = useState(false);
  const retry = async () => {
    if (!onRetry || trying) return;
    setTrying(true);
    try { await onRetry(); } finally { setTrying(false); }
  };
  return (
    <div className={`ci-blk ci-blk--paper off ci-rise ${className}`.trim()} role="status">
      <div className="off__top"><span className="off__dot" aria-hidden="true" /><span className="ci-ey">{deviceOffline() ? 'No internet' : 'No connection'}</span></div>
      <Title className="off__title">{title}</Title>
      <p className="ci-sub off__detail">{whyUnreachable()} {detail || 'Nothing is lost. This page tries again by itself.'}</p>
      {(onRetry || children) && (
        <div className="off__acts">
          {onRetry && (
            <button type="button" className="ci-btn ci-btn--ink" onClick={retry} disabled={trying}>
              {trying ? 'Trying' : 'Try again now'}
            </button>
          )}
          {children}
        </div>
      )}
    </div>
  );
}

/** A thin line over a page that is showing what it had before the connection went. */
export function OfflineStrip({ since, onRetry }) {
  return (
    <div className="off__strip" role="status">
      <span className="off__dot" aria-hidden="true" />
      <span>Connection lost{since ? `, showing what was here at ${since}` : ''}. Trying again.</span>
      {onRetry && <button type="button" className="off__stripbtn" onClick={onRetry}>Try now</button>}
    </div>
  );
}
