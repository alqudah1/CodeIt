// ── Home: what do I do today ────────────────────────────────────────────────
//
// One yellow block, two numbers, the last games, the next thing to learn.
// Yellow is used once, on today's build, so the eye lands there first. The
// streak and XP are big numbers in colour blocks because numbers going up is
// the feeling the page is for. The games row shows the real games, playing.
//
// Signed in: everything comes from GET /api/today (derived, nothing stored).
// A guest: the quest from the same endpoint, the streak and games from the
// shelf in this browser. No number on this page is invented.
//
// The days-in-a-row count is a count and nothing more: it pays no XP, it sends
// no reminder, and it never tells a child to come back. progression.test.js
// keeps it that way.

import { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../Header/Header';
import TabBar from '../../ds/TabBar';
import { API_BASE_URL } from '../../config/api';
import { AuthContext } from '../../context/AuthContext';
import { useSEO } from '../../hooks/useSEO';
import { journeyHeaders } from '../../utils/journey';
import { listProjects as listShelf, migrateLegacyDraft } from '../../utils/projectShelf';
import { LEVELS, levelFor, questFor, streakFrom } from './today';
import { powerStates } from '../Powers/powers';
import { readDone } from '../Powers/PowersMap';
import '../../ds/ds.css';
import './KidHome.css';

const SKY_OF = ['linear-gradient(160deg,#2A1E5C,#5B3FD6)', 'linear-gradient(160deg,#FF7A00,#FFC93C)', 'linear-gradient(160deg,#17C08B,#BFE6FF)', 'linear-gradient(160deg,#FF6B6B,#FFD6E0)'];

export default function KidHome() {
  useSEO({ canonical: 'https://codeitlearn.com/home', title: "Today's build | CodeIt", description: 'Your streak, your games, and the one thing to build today.', robots: 'noindex,nofollow' });
  const { user, token } = useContext(AuthContext);
  const [today, setToday] = useState(null);
  const [codes, setCodes] = useState({});
  const [powersDone, setPowersDone] = useState(null);
  const shelf = useMemo(() => { try { migrateLegacyDraft(localStorage); return listShelf(localStorage); } catch { return []; } }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/today`, { headers: { ...journeyHeaders(), ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const data = res.ok ? await res.json() : null;
        if (alive && data) setToday(data);
      } catch { /* the quest below still shows */ }
    })();
    return () => { alive = false; };
  }, [token]);

  // Signed in: the two newest games are fetched whole so the tiles can play them.
  useEffect(() => {
    if (!user || !token || !today?.games?.length) return undefined;
    let alive = true;
    (async () => {
      const out = {};
      for (const g of today.games.slice(0, 2)) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/builder/projects/${g.id}`, { headers: { Authorization: `Bearer ${token}` } });
          const data = res.ok ? await res.json() : null;
          const code = data?.project?.generated_code;
          if (code) out[g.id] = code;
        } catch { /* a tile without a preview is still a tile */ }
      }
      if (alive) setCodes(out);
    })();
    return () => { alive = false; };
  }, [user, token, today]);

  // Which power is next: the server's list for a signed-in child, merged
  // with what this browser remembers from before the account.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/powers`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        const data = res.ok ? await res.json() : null;
        if (alive) setPowersDone(Array.from(new Set([...(data?.done || []), ...readDone(localStorage)])));
      } catch { if (alive) setPowersDone(readDone(localStorage)); }
    })();
    return () => { alive = false; };
  }, [token]);
  const nextPower = powerStates(powersDone || readDone(localStorage)).find((p) => p.state === 'next');

  const quest = today?.quest || questFor();
  const guest = !user;
  const streakInfo = guest ? streakFrom(shelf.map((p) => p.savedAt)) : { streak: today?.streak || 0, builtToday: !!today?.builtToday };
  const level = guest ? levelFor(0) : (today?.level || levelFor(0));
  const games = guest
    ? shelf.slice(0, 3).map((p) => ({ id: p.id, title: p.title, code: p.code, plays: null, href: `/builder?shelf=${p.id}` }))
    : (today?.games || []).map((g) => ({ id: g.id, title: g.title, code: codes[g.id], plays: g.plays, href: `/builder?project=${g.id}` }));
  const firstName = (user?.name || '').split(' ')[0];
  const weekday = new Date().toLocaleDateString(undefined, { weekday: 'long' });
  const done = streakInfo.builtToday;

  return (
    <div className="kh">
      <Header />
      <main className="kh__main">
        <section className="kh__left">
          <div className="ci-ey">{weekday}</div>
          <h1 className="ci-h1">{firstName ? `Hey ${firstName}.` : 'Hey there.'}</h1>
          <div className={`ci-blk kh__quest ci-rise${done ? ' is-done' : ' ci-blk--sun'}`}>
            <div className="ci-ey kh__qey">{done ? 'Done for today' : "Today's build"}</div>
            <h2 className="kh__qtitle">{done ? 'Done. Build another?' : quest.text}</h2>
            <Link className="ci-btn ci-btn--ink" to={done ? '/build' : `/build?prompt=${encodeURIComponent(quest.prompt)}`}>{done ? 'Build' : 'Build it'}</Link>
            <img className="kh__pix" src="/brand/pixel-mascot-hero.png" alt="" />
          </div>
          <div className="kh__row">
            <div className="ci-blk ci-blk--coral ci-rise" style={{ animationDelay: '.05s' }}>
              <svg className="kh__flame" viewBox="0 0 24 24" aria-hidden="true"><path fill="#FFC93C" d="M12 2c1 4-3 5-3 9a3 3 0 0 0 6 0c0-1.5-.6-2.5-1-3 2 1 4 3.5 4 7a6 6 0 0 1-12 0c0-5 4-7 6-13z" /></svg>
              <div className="ci-num">{streakInfo.streak}</div>
              <div className="ci-cap">days in a row</div>
              <div className="kh__track"><i style={{ width: `${Math.min(100, (streakInfo.streak / 7) * 100)}%` }} /></div>
            </div>
            <div className="ci-blk ci-blk--violet ci-rise" style={{ animationDelay: '.1s' }}>
              <div className="ci-num">{guest ? '0' : level.xp}</div>
              <div className="ci-cap">{guest ? 'XP. Make an account to keep it.' : level.next ? `XP · ${level.toNext} to level ${level.n + 1}` : `XP · Level ${level.n}, ${level.title}`}</div>
              <div className="kh__track"><i style={{ width: `${xpPercent(level)}%` }} /></div>
            </div>
          </div>
        </section>
        <section className="kh__right">
          <h2 className="ci-h2">Your games {typeof today?.plays === 'number' && today.plays > 0 && <small className="kh__plays"><span className="ci-livedot" />{today.plays} plays</small>}</h2>
          <div className="kh__shelf">
            {games.slice(0, 2).map((g, i) => (
              <Link key={g.id} to={g.href} className="kh__tile" style={{ background: SKY_OF[i % SKY_OF.length] }}>
                {g.code && <iframe title={g.title} srcDoc={g.code} sandbox="allow-scripts" tabIndex={-1} />}
                <span className="kh__cap">{g.title}{typeof g.plays === 'number' && <small>{g.plays} plays</small>}</span>
              </Link>
            ))}
            <Link to="/build" className="kh__tile kh__tile--new" aria-label="Make a new game"><span>+</span>New game</Link>
          </div>
          {games.length === 0 && <p className="ci-sub">Nothing here yet. Today's build is the first one.</p>}
          <Link to={nextPower ? `/powers/${nextPower.slug}` : '/powers'} className="kh__row-link ci-rise" style={{ animationDelay: '.15s' }}>
            <span className="kh__ic" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></svg>
            </span>
            <span><b>{nextPower ? `Next power: ${nextPower.name}` : 'Every power learned'}</b><small>{nextPower ? `${nextPower.does.charAt(0).toUpperCase()}${nextPower.does.slice(1)}, inside your own game. Three minutes.` : 'Twelve of twelve. Build with all of them.'}</small></span>
            <span className="kh__chev" aria-hidden="true">›</span>
          </Link>
          {guest && (
            <Link to="/join" className="kh__row-link ci-rise" style={{ animationDelay: '.2s' }}>
              <span className="kh__ic kh__ic--mint" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="12" rx="2" /><path d="M8 21h8M12 17v4M7 10h4M7 13h7" /></svg>
              </span>
              <span><b>In a class? Join it</b><small>Type the code on the board and your first name.</small></span>
              <span className="kh__chev" aria-hidden="true">›</span>
            </Link>
          )}
          {guest && (
            <Link to="/register" className="kh__row-link ci-rise" style={{ animationDelay: '.25s' }}>
              <span className="kh__ic kh__ic--sun" aria-hidden="true">★</span>
              <span><b>Keep your games for good</b><small>A free account keeps them on every device and lets you share them.</small></span>
              <span className="kh__chev" aria-hidden="true">›</span>
            </Link>
          )}
        </section>
      </main>
      <TabBar />
    </div>
  );
}

/** How far through the current level, 0 to 100. */
export function xpPercent(level) {
  if (!level?.next) return 100;
  const base = (LEVELS.find((l) => l.n === level.n) || LEVELS[0]).at;
  return Math.max(0, Math.min(100, ((level.xp - base) / (level.next - base)) * 100));
}
