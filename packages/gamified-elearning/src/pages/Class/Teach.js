// ── /teach and /teach/:code: the class, the code, the board ─────────────────
//
// /teach lists the classes you own and makes a new one with a name. /teach/
// :code is the board: the code in letters the back row can read, the join
// address, and a tile per child with how many games they have made and their
// newest one. "Projector" strips the page down to the code and the tiles and
// refreshes every few seconds; press a child's published game and it plays
// on the big screen. Nothing on the board is more than a first name, a count
// and a title.

import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import { useSEO } from '../../hooks/useSEO';
import { reportFailure } from '../../utils/humanError';
import { POWERS } from '../Powers/powers';
import { BOARD_SENTENCE, PLANS } from './lessonPlans';
import ExampleCards, { EXAMPLES } from '../../ds/Examples';
import Offline, { OfflineStrip, Waiting, isUnreachable, useRetry, whyUnreachable } from '../../ds/Offline';
import Header from '../Header/Header';
import TabBar from '../../ds/TabBar';
import '../../ds/ds.css';
import './Class.css';

const SITE = 'codeitlearn.com';
const POLL_MS = 8000;

/** ROCKET42 as "ROCKET 42", so the word and the number read separately. */
export function spaceCode(code) {
  const m = /^([A-Z]+)([0-9]{2})$/.exec(String(code || ''));
  return m ? `${m[1]} ${m[2]}` : String(code || '');
}

/** Three numbers for the room: who has a game, who is still at it, who has been at it too long. */
export const STUCK_AFTER_MS = 10 * 60 * 1000;
export function roomNumbers(members, now = Date.now()) {
  const made = members.filter((m) => m.games > 0);
  const notYet = members.filter((m) => m.games === 0);
  const stuck = notYet.filter((m) => m.joinedAt && now - new Date(m.joinedAt).getTime() >= STUCK_AFTER_MS);
  return { made: made.length, building: notYet.length - stuck.length, stuck };
}

/** How long ago, in classroom words. */
export function ago(iso, now = Date.now()) {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}

function NotSetUp() {
  return (
    <div className="ci-blk ci-blk--paper cl__card">
      <div className="ci-ey">Classes</div>
      <h1 className="ci-h1 cl__title">Not switched on here yet.</h1>
      <p className="ci-sub">The class tables have not been created on this site. The site owner runs the classes migration once, and this page comes alive.</p>
    </div>
  );
}

// The four steps and the plans: the landing shows them before sign-in, and a
// teacher with no class yet sees them under the box that makes one, so the
// page says what happens next instead of ending at "No classes yet".
const STEPS = [
  ['1', 'Make a class', 'Name it, and the code appears in letters the back row can read.'],
  ['2', 'Children type the code', 'At codeitlearn.com/join, with a first name. They are building within the minute.'],
  ['3', 'The projector fills', 'Each published game becomes a tile. Press one and it plays on the big screen.'],
  ['4', 'Then a power', 'Twelve powers, one per lesson, each changing a line in the game they just made.'],
];
function TeachSteps({ title }) {
  return (
    <>
      {title && <h2 className="ci-h2 tl__stepshead">{title}</h2>}
      <section className="tl__steps">
        {STEPS.map(([n, head, text], i) => (
          <div key={n} className="ci-blk ci-blk--paper tl__step ci-rise" style={{ animationDelay: `${0.04 * i}s` }}>
            <b className="tl__n">{n}</b>
            <strong>{head}</strong>
            <span>{text}</span>
          </div>
        ))}
      </section>
    </>
  );
}
function TeachPlans({ title = 'Twelve lesson plans, ready to read aloud' }) {
  return (
    <section className="tl__plans">
      <div className="tl__planshead">
        <h2 className="ci-h2">{title}</h2>
        <Link className="ci-chip" to="/teach/plans">All twelve</Link>
      </div>
      <div className="tl__planlist">
        {PLANS.slice(0, 6).map((plan) => (
          <Link key={plan.slug} to={`/teach/plans/${plan.slug}`} className="ci-blk ci-blk--paper tl__plan">
            <span className="tl__plann">{plan.n}</span>
            <b>{plan.title}</b>
            <small>On the board: {plan.sentence}</small>
          </Link>
        ))}
      </div>
    </section>
  );
}

