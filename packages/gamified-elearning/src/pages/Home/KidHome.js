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
import CharacterAvatar from '../../components/CharacterAvatar/CharacterAvatar';
import { useCharacterDisplay } from '../../context/CharacterContext';
import { Link } from 'react-router-dom';
import Header from '../Header/Header';
import TabBar from '../../ds/TabBar';
import ExampleCards from '../../ds/Examples';
import { API_BASE_URL } from '../../config/api';
import { AuthContext } from '../../context/AuthContext';
import { useSEO } from '../../hooks/useSEO';
import { journeyHeaders } from '../../utils/journey';
import { listProjects as listShelf, migrateLegacyDraft } from '../../utils/projectShelf';
import { LEVELS, levelFor, questFor, streakFrom } from './today';
import PythonQuest from './PythonQuest';
import ProgressPanel, { levelPercent } from './ProgressPanel';
import { minutesToday } from '../../utils/minutesToday';
import { pythonQuestFor } from './pythonQuests';
import { powerStates } from '../Powers/powers';
import { readDone } from '../Powers/PowersMap';
import '../../ds/ds.css';
import '../../ds/night.css';
import './KidHome.css';

const SKY_OF = ['linear-gradient(160deg,#2A1E5C,#5B3FD6)', 'linear-gradient(160deg,#FF7A00,#FFC93C)', 'linear-gradient(160deg,#17C08B,#BFE6FF)', 'linear-gradient(160deg,#FF6B6B,#FFD6E0)'];

