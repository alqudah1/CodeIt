// ── /parent: what your child made this week ─────────────────────────────────
//
// One page a parent reads in a minute: what was made (the newest game,
// playable), what was learned in plain words (powers learned and ideas
// explained in their own games), what is next, and the price. Every line
// comes from the family evidence endpoint and billing status; a child with
// nothing this week gets an honest headline, never a number made up to look
// busy. Paying parents see the renewal date where the price would be.

import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import { PRICE_PER_INTERVAL } from '../../config/pricing';
import { useSEO } from '../../hooks/useSEO';
import { fetchBillingStatus, isPlusMember, openBillingPortal, startCheckout } from '../../utils/billing';
import { reportFailure } from '../../utils/humanError';
import Offline, { Waiting, useRetry } from '../../ds/Offline';
import Header from '../Header/Header';
import { recipeGame } from '../Builder/recipeGame';
import { localRecipe } from '../Build/recipeLocal';
import { powerBySlug } from '../Powers/powers';
import '../../ds/ds.css';
import '../../ds/Examples.css';
import './Parent.css';

/** The headline, from the week's count and the child's name. */
export function headlineFor(name, weekCount) {
  if (!weekCount) return `${name} has not built this week yet.`;
  return `${name} made ${weekCount} ${weekCount === 1 ? 'game' : 'games'} this week.`;
}

/** A date the way a parent reads it. */
export function dayOf(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' });
}

