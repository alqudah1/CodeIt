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

function SignIn() {
  return (
    <div className="ci-blk ci-blk--paper cl__card">
      <div className="ci-ey">Teach with CodeIt</div>
      <h1 className="ci-h1 cl__title">Make a class. Read out the code. Watch the games appear.</h1>
      <p className="ci-sub">Sign in with your own account to make a class. Children join with the code and a first name, nothing else.</p>
      <Link className="ci-btn ci-btn--ink" to="/login" state={{ from: '/teach' }}>Sign in</Link>
      <span className="cl__gap" />
      <Link className="ci-btn ci-btn--paper" to="/register" state={{ from: '/teach' }}>Make an account</Link>
    </div>
  );
}

// ── /teach ──────────────────────────────────────────────────────────────────
function MyClasses({ token }) {
  const navigate = useNavigate();
  const [classes, setClasses] = useState(null);
  const [ready, setReady] = useState(true);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/class/mine`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json().catch(() => ({}));
        if (!alive) return;
        if (res.status === 503) { setReady(false); return; }
        setClasses(res.ok ? data.classes || [] : []);
      } catch { if (alive) setClasses([]); }
    })();
    return () => { alive = false; };
  }, [token]);

  async function create(e) {
    e.preventDefault();
    if (busy || name.trim().length < 2) return;
    setBusy(true); setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/class`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 503) { setReady(false); return; }
      if (!res.ok) throw new Error(data.error || 'Could not make the class.');
      navigate(`/teach/${data.class.code}`);
    } catch (err) { setError(reportFailure('class/create', err, 'Could not make the class. Try again.')); } finally { setBusy(false); }
  }

  if (!ready) return <NotSetUp />;
  return (
    <>
      <div className="ci-ey">Teach</div>
      <h1 className="ci-h1">Your classes</h1>
      <form className="ci-blk ci-blk--sun cl__new ci-rise" onSubmit={create}>
        <label className="cl__field">
          <span>New class</span>
          <input className="cl__name" value={name} onChange={(e) => setName(e.target.value.slice(0, 60))} placeholder="Year 5, Tuesday club, Room 12" aria-label="Class name" />
        </label>
        <button type="submit" className="ci-btn ci-btn--ink" disabled={busy || name.trim().length < 2}>{busy ? 'Making' : 'Make the class'}</button>
        {error && <p className="cl__err" role="alert">{error}</p>}
      </form>
      {classes === null && <p className="ci-sub">Loading your classes.</p>}
      {classes && classes.length === 0 && <p className="ci-sub">No classes yet. Name one above and you get a code to read out.</p>}
      <div className="cl__list">
        {(classes || []).map((c, i) => (
          <Link key={c.code} to={`/teach/${c.code}`} className="ci-blk ci-blk--paper cl__item ci-rise" style={{ animationDelay: `${0.05 * (i + 1)}s` }}>
            <span className="cl__itemcode">{spaceCode(c.code)}</span>
            <span className="cl__itemname">{c.name}</span>
            <span className="cl__itemmeta">{c.members} {c.members === 1 ? 'child' : 'children'}</span>
          </Link>
        ))}
      </div>
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

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/class/${encodeURIComponent(code)}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const data = await res.json().catch(() => ({}));
      if (res.status === 503) { setStatus('notready'); return; }
      if (!res.ok) { setStatus('missing'); return; }
      const arrived = new Set();
      for (const m of data.members) if (seen.current.size && !seen.current.has(m.id)) arrived.add(m.id);
      seen.current = new Set(data.members.map((m) => m.id));
      if (arrived.size) { setFresh(arrived); setTimeout(() => setFresh(new Set()), 2500); }
      setBoard(data);
      setStatus('ok');
    } catch { setStatus((s) => (s === 'ok' ? 'ok' : 'error')); }
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

  if (status === 'notready') return <NotSetUp />;
  if (status === 'missing') return <div className="ci-blk ci-blk--paper cl__card"><h1 className="ci-h1 cl__title">No class has that code.</h1><p className="ci-sub">Check it against <Link to="/teach">your classes</Link>.</p></div>;
  if (status === 'error' || !board) return <p className="ci-sub">Loading the board.</p>;

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
          {!projector && <Link className="ci-chip" to="/teach">All classes</Link>}
        </div>
      </div>

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

      <div className="cl__count"><span className="ci-livedot" />{members.length} {members.length === 1 ? 'child' : 'children'} in. {totalGames} {totalGames === 1 ? 'game' : 'games'} made.</div>
      <div className="cl__grid">
        {members.map((m, i) => {
          const playable = m.newest?.publicId;
          const Tile = playable ? 'button' : 'div';
          return (
            <Tile
              key={m.id}
              type={playable ? 'button' : undefined}
              className={`cl__tile ci-blk ${m.games ? 'ci-blk--violet' : 'ci-blk--paper'}${fresh.has(m.id) ? ' ci-popin' : ''}${playable ? ' is-playable' : ''}`}
              style={{ animationDelay: `${Math.min(i, 12) * 0.03}s` }}
              onClick={playable ? () => setStage({ ...m.newest, name: m.name }) : undefined}
            >
              <span className="cl__tilename">{m.name}</span>
              <span className="cl__tilegames">{m.games === 0 ? 'Joined' : `${m.games} ${m.games === 1 ? 'game' : 'games'}`}</span>
              {m.newest && <span className="cl__tilenew">{m.newest.title}<small>{ago(m.newest.createdAt)}{playable ? ' · play' : ''}</small></span>}
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

export default function Teach() {
  const { code: rawCode } = useParams();
  const code = String(rawCode || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  useSEO({ canonical: `https://codeitlearn.com/teach${code ? `/${code}` : ''}`, title: code ? `${spaceCode(code)} | CodeIt` : 'Teach | CodeIt', description: 'Make a class, read out the code, watch the games appear.', robots: 'noindex,nofollow' });
  const { user, token } = useContext(AuthContext);
  return (
    <div className="cl">
      <Header />
      <main className="cl__main">
        {!user || !token ? (code ? <Board code={code} token={null} /> : <SignIn />) : code ? <Board code={code} token={token} /> : <MyClasses token={token} />}
      </main>
      <TabBar />
    </div>
  );
}