function SignIn() {
  return (
    <div className="tl">
      <section className="tl__hero">
        <div className="ci-blk ci-blk--paper cl__card tl__intro ci-rise">
          <div className="ci-ey">Teach with CodeIt</div>
          <h1 className="ci-h1 cl__title">Make a class. Read out the code. Watch the games appear.</h1>
          <p className="ci-sub">Sign in with your own account to make a class. Children join with the code and a first name, nothing else: no email, no password, no age screen.</p>
          <div className="tl__btns">
            <Link className="ci-btn ci-btn--ink" to="/login" state={{ from: '/teach' }}>Sign in</Link>
            <Link className="ci-btn ci-btn--paper" to="/register" state={{ from: '/teach' }}>Make an account</Link>
          </div>
        </div>
        <div className="ci-blk ci-blk--ink tl__board ci-rise" style={{ animationDelay: '.06s' }} aria-label="Example of the projector board">
          <div className="tl__boardtop">
            <span className="ex__tag tl__tag">Example</span>
            <span className="tl__code">ROCKET 42</span>
            <span className="tl__where">{SITE}/join</span>
          </div>
          <p className="tl__boardline">What the projector fills with, one tile a game, as children publish.</p>
          <ExampleCards from={0} count={4} link={false} />
        </div>
      </section>

      <TeachSteps />
      <TeachPlans />
    </div>
  );
}

// ── /teach ──────────────────────────────────────────────────────────────────
// The codes are what a teacher needs on Monday morning, so the last list this
// device saw is kept, and shown with its age when CodeIt cannot be reached.
export const CLASSES_KEY = 'codeit.classes.v1';
export function readSavedClasses(store, uid) {
  try {
    const saved = JSON.parse(store.getItem(`${CLASSES_KEY}.${uid}`) || 'null');
    return saved && Array.isArray(saved.classes) && saved.at ? saved : null;
  } catch { return null; }
}
export function saveClasses(store, uid, classes, at = new Date().toISOString()) {
  try { store.setItem(`${CLASSES_KEY}.${uid}`, JSON.stringify({ at, classes: classes.map((c) => ({ code: c.code, name: c.name, members: c.members })) })); } catch { /* the list still shows */ }
}

