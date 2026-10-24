// ── /powers/:slug: three minutes inside your own game ───────────────────────
//
// The child's newest game is rebuilt with the current engine and shown on
// the right. On the left, the settings block with one line lit. Step one:
// change the lit value and run. Step two: change it again. The check: the
// light goes out, the whole block is yours to type in, and the server runs
// the same rule the page did. Pass and the power is green on the map and the
// line stays on in the game you take to Build.
//
// Nothing here is a quiz question. Every step is the game changing.

import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import { useSEO } from '../../hooks/useSEO';
import { journeyHeaders } from '../../utils/journey';
import { listProjects as listShelf, migrateLegacyDraft } from '../../utils/projectShelf';
import { recipeGame, recipePowers, recipeSettings } from '../Builder/recipeGame';
import { localRecipe } from '../Build/recipeLocal';
import Header from '../Header/Header';
import TabBar from '../../ds/TabBar';
import { POWERS, POWER_XP, passes, powerBySlug, powerStates, readSettings, stepFor, writeSetting } from './powers';
import { rememberDone } from './PowersMap';
import '../../ds/ds.css';
import './Powers.css';

/** The recipe a game's settings describe, so the current engine can rebuild it. */
export function recipeFromSettings(s) {
  return {
    kind: s.gameKind, title: s.gameTitle, player: s.playerLook, enemy: s.enemyLook, treasure: s.treasure, sky: s.skyLook,
    speed: s.speed, lives: s.startLives, winAt: s.winAt, twist: s.twist,
    waveSize: s.waveSize, pointsPer: s.pointsPer, speedUpEvery: s.speedUpEvery, soundOn: s.soundOn, levelEvery: s.levelEvery, bossAt: s.bossAt,
  };
}

/** The code block a child sees: the settings and the powers, nothing else. */
export function codeFor(recipe) {
  return `${recipeSettings(recipe)}\n\n${recipePowers(recipe)}`;
}

