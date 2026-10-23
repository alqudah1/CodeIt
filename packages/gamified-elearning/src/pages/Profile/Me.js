// ── Me: the trophy room ─────────────────────────────────────────────────────
//
// What a child sees under the Me tab: their look and name, three numbers
// that are all real (days in a row, XP, games made), the twelve powers with
// the next one lit, the medal case, their games, and the look. Every number
// comes from /api/today and /api/powers, the same sources Home reads, so the
// two pages never disagree. The grown-up things (parent updates, password,
// sign out) sit behind one Settings chip, on the page that already does them.

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import CharacterAvatar from '../../components/CharacterAvatar/CharacterAvatar';
import { useCharacterDisplay } from '../../context/CharacterContext';
import { API_BASE_URL } from '../../config/api';
import { useSEO } from '../../hooks/useSEO';
import Header from '../Header/Header';
import TabBar from '../../ds/TabBar';
import ExampleCards from '../../ds/Examples';
import { levelFor } from '../Home/today';
import { xpPercent } from '../Home/KidHome';
import { POWERS, powerStates } from '../Powers/powers';
import { readDone } from '../Powers/PowersMap';
import { MEDALS, medalsFrom } from './medals';
import '../../ds/ds.css';
import './Me.css';

export default function Me({ user, token, trophies = [], projectCount = null, logout }) {
  useSEO({ canonical: 'https://codeitlearn.com/profile', title: 'Me | CodeIt', description: 'Your powers, your games, your look.', robots: 'noindex,nofollow' });
  const { character } = useCharacterDisplay();
  const [today, setToday] = useState(null);
  const [powersDone, setPowersDone] = useState(null);

  useEffect(() => {
    let alive = true;
    const headers = { Authorization: `Bearer ${token}` };
    (async () => {
      try {
        const [t, p] = await Promise.all([
          fetch(`${API_BASE_URL}/api/today`, { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch(`${API_BASE_URL}/api/powers`, { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        ]);
        if (!alive) return;
        if (t) setToday(t);
        setPowersDone(Array.from(new Set([...(p?.done || []), ...readDone(localStorage)])));
      } catch { /* the page shows what it has */ }
    })();
    return () => { alive = false; };
  }, [token]);

  const level = today?.level || levelFor(0);
  const streak = today?.streak || 0;
  const games = today?.games || [];
  const gameCount = projectCount !== null && projectCount !== undefined ? Number(projectCount) || 0 : games.length;
  const states = useMemo(() => powerStates(powersDone || readDone(localStorage)), [powersDone]);
  const doneCount = states.filter((s) => s.state === 'done').length;
  const medals = medalsFrom(trophies);
  const firstName = (user?.name || user?.username || '').split(' ')[0];

  return (
    <div className="me">
      <Header />
      <main className="me__main">
        <section className="me__left">
          <div className="me__hero ci-rise">
            <Link to="/character" className="me__avatar ci-blk ci-blk--sun" aria-label="Change your look">
              <CharacterAvatar character={character} size={88} />
            </Link>
            <div>
              <div className="ci-ey">Me</div>
              <h1 className="ci-h1 me__name">{firstName || 'You'}</h1>
              <div className="me__level">Level {level.n} · {level.title}</div>
            </div>
            <Link to="/profile?settings=1" className="ci-chip me__settings">Settings</Link>
          </div>

          <div className="me__nums">
            <div className="ci-blk ci-blk--coral ci-rise" style={{ animationDelay: '.05s' }}>
              <div className="ci-num">{streak}</div>
              <div className="ci-cap">days in a row</div>
            </div>
            <div className="ci-blk ci-blk--violet ci-rise" style={{ animationDelay: '.1s' }}>
              <div className="ci-num">{level.xp}</div>
              <div className="ci-cap">{level.next ? `XP · ${level.toNext} to level ${level.n + 1}` : `XP · ${level.title}`}</div>
              <div className="me__track"><i style={{ width: `${xpPercent(level)}%` }} /></div>
            </div>
            <div className="ci-blk ci-blk--ink ci-rise" style={{ animationDelay: '.15s' }}>
              <div className="ci-num">{gameCount}</div>
              <div className="ci-cap">{gameCount === 1 ? 'game made' : 'games made'}</div>
            </div>
          </div>

          <div className="me__sec">
            <h2 className="ci-h2">Powers <small>{doneCount} of {POWERS.length}</small></h2>
            <div className="me__powers">
              {states.map((p) => {
                const cls = `me__power ${p.state === 'done' ? 'is-done' : p.state === 'next' ? 'is-next' : 'is-later'}`;
                return p.state === 'later'
                  ? <div key={p.slug} className={cls}><b>{p.n}</b>{p.name}</div>
                  : <Link key={p.slug} to={`/powers/${p.slug}`} className={cls}><b>{p.n}</b>{p.name}{p.state === 'next' && <span aria-hidden="true">›</span>}</Link>;
              })}
            </div>
          </div>

          <div className="me__sec">
            <h2 className="ci-h2">Medals <small>{medals.length} of {MEDALS.length}</small></h2>
            <p className="ci-sub me__how">A medal is yours once you have explained that idea inside a game you made.</p>
            <div className="me__medals">
              {MEDALS.map((m) => {
                const won = medals.find((w) => w.id === m.id);
                return (
                  <div key={m.id} className={`me__medal${won ? ' is-won' : ''}`} title={won ? `in ${won.projectTitle}` : 'Not yet'}>
                    <span className="me__disc" aria-hidden="true">{won ? '★' : '?'}</span>
                    <span>{m.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="me__right">
          <h2 className="ci-h2">Your games {typeof today?.plays === 'number' && today.plays > 0 && <small><span className="ci-livedot" />{today.plays} plays</small>}</h2>
          {games.length === 0 && <p className="ci-sub">Nothing here yet. <Link to="/build">Build the first one</Link>.</p>}
          <div className="me__games">
            {games.map((g) => (
              <Link key={g.id} to={`/builder?project=${g.id}`} className="me__game ci-blk ci-blk--paper">
                <b>{g.title}</b>
                <small>{typeof g.plays === 'number' ? `${g.plays} ${g.plays === 1 ? 'play' : 'plays'}` : ''}{g.publicId ? ' · in the arcade' : ''}</small>
              </Link>
            ))}
          </div>
          <Link to="/build" className="ci-btn ci-btn--ink me__build">Build a new one</Link>
          {games.length < 3 && <ExampleCards from={8} count={4} title="Ideas to try next" note="Examples. Tap one to build it." />}

          <Link to="/character" className="me__row ci-rise">
            <span className="me__rowav"><CharacterAvatar character={character} size={40} /></span>
            <span><b>Your look</b><small>Colours and shape. Unlocked by level, never bought.</small></span>
            <span className="me__chev" aria-hidden="true">›</span>
          </Link>
          <Link to="/profile?settings=1" className="me__row ci-rise">
            <span className="me__rowic" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>
            </span>
            <span><b>Grown-ups</b><small>Parent updates, your password, sign out.</small></span>
            <span className="me__chev" aria-hidden="true">›</span>
          </Link>
          {logout && <button type="button" className="me__signout" onClick={logout}>Sign out</button>}
        </section>
      </main>
      <TabBar />
    </div>
  );
}