function MyClasses({ token, uid }) {
  const navigate = useNavigate();
  const [classes, setClasses] = useState(null);
  const [ready, setReady] = useState(true);
  const [failed, setFailed] = useState(false);
  const [saved, setSaved] = useState(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/class/mine`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json().catch(() => ({}));
      if (!alive.current) return;
      if (res.status === 503 && data.ready === false) { setReady(false); return; }
      if (!res.ok || !Array.isArray(data.classes)) throw new Error(`classes ${res.status}`);
      setClasses(data.classes); setFailed(false); setSaved(null);
      saveClasses(localStorage, uid, data.classes);
    } catch (err) {
      console.error('class/mine:', err);
      if (!alive.current) return;
      const last = readSavedClasses(localStorage, uid);
      setSaved(last);
      setClasses((c) => c || (last ? last.classes : null));
      setFailed(true);
    }
  }, [token, uid]);
  useEffect(() => { load(); }, [load]);
  useRetry(load, failed);

  async function create(e) {
    e.preventDefault();
    if (busy || name.trim().length < 2) return;
    setBusy(true); setError('');
    let res = null;
    try {
      res = await fetch(`${API_BASE_URL}/api/class`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 503 && data.ready === false) { setReady(false); return; }
      if (!res.ok) throw new Error(data.error || 'Could not make the class.');
      navigate(`/teach/${data.class.code}`);
    } catch (err) {
      setError(isUnreachable(err, res && !res.ok ? res : null)
        ? `${whyUnreachable()} The class was not made yet. Try again in a moment.`
        : reportFailure('class/create', err, 'Could not make the class. Try again.'));
    } finally { setBusy(false); }
  }

  if (!ready) return <NotSetUp />;
  return (
    <>
      <div className="ci-ey">Teach</div>
      <h1 className="ci-h1">Your classes</h1>
      <p className="ci-sub"><Link to="/teach/plans">Twelve lesson plans</Link>, one per power, 45 minutes each.</p>
      {failed && (
        <Offline
          onRetry={load}
          title={saved ? 'Your class codes, saved on this device.' : 'Your classes cannot load right now.'}
          detail={saved
            ? `Saved ${ago(saved.at)}. Read them out as normal: children can join as soon as the connection is back.`
            : 'Your classes are safe. This page tries again by itself every 15 seconds.'}
        />
      )}
      <form className="ci-blk ci-blk--sun cl__new ci-rise" onSubmit={create}>
        <label className="cl__field">
          <span>New class</span>
          <input className="cl__name" value={name} onChange={(e) => setName(e.target.value.slice(0, 60))} placeholder="Year 5, Tuesday club, Room 12" aria-label="Class name" />
        </label>
        <button type="submit" className="ci-btn ci-btn--ink" disabled={busy || name.trim().length < 2}>{busy ? 'Making' : 'Make the class'}</button>
        {error && <p className="cl__err" role="alert">{error}</p>}
      </form>
      {classes === null && !failed && <Waiting what="your classes" />}
      {classes && classes.length === 0 && !failed && <p className="ci-sub cl__none">No classes yet. Name one above and you get a code to read out.</p>}
      <div className="cl__list">
        {(classes || []).map((c, i) => (
          <Link key={c.code} to={`/teach/${c.code}`} className="ci-blk ci-blk--paper cl__item ci-rise" style={{ animationDelay: `${0.05 * (i + 1)}s` }}>
            <span className="cl__itemcode">{spaceCode(c.code)}</span>
            <span className="cl__itemname">{c.name}</span>
            <span className="cl__itemmeta">{c.members} {c.members === 1 ? 'child' : 'children'}</span>
          </Link>
        ))}
      </div>
      {classes && classes.length === 0 && !failed && <TeachSteps title="How the first lesson goes" />}
      {classes !== null && <TeachPlans title={classes.length ? 'Lesson plans' : 'Twelve lesson plans, ready to read aloud'} />}
    </>
  );
}

// ── /teach/:code ────────────────────────────────────────────────────────────
function Board({ code, token }) {
  const [board, setBoard] = useState(null);
  const [status, setStatus] = useState('loading');
  const [projector, setProjector] = useState(false);
  const [stage, setStage] = useState(null);
  const [stageCode, setStageCode] = useState('');
  const [copied, setCopied] = useState(false);
  const seen = useRef(new Set());
  const [fresh, setFresh] = useState(new Set());
  // When a poll fails after the board has loaded, the board stays up, says so,
  // and says how old it is. The tiles are still right about who joined.
  const [lostSince, setLostSince] = useState('');
  const lastOk = useRef('');

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/class/${encodeURIComponent(code)}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const data = await res.json().catch(() => ({}));
      if (res.status === 503 && data.ready === false) { setStatus('notready'); return; }
      if (res.status === 404) { setStatus('missing'); return; }
      if (!res.ok || !Array.isArray(data.members)) throw new Error(`board ${res.status}`);
      const arrived = new Set();
      for (const m of data.members) if (seen.current.size && !seen.current.has(m.id)) arrived.add(m.id);
      seen.current = new Set(data.members.map((m) => m.id));
      if (arrived.size) { setFresh(arrived); setTimeout(() => setFresh(new Set()), 2500); }
      setBoard(data);
      setStatus('ok');
      setLostSince('');
      lastOk.current = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch {
      setStatus((s) => (s === 'ok' ? 'ok' : 'error'));
      setLostSince(lastOk.current || 'lost');
    }
  }, [code, token]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    document.body.classList.toggle('cl-projector', projector);
    return () => document.body.classList.remove('cl-projector');
  }, [projector]);

  // A published game, on the big screen.
  useEffect(() => {
    if (!stage?.publicId) { setStageCode(''); return undefined; }
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/builder/pub/${encodeURIComponent(stage.publicId)}`);
        const data = res.ok ? await res.json() : null;
        if (alive && data?.project?.generated_code) setStageCode(data.project.generated_code);
      } catch { /* the tile stays a tile */ }
    })();
    return () => { alive = false; };
  }, [stage]);

  const joinUrl = `https://${SITE}/join?code=${code}`;
  async function copy() {
    try { await navigator.clipboard.writeText(joinUrl); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* the address is on screen to type */ }
  }

  const members = useMemo(() => board?.members || [], [board]);
  const totalGames = useMemo(() => members.reduce((a, m) => a + m.games, 0), [members]);
  const numbers = useMemo(() => roomNumbers(members), [members]);

  if (status === 'notready') return <NotSetUp />;
  if (status === 'missing') return <div className="ci-blk ci-blk--paper cl__card"><h1 className="ci-h1 cl__title">No class has that code.</h1><p className="ci-sub">Check it against <Link to="/teach">your classes</Link>.</p></div>;
  if (status === 'error') {
    // Nothing loaded yet, but the code is in the address, and the code is
    // what the room needs. Show it big, keep trying underneath.
    return (
      <div className="cl__board">
        <div className="cl__head">
          <div>
            <div className="ci-ey">Class code</div>
            <div className="cl__bigcode" aria-label={`Class code ${code}`}>{spaceCode(code)}</div>
            <div className="cl__where">{SITE}/join</div>
          </div>
          <div className="cl__tools"><Link className="ci-chip" to="/teach">All classes</Link></div>
        </div>
        <Offline
          level={1}
          title="The board is waiting for the connection."
          detail="Write the code up anyway: children can join the moment CodeIt answers, and their tiles appear here by themselves."
          onRetry={load}
        />
      </div>
    );
  }
  if (!board) return <Waiting what="the board" />;

  return (
    <div className={`cl__board${projector ? ' is-projector' : ''}${stage ? ' has-stage' : ''}`}>
      <div className="cl__head">
        <div>
          <div className="ci-ey">{board.class.name}</div>
          <div className="cl__bigcode" aria-label={`Class code ${code}`}>{spaceCode(code)}</div>
          <div className="cl__where">{SITE}/join</div>
        </div>
        <div className="cl__tools">
          <button type="button" className="ci-chip" onClick={copy}>{copied ? 'Copied' : 'Copy join link'}</button>
          <button type="button" className={`ci-chip${projector ? ' is-on' : ''}`} onClick={() => setProjector((p) => !p)} aria-pressed={projector}>{projector ? 'Leave projector' : 'Projector'}</button>
          {!projector && <Link className="ci-chip" to="/teach/plans">Today's plan</Link>}
          {!projector && <Link className="ci-chip" to="/teach">All classes</Link>}
        </div>
      </div>

      {lostSince && <OfflineStrip since={lostSince === 'lost' ? '' : lostSince} onRetry={load} />}

      {stage && (
        <div className="cl__stage ci-rise">
          <div className="cl__stagebar">
            <b>{stage.title}</b> <span>by {stage.name}</span>
            <button type="button" className="ci-chip" onClick={() => setStage(null)}>Close</button>
          </div>
          <div className="ci-frame is-lit">
            {stageCode ? <iframe title={stage.title} srcDoc={stageCode} sandbox="allow-scripts" /> : <div className="cl__stagewait">Loading the game.</div>}
          </div>
        </div>
      )}

      <div className="cl__count"><span className={`ci-livedot${lostSince ? ' is-off' : ''}`} />{members.length} {members.length === 1 ? 'child' : 'children'} in. {totalGames} {totalGames === 1 ? 'game' : 'games'} made.</div>
      {members.length > 0 && (
        <div className="cl__nums">
          <div className="ci-blk ci-blk--sun"><div className="ci-num">{numbers.building}</div><div className="ci-cap">building</div></div>
          <div className="ci-blk ci-blk--mint"><div className="ci-num">{numbers.made}</div><div className="ci-cap">with a game</div></div>
          <div className={`ci-blk ${numbers.stuck.length ? 'ci-blk--coral' : 'ci-blk--paper'}`}>
            <div className="ci-num">{numbers.stuck.length}</div>
            <div className="ci-cap">{numbers.stuck.length ? `stuck: ${numbers.stuck.map((m) => m.name).join(', ')}` : 'stuck'}</div>
          </div>
        </div>
      )}
      <div className="cl__grid">
        {members.map((m, i) => {
          const playable = m.newest?.publicId;
          // The teacher, at their own desk, opens a child's work; on the
          // projector a tile plays the game for the room. Sentences never
          // go on the big screen.
          const opens = board.owner && !projector;
          const Tile = opens ? Link : playable ? 'button' : 'div';
          const tileProps = opens
            ? { to: `/teach/${code}/${m.id}` }
            : { type: playable ? 'button' : undefined, onClick: playable ? () => setStage({ ...m.newest, name: m.name }) : undefined };
          return (
            <Tile
              key={m.id}
              {...tileProps}
              className={`cl__tile ci-blk ${m.games ? 'ci-blk--violet' : 'ci-blk--paper'}${fresh.has(m.id) ? ' ci-popin' : ''}${playable || opens ? ' is-playable' : ''}`}
              style={{ animationDelay: `${Math.min(i, 12) * 0.03}s` }}
            >
              <span className="cl__tilename">{m.name}</span>
              <span className="cl__tilegames">{m.games === 0 ? 'Joined' : `${m.games} ${m.games === 1 ? 'game' : 'games'}`}</span>
              {m.newest && <span className="cl__tilenew">{m.newest.title}<small>{ago(m.newest.createdAt)}{opens ? ' · open' : playable ? ' · play' : ''}</small></span>}
            </Tile>
          );
        })}
        </div>
      {members.length === 0 && !stage && (
        <div className="ci-blk ci-blk--sun cl__how ci-rise">
          <div className="ci-ey">How to join</div>
          <ol className="cl__steps">
            <li><b>1</b><span>Go to <strong>{SITE}/join</strong></span></li>
            <li><b>2</b><span>Type <strong>{spaceCode(code)}</strong></span></li>
            <li><b>3</b><span>Type your first name</span></li>
          </ol>
          <p className="cl__howfine">Tiles appear here as they join. Nothing to install, no email, no password.</p>
        </div>
      )}
    </div>
  );
}