export default function Parent() {
  useSEO({ canonical: 'https://codeitlearn.com/parent', title: 'This week | CodeIt', description: 'What your child made, learned, and does next.', robots: 'noindex,nofollow' });
  const { user, token } = useContext(AuthContext);
  const [family, setFamily] = useState(null);
  const [childId, setChildId] = useState(null);
  const [evidence, setEvidence] = useState({});
  const [billing, setBilling] = useState(null);
  const [status, setStatus] = useState('loading');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [attempt, setAttempt] = useState(0);

  const isStudent = String(user?.role || '').toLowerCase() === 'student';

  useEffect(() => {
    if (!user || !token || isStudent) { setStatus('idle'); return undefined; }
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/family`, { headers: { Authorization: `Bearer ${token}` } });
        // A failed answer is not "no children": saying so would send a parent
        // off to add a child they already added.
        if (!res.ok) throw new Error(`family ${res.status}`);
        const data = await res.json();
        if (!alive) return;
        const st = data?.status || null;
        setFamily(st);
        if (st?.children?.length) setChildId((id) => id || st.children[0].id);
        setStatus('ok');
      } catch (err) { console.error('parent/family:', err); if (alive) setStatus((s) => (s === 'ok' ? 'ok' : 'error')); }
      try { const b = await fetchBillingStatus(token); if (alive) setBilling(b); } catch { /* the price still shows */ }
    })();
    return () => { alive = false; };
  }, [user, token, isStudent, attempt]);
  const retry = () => { setStatus((s) => (s === 'error' ? 'loading' : s)); setAttempt((n) => n + 1); };
  useRetry(retry, status === 'error');
  // A child's games that failed to load try again too, on their own.
  const evidenceFailed = Boolean(childId && evidence[childId]?.error);
  const retryEvidence = () => setEvidence((e) => { const next = { ...e }; delete next[childId]; return next; });
  useRetry(retryEvidence, evidenceFailed);

  useEffect(() => {
    if (!childId || !token || evidence[childId]) return undefined;
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/family/children/${childId}/evidence`, { headers: { Authorization: `Bearer ${token}` } });
        const data = res.ok ? await res.json() : null;
        if (alive) setEvidence((e) => ({ ...e, [childId]: data || { error: true } }));
      } catch { if (alive) setEvidence((e) => ({ ...e, [childId]: { error: true } })); }
    })();
    return () => { alive = false; };
  }, [childId, token, evidence]);

  const child = useMemo(() => (family?.children || []).find((c) => c.id === childId) || null, [family, childId]);
  const ev = childId ? evidence[childId] : null;
  const name = child?.username ? child.username.charAt(0).toUpperCase() + child.username.slice(1) : 'Your child';
  const newest = ev?.projects?.[0] || null;
  const learned = [...(ev?.powers || []).map((p) => `${p.name}: ${p.does}`), ...(ev?.understood || []).flatMap((u) => (u.skills || []).map((s) => `${s} (in ${u.projectTitle})`))];
  const plus = billing ? isPlusMember(billing) : false;

  const buy = async () => {
    if (busy) return;
    setBusy(true); setNote('');
    try { await (plus ? openBillingPortal(token) : startCheckout(token)); } catch (err) { setNote(reportFailure('parent/billing', err, 'Could not open the billing page. Try the pricing page.')); } finally { setBusy(false); }
  };

  if (!user || !token) return <ParentWelcome />;
  if (isStudent) {
    return (
      <div className="pa"><Header /><main className="pa__main"><div className="ci-blk ci-blk--paper pa__card"><h1 className="ci-h1">This page is for grown-ups.</h1><p className="ci-sub">Your own week is on <Link to="/home">Home</Link> and <Link to="/profile">Me</Link>.</p></div></main></div>
    );
  }

  return (
    <div className="pa">
      <Header />
      <main className="pa__main">
        {status === 'loading' && <Waiting what="this week" />}
        {status === 'error' && (
          <>
            <div className="ci-ey">This week</div>
            <h1 className="ci-h1 pa__h1">Your child's week.</h1>
            <Offline
              title="This week cannot load right now."
              onRetry={retry}
              detail="Nothing is lost: their games and powers are kept on CodeIt. This page fills in by itself when the connection is back."
            />
          </>
        )}
        {status === 'ok' && !(family?.children || []).length && (
          <div className="ci-blk ci-blk--sun pa__card ci-rise">
            <div className="ci-ey">For parents</div>
            <h1 className="ci-h1">No child profile linked yet.</h1>
            <p className="ci-sub">Add your child's profile and this page becomes their week: what they made, what they learned, what is next.</p>
            <Link className="ci-btn ci-btn--ink" to="/profile#family-controls">Add a child</Link>
          </div>
        )}
        {status === 'ok' && child && (
          <>
            {(family.children.length > 1) && (
              <div className="pa__kids">
                {family.children.map((c) => <button key={c.id} type="button" className={`ci-chip${c.id === childId ? ' is-on' : ''}`} onClick={() => setChildId(c.id)}>{c.username}</button>)}
              </div>
            )}
            <div className="ci-ey">This week</div>
            <h1 className="ci-h1 pa__h1">{ev && !ev.error ? headlineFor(name, ev.weekCount) : `${name}'s week.`}</h1>
            <div className="pa__grid">
              <section className="pa__left">
                <div className="ci-blk ci-blk--paper pa__made ci-rise">
                  <div className="ci-ey">Made</div>
                  {!ev && <p className="ci-sub">Loading.</p>}
                  {ev?.error && <p className="ci-sub">Could not reach {name}'s games just now. Trying again by itself. <button type="button" className="pa__retry" onClick={retryEvidence}>Try now</button></p>}
                  {ev && !ev.error && !newest && <p className="ci-sub">No games yet. The first one takes about two minutes on <Link to="/build">Build</Link>.</p>}
                  {newest && (
                    <>
                      <div className="ci-frame pa__frame"><iframe title={newest.title} srcDoc={newest.code} sandbox="allow-scripts" /></div>
                      <h2 className="pa__title">{newest.title}</h2>
                      {newest.prompt && <p className="pa__prompt">{name} typed: <q>{newest.prompt}</q></p>}
                      <p className="pa__when">{dayOf(newest.updatedAt)}</p>
                      {ev.projects.length > 1 && <p className="pa__more">Also: {ev.projects.slice(1).map((p) => p.title).join(', ')}.</p>}
                    </>
                  )}
                </div>
                <div className="ci-blk ci-blk--mint pa__learned ci-rise" style={{ animationDelay: '.05s' }}>
                  <div className="ci-ey">Learned, in plain words</div>
                  {ev && !ev.error && learned.length === 0 && <p>Nothing yet. Learning starts with the first power.</p>}
                  <ul>{learned.slice(0, 8).map((line) => <li key={line}>{line}</li>)}</ul>
                  {ev?.nextPower && <p className="pa__next">Next: <b>{ev.nextPower.name}</b>, {ev.nextPower.does}.</p>}
                </div>
              </section>
              <aside className="pa__right">
                {plus ? (
                  <div className="ci-blk ci-blk--ink pa__price ci-rise" style={{ animationDelay: '.1s' }}>
                    <div className="ci-ey">CodeIt Plus</div>
                    <div className="pa__big">{billing.cancelAtPeriodEnd ? 'Ends' : 'Renews'} {dayOf(billing.currentPeriodEnd) || 'soon'}</div>
                    <p>Unlimited builds, every power, this page every week.</p>
                    <button type="button" className="ci-btn ci-btn--paper" onClick={buy} disabled={busy}>{busy ? 'Opening' : 'Manage'}</button>
                  </div>
                ) : (
                  <div className="ci-blk ci-blk--sun pa__price ci-rise" style={{ animationDelay: '.1s' }}>
                    <div className="ci-ey">CodeIt Plus</div>
                    <div className="pa__big">{PRICE_PER_INTERVAL}</div>
                    <p>Unlimited builds, every power, and this page in your inbox every week. Nothing is ever sold to {name} inside the app.</p>
                    {billing?.billingEnabled && billing?.canSubscribe
                      ? <button type="button" className="ci-btn ci-btn--ink" onClick={buy} disabled={busy}>{busy ? 'Opening' : 'Start Plus'}</button>
                      : <Link className="ci-btn ci-btn--ink" to="/pricing">See the plans</Link>}
                  </div>
                )}
                {note && <p className="pa__note" role="status">{note}</p>}
                <Link to="/profile#family-controls" className="pa__row">
                  <span><b>Weekly email</b><small>{child.progressEmailsEnabled ? 'On. This page goes to your inbox each week.' : 'Off. Turn it on in family settings.'}</small></span>
                  <span className="pa__chev" aria-hidden="true">›</span>
                </Link>
                <Link to="/profile#family-controls" className="pa__row">
                  <span><b>Family settings</b><small>Profiles, passwords, who gets the email.</small></span>
                  <span className="pa__chev" aria-hidden="true">›</span>
                </Link>
              </aside>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// ── Signed out: what a week looks like ──────────────────────────────────────
//
// A parent deciding whether to sign in sees the page they would get, built
// from real parts: a real game from the engine, real power names, the real
// price. It is flagged as an example in two places, and it names no child.
export const EXAMPLE_SENTENCE = 'a bunny that catches carrots at night';
const EXAMPLE_POWERS = ['numbers', 'loops'].map((slug) => powerBySlug(slug));
const EXAMPLE_NEXT = powerBySlug('words');

function ParentWelcome() {
  const exampleGame = useMemo(() => recipeGame(localRecipe(EXAMPLE_SENTENCE)), []);
  return (
    <div className="pa">
      <Header />
      <main className="pa__main">
        <div className="ci-ey">For parents</div>
        <h1 className="ci-h1 pa__h1">What your child made this week, in one page.</h1>
        <div className="pa__grid">
          <section className="pa__left">
            <div className="ci-blk ci-blk--paper pa__made pa__example ci-rise">
              <div className="pa__exhead"><span className="ex__tag pa__extag">Example week</span><span className="pa__exnote">Yours shows your own child&apos;s games, words and powers.</span></div>
              <div className="ci-ey">Made</div>
              <div className="ci-frame pa__frame is-lit"><iframe title="Example game" srcDoc={exampleGame} sandbox="allow-scripts" /></div>
              <h2 className="pa__title">Bunny Game</h2>
              <p className="pa__prompt">They typed: <q>{EXAMPLE_SENTENCE}</q></p>
            </div>
            <div className="ci-blk ci-blk--mint pa__learned ci-rise" style={{ animationDelay: '.05s' }}>
              <div className="ci-ey">Learned, in plain words</div>
              <ul>{EXAMPLE_POWERS.map((p) => <li key={p.slug}>{p.name}: {p.does}</li>)}</ul>
              <p className="pa__next">Next: <b>{EXAMPLE_NEXT.name}</b>, {EXAMPLE_NEXT.does}.</p>
            </div>
          </section>
          <aside className="pa__right">
            <div className="ci-blk ci-blk--ink pa__price ci-rise" style={{ animationDelay: '.08s' }}>
              <div className="ci-ey">See your child&apos;s week</div>
              <div className="pa__big pa__big--sm">Sign in with the adult account</div>
              <p>The one your child&apos;s profile is linked to. The same page comes to your inbox each week if you turn the email on.</p>
              <div className="pa__btns">
                <Link className="ci-btn ci-btn--paper" to="/login" state={{ from: '/parent' }}>Sign in</Link>
                <Link className="ci-btn pa__btnline" to="/register" state={{ from: '/parent' }}>Make an account</Link>
              </div>
            </div>
            <div className="pa__promises">
              {[
                ['Nothing is sold to your child', 'Not inside the app, not ever. Plans are for grown-ups, on a page children do not see.'],
                ['Games, not minutes', 'You see what they made and the words they typed, not how long a screen was on.'],
                ['Free stays free', `Lessons, the playground and saving never go behind a plan. Plus is ${PRICE_PER_INTERVAL} if you want more.`],
              ].map(([head, text]) => (
                <div key={head} className="pa__row pa__promise"><span><b>{head}</b><small>{text}</small></span></div>
              ))}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