export default function KidHome() {
  useSEO({ canonical: '/home', title: "Today's build | CodeIt", description: 'Your streak, your games, and the one thing to build today.', robots: 'noindex,nofollow' });
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
  const { character } = useCharacterDisplay();
  // Today's three goals, each its own fact from the server. A guest's game
  // goal is the shelf's; the other two need an account to be known.
  const pyDone = Boolean(today?.pythonQuest?.done);
  const goals = [
    { id: 'game', label: "Build today's game", done: guest ? streakInfo.builtToday : Boolean(today?.gameToday), xp: null, to: done ? '/build' : `/build?prompt=${encodeURIComponent(quest.prompt)}` },
    { id: 'python', label: "Today's Python quest", done: pyDone, xp: today?.pythonQuest?.xp || 15, to: '#today-python' },
    { id: 'lesson', label: 'Finish a lesson on the map', done: Boolean(today?.lessonToday), xp: 50, to: '/lessons' },
  ];
  const goalsDone = goals.filter((g) => g.done).length;

  return (
    <div className={`kh night kh--night${games.length ? ' kh--has-games' : ''}`}>
      <Header />
      <main className="kh__main">
        <section className="kh__left">
          {/* The top of a game screen: who you are, your level, your streak,
              your XP. On a phone this stands in for the site header. */}
          <header className="kh__hud">
            <Link
              to={guest ? '/register' : '/character'}
              className="kh__hud-avatar"
              aria-label={guest ? 'Make an account' : 'Change your look'}
              style={{ '--ring': `${guest ? 0 : levelPercent(level)}%` }}
            >
              <CharacterAvatar character={character} size={52} />
              <span className="kh__hud-lv" aria-hidden="true">{level.n}</span>
            </Link>
            <div className="kh__hud-who">
              <div className="ci-ey">{weekday}</div>
              <h1 className="ci-h1">{firstName ? `Hey ${firstName}.` : 'Hey there.'}</h1>
              {guest ? <div className="kh__hud-note"><Link to="/register">Make an account</Link> to keep your XP.</div> : <div className="kh__hud-note">Level {level.n} {level.title}{level.next ? ` · ${level.next - level.xp} XP to level ${level.n + 1}` : ''}</div>}
            </div>
            <div className="kh__hud-chips" aria-label="Your streak and XP">
              <span className={`kh__chip kh__chip--streak${streakInfo.streak > 0 ? ' is-lit' : ''}`} title="Days in a row">
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M12 2c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9Z" fill="currentColor" /></svg>
                {streakInfo.streak}
              </span>
              <span className="kh__chip kh__chip--xp" title="XP">
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7z" fill="currentColor" /></svg>
                {guest ? 0 : level.xp}
              </span>
            </div>
          </header>

          {/* Today's goals: three things a day can hold, ticked as they are
              done. One of them keeps the streak; all three is a full day. */}
          <section className="ci-blk kh__goals ci-rise" aria-labelledby="kh-goals-title">
            <div className="kh__goals-head">
              <div>
                <div className="ci-ey">Today's goals</div>
                <h2 id="kh-goals-title" className="kh__goals-title">{goalsDone === 3 ? 'A full day. Nice.' : goalsDone > 0 ? 'Today counts.' : 'Do one and today counts.'}</h2>
              </div>
              <span className="kh__goals-count" aria-label={`${goalsDone} of 3 done`}>{goalsDone}<small>/3</small></span>
            </div>
            <div className="kh__goals-bar" aria-hidden="true"><i style={{ width: `${(goalsDone / 3) * 100}%` }} /></div>
            <ol className="kh__goal-list">
              {goals.map((g) => (
                <li key={g.id} className={`kh__goal${g.done ? ' is-done' : ''}`}>
                  <span className="kh__goal-check" aria-hidden="true">{g.done ? '✓' : ''}</span>
                  {g.done ? <span className="kh__goal-label">{g.label}</span> : <Link className="kh__goal-label" to={g.to}>{g.label}</Link>}
                  {g.xp && !g.done && <span className="kh__goal-xp">+{g.xp} XP</span>}
                  {g.done && <span className="kh__goal-xp is-done">Done</span>}
                </li>
              ))}
            </ol>
          </section>
          <div className={`ci-blk kh__quest ci-rise${done ? ' is-done' : ' ci-blk--sun'}`} style={{ animationDelay: '.08s' }}>
            <span className="kh__spark kh__spark--a" aria-hidden="true" /><span className="kh__spark kh__spark--b" aria-hidden="true" /><span className="kh__spark kh__spark--c" aria-hidden="true" />
            <div className="ci-ey kh__qey">{done ? 'Done for today' : "Today's build"}</div>
            <h2 className="kh__qtitle">{done ? 'Done. Build another?' : quest.text}</h2>
            <Link className="ci-btn ci-btn--ink" to={done ? '/build' : `/build?prompt=${encodeURIComponent(quest.prompt)}`}>{done ? 'Build' : 'Build it'}</Link>
            <img className="kh__pix" src="/brand/pixel-mascot-hero.png" alt="" />
          </div>
          {/* Two minutes of real Python, every day, under the game quest. The
              server's copy says whether it is done; before it answers, or for a
              guest, the bank's quest for today. */}
          <div id="today-python" />
          <PythonQuest
            quest={today?.pythonQuest || { ...pythonQuestFor(), done: false }}
            token={token}
            onDone={(data) => setToday((prev) => (prev ? { ...prev, builtToday: true, streak: data.streak ?? prev.streak, level: data.level || prev.level, pythonQuest: { ...(prev.pythonQuest || {}), done: true } } : prev))}
          />
          {/* One panel, every number real: level and course from the server,
              streak from the server or the shelf, minutes from this device. */}
          <ProgressPanel
            level={level}
            streak={streakInfo.streak}
            minutes={minutesToday()}
            lessonsDone={guest ? 0 : (today?.lessonsDone || 0)}
            guest={guest}
          />
          {games.length < 3 && <ExampleCards className="kh__examples" from={0} count={4} title={games.length ? 'More to try' : 'Ideas to build'} note="Examples. Tap one and it is playing in two seconds." />}
        </section>
        <section className="kh__right">
          <h2 className="ci-h2">Your games {typeof today?.plays === 'number' && today.plays > 0 && <small className="kh__plays"><span className="ci-livedot" />{today.plays === 1 ? '1 play' : `${today.plays} plays`}</small>}</h2>
          <div className="kh__shelf">
            {games.slice(0, 2).map((g, i) => (
              <Link key={g.id} to={g.href} className="kh__tile">
                <span className="kh__screen" style={{ background: SKY_OF[i % SKY_OF.length] }} aria-hidden="true">
                  {g.code && <iframe title={g.title} srcDoc={g.code} sandbox="allow-scripts" tabIndex={-1} />}
                </span>
                <span className="kh__cap">{g.title}{g.plays > 0 && <small>{g.plays === 1 ? '1 play' : `${g.plays} plays`}</small>}</span>
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