export const LINE_RE = /^(\s*let\s+([A-Za-z_]\w*)\s*=\s*)('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|true|false|-?\d+(?:\.\d+)?)(\s*;.*)$/;

export default function Power() {
  const { slug } = useParams();
  const power = powerBySlug(slug);
  const navigate = useNavigate();
  const { user, token, loading: authLoading } = useContext(AuthContext);
  useSEO({ canonical: `/powers/${slug}`, title: power ? `${power.name} | CodeIt` : 'Powers | CodeIt', description: power ? `${power.name}: ${power.does}, inside your own game.` : '', robots: 'noindex,nofollow' });

  const [code, setCode] = useState('');          // the block as it stands
  const [startCode, setStartCode] = useState(''); // the block as the power found it
  const [stepStart, setStepStart] = useState(''); // the block when this step began
  const [step, setStep] = useState(0);            // 0, 1 are the steps, 2 is the check
  const [runs, setRuns] = useState(0);
  const [misses, setMisses] = useState(0);
  const [say, setSay] = useState('');
  const [result, setResult] = useState(null);
  const [gameTitle, setGameTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const frameRef = useRef(null);
  const codeRef = useRef('');
  codeRef.current = code;

  // A new power on the same page starts from the game as it now stands.
  useEffect(() => {
    setStep(0); setRuns(0); setMisses(0); setSay(''); setResult(null);
    if (codeRef.current) { setStartCode(codeRef.current); setStepStart(codeRef.current); }
  }, [slug]);

  // The game to work on: the newest one this child made, or a fresh one.
  // Waits for the session to be read, and never replaces a block the child
  // has started changing.
  const touched = useRef(false);
  useEffect(() => {
    if (authLoading) return undefined;
    let alive = true;
    (async () => {
      let html = null;
      try {
        if (user && token) {
          const res = await fetch(`${API_BASE_URL}/api/today`, { headers: { Authorization: `Bearer ${token}` } });
          const data = res.ok ? await res.json() : null;
          const g = data?.games?.[0];
          if (g) {
            const one = await fetch(`${API_BASE_URL}/api/builder/projects/${g.id}`, { headers: { Authorization: `Bearer ${token}` } });
            const d = one.ok ? await one.json() : null;
            html = d?.project?.generated_code || null;
          }
        } else {
          migrateLegacyDraft(localStorage);
          html = listShelf(localStorage)[0]?.code || null;
        }
      } catch { /* a fresh game is a fine place to learn */ }
      if (!alive || touched.current) return;
      const settings = html ? readSettings(html) : {};
      const recipe = settings.gameKind ? recipeFromSettings(settings) : localRecipe('a ship that shoots the asteroids');
      const block = codeFor(recipe);
      setCode(block); setStartCode(block); setStepStart(block); setGameTitle(recipe.title);
    })();
    return () => { alive = false; };
  }, [user, token, authLoading]);

  const settings = useMemo(() => readSettings(code), [code]);
  const gameHtml = useMemo(() => (settings.gameKind ? recipeGame(recipeFromSettings(settings)) : ''), [settings]);
  const lines = useMemo(() => code.split('\n'), [code]);
  const current = step < 2 && power ? stepFor(power, step, readSettings(stepStart)[power.key]) : null;

  const run = useCallback(() => {
    setRuns((r) => r + 1);
    if (step < 2 && power) {
      const now = readSettings(code)[power.key], before = readSettings(stepStart)[power.key];
      if (now !== before) {
        setStep(step + 1); setStepStart(code); setSay('');
      } else {
        setSay(`Change the lit number first. It still says ${JSON.stringify(before)}.`);
      }
    }
  }, [code, power, step, stepStart]);

  const setValue = (raw) => {
    if (!power) return;
    const was = readSettings(code)[power.key];
    let value = raw;
    if (typeof was === 'number') { value = raw === '' || raw === '-' ? 0 : Number(raw); if (!Number.isFinite(value)) return; }
    else if (typeof was === 'boolean') value = raw === 'true';
    touched.current = true;
    setCode(writeSetting(code, power.key, value));
  };

  const check = async () => {
    if (!power || busy) return;
    setBusy(true); setSay('');
    const ok = passes(power, code, startCode);
    if (!ok) {
      const n = misses + 1; setMisses(n);
      setSay(n >= 3 ? `${power.check.say} The line starts with "let ${power.key}". Fill it in for me is below.` : n === 2 ? `Not yet. Find the line that starts with "let ${power.key}".` : `Not yet. ${power.check.say}`);
      setBusy(false);
      return;
    }
    let xp = 0; let first = true;
    try {
      const res = await fetch(`${API_BASE_URL}/api/powers/${power.slug}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...journeyHeaders(), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ code, before: startCode }),
      });
      const data = res.ok ? await res.json() : null;
      if (data?.passed) { xp = data.xp || 0; first = data.first !== false; }
    } catch { /* the browser remembers it below */ }
    const done = rememberDone(localStorage, power.slug);
    const next = powerStates(done).find((p) => p.state === 'next');
    setResult({ xp, first, next });
    setBusy(false);
  };

  const fillIn = () => {
    if (!power) return;
    const was = readSettings(code)[power.key];
    setCode(writeSetting(code, power.key, stepFor(power, 0, was).to));
    setSay('');
  };

  if (!power) {
    return (
      <div className="pw"><Header /><main className="pw__main"><h1 className="ci-h1">No power has that name.</h1><Link className="ci-btn ci-btn--ink" to="/powers">The powers</Link></main><TabBar /></div>
    );
  }

  const title = `${power.name}. ${power.does.charAt(0).toUpperCase()}${power.does.slice(1)}.`;
  return (
    <div className="pw">
      <Header />
      <main className="pw__lesson">
        <section className="pw__left">
          <div className="pw__top">
            <Link to="/powers" className="ci-ey pw__back">Power {power.n} of {POWERS.length}</Link>
            <div className="pw__track" aria-hidden="true"><i style={{ width: `${((Math.min(step, 2)) / 3) * 100 + 8}%` }} /></div>
          </div>
          <h1 className="ci-h1 pw__h1">{title}</h1>
          <p className="ci-sub pw__intro">{power.intro}</p>

          <div className={`ci-blk ci-blk--sun pw__step${step === 2 ? ' is-check' : ''}`}>
            <div className="ci-ey">{step === 2 ? 'The check' : `Step ${step + 1} of 3`}</div>
            <p className="pw__say">{step === 2 ? power.check.say : current.say}</p>
          </div>

          <div className="pw__code">
            {step < 2 ? lines.map((line, i) => {
              const m = LINE_RE.exec(line);
              const lit = m && m[2] === power.key;
              if (!lit) return <div key={i} className={`pw__line${m ? '' : ' is-cm'}`}>{line || ' '}</div>;
              const raw = m[3];
              const quoted = raw[0] === "'" || raw[0] === '"';
              const shown = quoted ? raw.slice(1, -1) : raw;
              return (
                <div key={i} className="pw__line is-lit">
                  <span>{m[1]}{quoted ? "'" : ''}</span>
                  <input className="pw__val" value={shown} onChange={(e) => setValue(e.target.value)} size={Math.max(2, shown.length + 1)} aria-label={`Value of ${m[2]}`} spellCheck={false} autoComplete="off" />
                  <span>{quoted ? "'" : ''}{m[4]}</span>
                </div>
              );
            }) : (
              <textarea className="pw__editor" value={code} onChange={(e) => { touched.current = true; setCode(e.target.value); }} spellCheck={false} aria-label="Your game's settings" rows={lines.length + 1} />
            )}
          </div>

          <div className="pw__engine ci-blk ci-blk--ink">
            <div className="ci-ey">Where the game reads it</div>
            <pre>{power.engine}</pre>
          </div>
        </section>

        <section className="pw__right">
          <div className="pw__gamehead"><span className="ci-livedot" />{gameTitle || 'Your game'}</div>
          <div className={`ci-frame pw__frame${runs > 0 ? ' is-lit' : ''}`}>
            {gameHtml && <iframe ref={frameRef} key={runs} title={gameTitle} srcDoc={gameHtml} sandbox="allow-scripts" />}
          </div>
          <div className="pw__actions">
            {step < 2 ? (
              <button type="button" className="ci-btn ci-btn--ink" onClick={run}>Run it</button>
            ) : (
              <button type="button" className="ci-btn ci-btn--ink" onClick={check} disabled={busy}>{busy ? 'Checking' : 'Check it'}</button>
            )}
            <button type="button" className="ci-btn ci-btn--paper" onClick={() => setRuns((r) => r + 1)}>Run again</button>
            {step === 2 && misses >= 3 && <button type="button" className="ci-chip" onClick={fillIn}>Fill it in for me</button>}
          </div>
          {say && <p className="pw__hint" role="status">{say}</p>}
        </section>
      </main>

      {result && (
        <div className="pw__sheet" role="dialog" aria-label={`${power.name} unlocked`}>
          <div className="pw__sheetin ci-blk ci-blk--mint ci-popin">
            <div className="ci-ey">Power {power.n}</div>
            <h2>{power.name} unlocked.</h2>
            <p>{result.first ? (result.xp > 0 ? `+${result.xp} XP. ` : user ? '' : `${POWER_XP} XP when you have an account. `) : 'You had it already. '}Your game can {power.does} now.</p>
            <div className="pw__sheetbtns">
              {result.next ? <button type="button" className="ci-btn ci-btn--ink" onClick={() => navigate(`/powers/${result.next.slug}`)}>Next: {result.next.name}</button> : <Link className="ci-btn ci-btn--ink" to="/powers">All twelve</Link>}
              <Link className="ci-btn ci-btn--paper" to="/build">Build with it</Link>
            </div>
          </div>
        </div>
      )}
      <TabBar />
    </div>
  );
}
