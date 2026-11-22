// ── Me, for someone with no account ─────────────────────────────────────────
//
// The fourth key of the tab bar is "Me". For a visitor it went to the sign-in
// page: "WELCOME BACK. Sign in to your account", said to a child who has
// never had one, with no word about why they were there (an outside audit, 20
// November 2026). But a visitor does have a "me": the games on this device's
// shelf, the lessons finished here, the powers earned here, a look. This page
// shows those, says plainly that they live on this device, and offers the
// account as the way to keep them. Nothing is sold here and no price is shown.

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import CharacterAvatar from '../../components/CharacterAvatar/CharacterAvatar';
import { useCharacterDisplay } from '../../context/CharacterContext';
import { useSEO } from '../../hooks/useSEO';
import { useTheme, nightClass, setTheme } from '../../utils/theme';
import Header from '../Header/Header';
import TabBar from '../../ds/TabBar';
import { streakFrom } from '../Home/today';
import { STAGES } from '../Lessons/lessonStages';
import { POWERS, powerStates } from '../Powers/powers';
import { readDone } from '../Powers/PowersMap';
import { guestLessonsDone } from '../../utils/guestLessons';
import { listProjects, migrateLegacyDraft, whenMade } from '../../utils/projectShelf';
import '../../ds/ds.css';
import '../../ds/night.css';
import './Me.css';

function onThisDevice() {
  try {
    migrateLegacyDraft(window.localStorage);
    return {
      games: listProjects(window.localStorage),
      lessons: guestLessonsDone(window.localStorage).length,
      powers: readDone(window.localStorage),
    };
  } catch {
    return { games: [], lessons: 0, powers: [] };
  }
}

export default function GuestMe() {
  const theme = useTheme();
  useSEO({ canonical: '/profile', title: 'Me | CodeIt', description: 'Your games, your lessons, your look.', robots: 'noindex,nofollow' });
  const { character } = useCharacterDisplay();
  const mine = useMemo(onThisDevice, []);
  const streak = streakFrom(mine.games.map((game) => game.savedAt)).streak;
  const lastLesson = STAGES[STAGES.length - 1].to;
  const states = powerStates(mine.powers);
  const doneCount = states.filter((s) => s.state === 'done').length;
  const hasAnything = mine.games.length > 0 || mine.lessons > 0 || doneCount > 0;

  return (
    <div className={`me${nightClass(theme)}`}>
      <Header />
      <main className="me__main">
        <section className="me__left">
          <div className="me__hero ci-rise">
            <Link to="/character" className="me__avatar ci-blk ci-blk--sun" aria-label="Change your look">
              <CharacterAvatar character={character} size={88} />
            </Link>
            <div>
              <div className="ci-ey">Me</div>
              <h1 className="ci-h1 me__name">You</h1>
              <div className="me__level">Kept on this device</div>
            </div>
            <div className="me__chips">
              <button type="button" className={`ci-chip me__theme${theme === 'night' ? ' is-on' : ''}`} onClick={() => setTheme(theme === 'night' ? 'morning' : 'night')} aria-pressed={theme === 'night'}>
                {theme === 'night' ? 'Night on' : 'Night off'}
              </button>
            </div>
          </div>

          <div className="me__nums">
            <div className="ci-blk ci-blk--coral ci-rise" style={{ animationDelay: '.05s' }}>
              <div className="ci-num">{streak}</div>
              <div className="ci-cap">{streak === 1 ? 'day in a row' : 'days in a row'}</div>
            </div>
            <div className="ci-blk ci-blk--violet ci-rise" style={{ animationDelay: '.1s' }}>
              <div className="ci-num">{mine.lessons}</div>
              <div className="ci-cap">of {lastLesson} lessons done</div>
            </div>
            <div className="ci-blk ci-blk--ink ci-rise" style={{ animationDelay: '.15s' }}>
              <div className="ci-num">{mine.games.length}</div>
              <div className="ci-cap">{mine.games.length === 1 ? 'game made' : 'games made'}</div>
            </div>
          </div>

          {/* The account, as the way to keep what is above. Said once, in
              words a child can read, with the way in for someone who already
              has one. No price: nothing is sold to a child. */}
          <section className="me__keep ci-rise" aria-labelledby="me-keep-title">
            <h2 id="me-keep-title" className="ci-h2">{hasAnything ? 'Keep it for good' : 'Make it yours'}</h2>
            <p className="ci-sub">
              {hasAnything
                ? 'What you make is saved on this device only. With a free account your lessons are kept for good, and so is every game you save.'
                : 'You can build and learn here without an account. With a free one, your lessons and the games you save are kept for good.'}
            </p>
            <div className="me__keepacts">
              <Link to="/register" state={{ from: '/profile' }} className="ci-btn ci-btn--ink">Make a free account</Link>
              <Link to="/login" state={{ from: '/profile' }} className="ci-btn ci-btn--paper">I already have one</Link>
            </div>
            <p className="me__keepnote">Under 13? A parent or guardian sets it up with you.</p>
          </section>

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
        </section>

        <section className="me__right">
          <h2 className="ci-h2">Your games</h2>
          {mine.games.length === 0 && <p className="ci-sub">Nothing here yet. <Link to="/build">Build the first one</Link>.</p>}
          <div className="me__games">
            {mine.games.map((game) => (
              <Link key={game.id} to={`/builder?shelf=${game.id}`} className="me__game ci-blk ci-blk--paper">
                <b>{game.title || 'My game'}</b>
                <small>{whenMade(game.updatedAt)}</small>
              </Link>
            ))}
          </div>
          <Link to="/build" className="ci-btn ci-btn--ink me__build">Build a new one</Link>

          <Link to="/lessons" className="me__row ci-rise">
            <span className="me__rowic" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h7a3 3 0 0 1 3 3v11a2 2 0 0 0-2-2H4zM20 5h-3a3 3 0 0 0-3 3" /><path d="M20 5v12h-6" /></svg>
            </span>
            <span><b>Lessons</b><small>{mine.lessons === 0 ? 'Start with lesson 1. No account needed.' : `${mine.lessons} done on this device. Carry on.`}</small></span>
            <span className="me__chev" aria-hidden="true">›</span>
          </Link>
          <Link to="/character" className="me__row ci-rise">
            <span className="me__rowav"><CharacterAvatar character={character} size={40} /></span>
            <span><b>Your look</b><small>Colours and shape. Unlocked by level, never bought.</small></span>
            <span className="me__chev" aria-hidden="true">›</span>
          </Link>
        </section>
      </main>
      <TabBar />
    </div>
  );
}
