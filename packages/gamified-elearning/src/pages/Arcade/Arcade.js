// ── /arcade: a leaderboard where every row is a game ────────────────────────
//
// A child in a class sees the room: every published game by a classmate,
// ranked by plays, this week or all time, their own rows lit, their rank in
// one line. Tap a row and the game plays. A child with no class sees the
// public arcade (the explore feed) in the same shape. Rank is plays, which
// are real; nothing is awarded for showing up.

import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import { useSEO } from '../../hooks/useSEO';
import Header from '../Header/Header';
import TabBar from '../../ds/TabBar';
import '../../ds/ds.css';
import './Arcade.css';

const DOTS = ['#7C5CFF', '#FF6B6B', '#FFC93C', '#17C08B', '#3EB7F8', '#FF7A00'];

/** Rank word: 1st, 2nd, 3rd, 4th ... */
export function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

/** The games to show for a tab, ranked, with each child's rank attached. */
export function rankGames(games, tab) {
  const list = (games || []).filter((g) => (tab === 'week' ? g.thisWeek : true)).slice();
  list.sort((a, b) => (b.plays - a.plays) || (new Date(b.createdAt) - new Date(a.createdAt)));
  return list.map((g, i) => ({ ...g, rank: i + 1 }));
}

export default function Arcade() {
  useSEO({ canonical: 'https://codeitlearn.com/arcade', title: 'Arcade | CodeIt', description: 'Every game in your class, ranked by plays. Tap one and play.', robots: 'noindex,nofollow' });
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [klass, setKlass] = useState(null);     // the class, when the child is in one
  const [games, setGames] = useState(null);     // class games, or the public feed shaped the same
  const [me, setMe] = useState(null);
  const [tab, setTab] = useState('week');
  const [status, setStatus] = useState('loading');
  const [ready, setReady] = useState(true);

  useEffect(() => {
    let alive = true;
    const auth = token ? { Authorization: `Bearer ${token}` } : {};
    (async () => {
      try {
        if (user && token) {
          const res = await fetch(`${API_BASE_URL}/api/class/joined`, { headers: auth });
          const data = res.ok ? await res.json() : null;
          if (res.status === 503 && alive) setReady(false);
          const first = data?.classes?.[0];
          if (first) {
            const a = await fetch(`${API_BASE_URL}/api/class/${first.code}/arcade`, { headers: auth });
            const arc = a.ok ? await a.json() : null;
            if (alive && arc?.games) { setKlass(arc.class); setGames(arc.games); setMe(arc.me); setStatus('ok'); return; }
          }
        }
        const res = await fetch(`${API_BASE_URL}/api/explore`, { headers: auth });
        const data = res.ok ? await res.json() : null;
        if (!alive) return;
        if (!data) { setStatus('error'); return; }
        const weekAgo = Date.now() - 7 * 86400000;
        const seen = new Set();
        const all = [...(data.trending || []), ...(data.newest || []), ...(data.mostPlayed || [])].filter((p) => p.publicId && !seen.has(p.publicId) && seen.add(p.publicId));
        setGames(all.map((p) => ({ id: p.id, title: p.title, publicId: p.publicId, plays: p.plays || 0, by: p.creatorName, createdAt: p.createdAt, thisWeek: p.createdAt ? new Date(p.createdAt).getTime() >= weekAgo : false, color: p.primaryColor })));
        setStatus('ok');
      } catch { if (alive) setStatus('error'); }
    })();
    return () => { alive = false; };
  }, [user, token]);

  const ranked = useMemo(() => rankGames(games, tab), [games, tab]);
  const mine = ranked.find((g) => me && g.userId === me);
  const weekCount = useMemo(() => rankGames(games, 'week').length, [games]);
  const surprise = () => { if (ranked.length) navigate(`/project/${ranked[Math.floor(Math.random() * ranked.length)].publicId}`); };

  return (
    <div className="ar">
      <Header />
      <main className="ar__main">
        <div className="ar__head">
          <div>
            <div className="ci-ey">{klass ? klass.name : 'Everyone'}</div>
            <h1 className="ci-h1">Arcade.</h1>
          </div>
          <button type="button" className="ci-chip" onClick={surprise} disabled={!ranked.length}>Surprise me</button>
        </div>
        <div className={`ci-seg ar__seg${tab === 'all' ? ' is-second' : ''}`}>
          <i />
          <button type="button" className={tab === 'week' ? 'is-on' : ''} onClick={() => setTab('week')}>This week</button>
          <button type="button" className={tab === 'all' ? 'is-on' : ''} onClick={() => setTab('all')}>All time</button>
        </div>

        {klass && (
          <div className="ci-blk ci-blk--ink ar__you ci-rise">
            <div className="ci-ey">{tab === 'week' ? 'This week' : 'All time'}</div>
            {mine
              ? <div className="ar__rank"><b>You're {ordinal(mine.rank)}</b><span>{mine.title} · {mine.plays} {mine.plays === 1 ? 'play' : 'plays'}</span></div>
              : <div className="ar__rank"><b>{tab === 'week' ? 'No game from you this week.' : 'No game from you yet.'}</b><Link to="/build">Build one</Link></div>}
          </div>
        )}

        {status === 'loading' && <p className="ci-sub">Loading the arcade.</p>}
        {status === 'error' && <p className="ci-sub">The arcade did not load. Try again in a moment.</p>}
        {!ready && !klass && user && <p className="ci-sub">Classes are not switched on here yet, so this is everyone's arcade.</p>}

        {status === 'ok' && (
          <ol className="ar__list">
            {ranked.map((g, i) => (
              <li key={g.publicId || g.id} className={`ar__row ci-rise${mine && g.userId === me ? ' is-mine' : ''}`} style={{ animationDelay: `${Math.min(i, 10) * 0.03}s` }}>
                <Link to={`/project/${g.publicId}`} className="ar__link">
                  <span className="ar__n">{g.rank}</span>
                  <span className="ar__dot" style={{ background: g.color || DOTS[(g.by || '').length % DOTS.length] }} aria-hidden="true" />
                  <span className="ar__who"><b>{g.by}</b> · {g.title}</span>
                  <span className="ar__plays">{g.plays}<small>{g.plays === 1 ? 'play' : 'plays'}</small></span>
                </Link>
              </li>
            ))}
          </ol>
        )}
        {status === 'ok' && ranked.length === 0 && (
          <p className="ci-sub">{tab === 'week' && weekCount === 0 && (games || []).length > 0 ? 'Nothing published this week yet. All time has more.' : klass ? 'Nobody in the class has published a game yet. Be first.' : 'Nothing here yet.'}</p>
        )}

        {!klass && (
          <Link to="/join" className="ar__join ci-blk ci-blk--sun ci-rise">
            <b>In a class? Join it.</b>
            <small>Type the code on the board and this becomes your class's arcade.</small>
          </Link>
        )}
      </main>
      <TabBar />
    </div>
  );
}