// ── /teach/:code/:kid: one child's work ────────────────────────────────────
function Student({ code, kid, token }) {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/class/${encodeURIComponent(code)}/student/${encodeURIComponent(kid)}`, { headers: { Authorization: `Bearer ${token}` } });
      const body = await res.json().catch(() => ({}));
      if (!alive.current) return;
      if (res.status === 503 && body.ready === false) { setStatus('notready'); return; }
      if (res.status === 403) { setStatus('forbidden'); return; }
      if (res.status === 404) { setStatus('missing'); return; }
      if (!res.ok || !body.student) throw new Error(`student ${res.status}`);
      setData(body); setStatus('ok');
    } catch (err) {
      console.error('class/student:', err);
      if (alive.current) setStatus((s) => (s === 'ok' ? 'ok' : 'error'));
    }
  }, [code, kid, token]);
  useEffect(() => { load(); }, [load]);
  useRetry(load, status === 'error');

  if (status === 'notready') return <NotSetUp />;
  if (status === 'forbidden') return <div className="ci-blk ci-blk--paper cl__card"><h1 className="ci-h1 cl__title">This is the teacher's page.</h1><p className="ci-sub">Only the adult who made the class sees a child's sentences.</p></div>;
  if (status === 'missing') return <div className="ci-blk ci-blk--paper cl__card"><h1 className="ci-h1 cl__title">That child is not in this class.</h1><p className="ci-sub"><Link to={`/teach/${code}`}>Back to the board</Link></p></div>;
  if (status === 'error') {
    return (
      <div className="st__off">
        <Link to={`/teach/${code}`} className="ci-ey cl__link-ey">Back to the board · {spaceCode(code)}</Link>
        <Offline
          level={1}
          title="Cannot reach this child's work right now."
          detail="Nothing is lost: every game and sentence is kept on CodeIt. This page tries again by itself every 15 seconds."
          onRetry={load}
        />
      </div>
    );
  }
  if (status !== 'ok') return <Waiting what="this child's work" />;

  const { student, games, powers, done } = data;
  const plays = games.reduce((a, g) => a + g.plays, 0);
  const next = powers.find((p) => p.state === 'next');
  const quiet = games.length === 0;
  const nextSentence = BOARD_SENTENCE[next?.slug || 'numbers'];
  return (
    <div className="st">
      <header className="st__head">
        <Link to={`/teach/${code}`} className="ci-ey cl__link-ey">{data.class.name} · {spaceCode(code)}</Link>
        <h1 className="ci-h1 st__name">{student.name}</h1>
        <p className="ci-sub st__joined">Joined {ago(student.joinedAt)}.</p>
      </header>

      <section className="st__left">
        <div className="cl__nums">
          <div className="ci-blk ci-blk--violet"><div className="ci-num">{games.length}</div><div className="ci-cap">{games.length === 1 ? 'game' : 'games'}</div></div>
          <div className="ci-blk ci-blk--ink"><div className="ci-num">{plays}</div><div className="ci-cap">{plays === 1 ? 'play' : 'plays'}</div></div>
          <div className="ci-blk ci-blk--mint"><div className="ci-num">{done.length}</div><div className="ci-cap">of {POWERS.length} powers</div></div>
        </div>

        {quiet && (
          <div className="ci-blk ci-blk--sun st__nudge ci-rise">
            <div className="ci-ey">No game yet</div>
            <p>Sit with {student.name} and say one together: <b>{nextSentence}</b>. On Build, type it and press Build it.</p>
          </div>
        )}

        {!quiet && (
          <section className="st__sec">
            <h2 className="ci-h2">What {student.name} typed</h2>
            <ol className="st__said">
              {games.map((g) => (
                <li key={g.id} className="ci-blk ci-blk--paper">
                  {g.prompt ? <q>{g.prompt}</q> : <span className="st__noprompt">Started from a game, no sentence.</span>}
                  <span className="st__meta"><b>{g.title}</b> · {ago(g.createdAt)} · {g.plays} {g.plays === 1 ? 'play' : 'plays'}</span>
                  {g.publicId ? <Link className="ci-chip" to={`/project/${g.publicId}`}>Play</Link> : <span className="st__private">Not published</span>}
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="st__sec">
          <h2 className="ci-h2">Powers <small>{done.length} of {POWERS.length}</small></h2>
          <div className="st__powers">
            {powers.map((p) => <span key={p.slug} className={`st__power is-${p.state}`}><b>{p.n}</b>{p.name}</span>)}
          </div>
          {next && <p className="ci-sub st__next">Next for {student.name}: <b>{next.name}</b>, {next.does}. <Link to={`/teach/plans/${next.slug}`}>The lesson plan</Link>.</p>}
        </section>
        <ExampleCards from={Number(kid) % EXAMPLES.length} count={4} link={false} title="Ideas to suggest" note={`Examples to read out if ${student.name} is stuck for an idea.`} />
      </section>

      <aside className="st__right">
        {data.newestCode && games[0] && (
          <div className="st__newest ci-rise">
            <div className="st__gamehead"><span className="ci-livedot" />Newest: <b>{games[0].title}</b> · {ago(games[0].createdAt)}</div>
            <div className="ci-frame is-lit st__frame"><iframe title={games[0].title} srcDoc={data.newestCode} sandbox="allow-scripts" /></div>
          </div>
        )}
        <div className="ci-blk ci-blk--ink st__try ci-rise" style={{ animationDelay: '.05s' }}>
          <div className="ci-ey">Try next with {student.name}</div>
          {next ? (
            <>
              <div className="st__trypower">{next.name}: {next.does}.</div>
              <p>Say it together: <q>{nextSentence}</q></p>
              <div className="st__trylinks">
                <Link className="ci-chip" to={`/teach/plans/${next.slug}`}>The lesson plan</Link>
                <Link className="ci-chip" to={`/powers/${next.slug}`}>Open the power</Link>
              </div>
            </>
          ) : <p>Every power learned. Ask for one game that uses three of them at once.</p>}
        </div>
      </aside>
    </div>
  );
}

export default function Teach() {
  const { code: rawCode, kid } = useParams();
  const code = String(rawCode || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  useSEO({ canonical: `https://codeitlearn.com/teach${code ? `/${code}` : ''}`, title: code ? `${spaceCode(code)} | CodeIt` : 'Teach | CodeIt', description: 'Make a class, read out the code, watch the games appear.', robots: 'noindex,nofollow' });
  const { user, token } = useContext(AuthContext);
  return (
    <div className="cl">
      <Header />
      <main className="cl__main">
        {!user || !token
          ? (code && !kid ? <Board code={code} token={null} /> : <SignIn />)
          : code && kid ? <Student code={code} kid={kid} token={token} />
          : code ? <Board code={code} token={token} /> : <MyClasses token={token} uid={user.user_id ?? user.id ?? user.userId ?? 'me'} />}
      </main>
      <TabBar />
    </div>
  );
}
