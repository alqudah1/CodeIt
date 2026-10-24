// ── /powers: what your games can do ─────────────────────────────────────────
//
// Twelve powers in a grid. Green is learned, the one yellow block is next,
// grey is later. No path, no castles: tap the yellow one. A guest's
// progress lives in the browser; a signed-in child's comes from the server
// and is merged with whatever the browser remembers from before the account.

import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import { useSEO } from '../../hooks/useSEO';
import Header from '../Header/Header';
import TabBar from '../../ds/TabBar';
import { POWERS, POWER_XP, powerStates } from './powers';
import '../../ds/ds.css';
import './Powers.css';

export const DONE_KEY = 'codeit.powers.v1';

export function readDone(storage) {
  try { const v = JSON.parse(storage.getItem(DONE_KEY) || '[]'); return Array.isArray(v) ? v.filter((s) => typeof s === 'string') : []; } catch { return []; }
}
export function rememberDone(storage, slug) {
  const done = readDone(storage);
  if (!done.includes(slug)) { done.push(slug); try { storage.setItem(DONE_KEY, JSON.stringify(done)); } catch { /* full or private */ } }
  return done;
}

export default function PowersMap() {
  useSEO({ canonical: '/powers', title: 'Powers | CodeIt', description: 'Twelve things your games can do. Learn each one inside your own game.', robots: 'noindex,nofollow' });
  const { token } = useContext(AuthContext);
  const [serverDone, setServerDone] = useState(null);
  const localDone = useMemo(() => readDone(localStorage), []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/powers`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        const data = res.ok ? await res.json() : null;
        if (alive && data?.done) setServerDone(data.done);
      } catch { /* the browser's memory still counts */ }
    })();
    return () => { alive = false; };
  }, [token]);

  const done = useMemo(() => Array.from(new Set([...(serverDone || []), ...localDone])), [serverDone, localDone]);
  const states = powerStates(done);
  const next = states.find((s) => s.state === 'next');
  const count = states.filter((s) => s.state === 'done').length;

  return (
    <div className="pw">
      <Header />
      <main className="pw__main">
        <div className="pw__head">
          <div>
            <div className="ci-ey">{POWERS.length} powers</div>
            <h1 className="ci-h1">What your games can do.</h1>
          </div>
          <div className="pw__count"><b>{count}</b> of {POWERS.length}</div>
        </div>
        <p className="ci-sub pw__sub">Each one is three minutes inside your own game. Change a line, run it, then write it yourself. {POWER_XP} XP each.</p>
        <div className="pw__grid">
          {states.map((p, i) => {
            const cls = `pw__blk ci-blk ci-rise ${p.state === 'done' ? 'ci-blk--mint is-done' : p.state === 'next' ? 'ci-blk--sun is-next' : 'ci-blk--paper is-later'}`;
            const inner = (
              <>
                <span className="pw__n">{p.n}</span>
                <span className="pw__name">{p.name}</span>
                <span className="pw__does">{p.does}</span>
                {p.state === 'next' && <span className="pw__go">Start</span>}
                {p.state === 'done' && <span className="pw__tick" aria-label="done">✓</span>}
              </>
            );
            return p.state === 'later'
              ? <div key={p.slug} className={cls} style={{ animationDelay: `${i * 0.03}s` }} aria-disabled="true">{inner}</div>
              : <Link key={p.slug} to={`/powers/${p.slug}`} className={cls} style={{ animationDelay: `${i * 0.03}s` }}>{inner}</Link>;
          })}
        </div>
        {next && <Link className="ci-btn ci-btn--ink pw__cta" to={`/powers/${next.slug}`}>Start {next.name}</Link>}
        {!next && <p className="ci-sub">Every power is yours. Go build something with all of them.</p>}
      </main>
      <TabBar />
    </div>
  );
}
