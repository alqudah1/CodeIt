// ── The certificate at the end of the map ───────────────────────────────────
//
// The castle stop on the lesson map leads here. With all 31 lessons done it
// is a certificate with the child's name, what they finished, and the day the
// last lesson was completed (from the server, not today's date). Before that
// it is the same card with the castle dark, how far there is to go, and the
// four lands with the ones done ticked: a reason to keep walking. Printable:
// a parent will want it on the fridge.

import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { ENDPOINTS } from '../../config/api';
import Header from '../Header/Header';
import TabBar from '../../ds/TabBar';
import BrandLogo from '../../components/BrandLogo/BrandLogo';
import Icon from '../../components/Icon/Icon';
import { TOTAL_LESSONS } from './lessonRegistry';
import { STAGES, stageProgress } from './lessonStages';
import { Castle, Hill, Sun, Cloud, Tree, Flag } from './MapArt';
import { useSEO } from '../../hooks/useSEO';
import './Certificate.css';

export function certificateDate(iso) {
  const d = new Date(iso || '');
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
}

function Scene({ lit }) {
  return (
    <div className={`cert__scene${lit ? ' is-lit' : ''}`} aria-hidden="true">
      <Sun className="cert__sun" size={84} />
      <Cloud className="cert__cloud cert__cloud--a" width={96} />
      <Cloud className="cert__cloud cert__cloud--b" width={70} />
      <Hill className="cert__hill" width={320} />
      <Castle className="cert__castle" width={150} lit={lit} />
      <Tree className="cert__tree cert__tree--a" size={46} />
      <Tree className="cert__tree cert__tree--b" size={38} dark />
      {lit && <Flag className="cert__flag" size={34} color="#FFC93C" />}
    </div>
  );
}

function Lands({ completedIds, nextId }) {
  return (
    <ol className="cert__lands" aria-label="The four lands">
      {STAGES.map((stage) => {
        const p = stageProgress(stage, completedIds, nextId);
        return (
          <li key={stage.id} className={`cert__land cert__land--${stage.id} cert__land--${p.state}`}>
            <span className="cert__land-disc"><Icon name={p.state === 'done' ? 'check' : stage.icon} size={20} strokeWidth={3} /></span>
            <b>{stage.place}</b>
            <small>{p.done}/{p.total}</small>
          </li>
        );
      })}
    </ol>
  );
}

export default function Certificate() {
  useSEO({ canonical: '/certificate', title: 'Python course certificate | CodeIt', robots: 'noindex,nofollow' });
  const { user, token } = useContext(AuthContext);
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    if (!token) { setProgress({ completedLessons: [], finishedAt: null }); return undefined; }
    let alive = true;
    fetch(ENDPOINTS.lessons.progress, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive) setProgress(d || { completedLessons: [], finishedAt: null }); })
      .catch(() => { if (alive) setProgress({ completedLessons: [], finishedAt: null }); });
    return () => { alive = false; };
  }, [token]);

  const completedIds = progress ? (progress.completedLessons || []) : [];
  const done = completedIds.length;
  const earned = progress && done >= TOTAL_LESSONS && TOTAL_LESSONS > 0;
  const name = user?.name || user?.username || 'A CodeIt learner';
  const nextId = Array.from({ length: TOTAL_LESSONS }, (_, i) => i + 1).find((id) => !completedIds.includes(id)) || null;
  const pct = TOTAL_LESSONS > 0 ? Math.round((done / TOTAL_LESSONS) * 100) : 0;

  return (
    <div className="cert-page">
      <Header />
      <main className="cert-main">
        {!progress && <p className="cert-wait">One moment...</p>}
        {progress && earned && (
          <>
            <article className="cert" aria-label="Certificate">
              <Scene lit />
              <div className="cert__body">
                <BrandLogo className="cert__logo" alt="CodeIt" />
                <div className="cert__ribbon"><span>Certificate of completion</span></div>
                <p className="cert__awarded">This certifies that</p>
                <h1 className="cert__name">{name}</h1>
                <p className="cert__line">finished all {TOTAL_LESSONS} lessons of the CodeIt Python course</p>
                <Lands completedIds={completedIds} nextId={null} />
                <p className="cert__what">printing, variables, if statements, loops, lists, functions, dictionaries, classes, and a game of their own</p>
                <div className="cert__foot">
                  <div className="cert__sig"><span className="cert__sig-line" /><small>CodeIt</small></div>
                  <div className="cert__seal" aria-hidden="true"><span className="cert__seal-star">★</span><span>{TOTAL_LESSONS}/{TOTAL_LESSONS}</span></div>
                  <div className="cert__sig"><span className="cert__sig-line" /><small>{progress.finishedAt ? certificateDate(progress.finishedAt) : 'Date'}</small></div>
                </div>
              </div>
            </article>
            <div className="cert__actions">
              <button type="button" className="ci-btn ci-btn--ink" onClick={() => window.print()}>Print it</button>
              <Link className="ci-btn ci-btn--paper" to="/build">Build something with it</Link>
            </div>
          </>
        )}
        {progress && !earned && (
          <>
            <article className="cert cert--not-yet" aria-label="The certificate, not yet earned">
              <Scene lit={false} />
              <div className="cert__body">
                <p className="cert__ey">The certificate</p>
                <h1 className="cert__count">{token ? `${done} of ${TOTAL_LESSONS} lessons done.` : 'Sign in to see your progress.'}</h1>
                {token && (
                  <div className="cert__bar" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={TOTAL_LESSONS} aria-label="Lessons done">
                    <i style={{ width: `${pct}%` }} />
                  </div>
                )}
                <Lands completedIds={completedIds} nextId={nextId} />
                <p className="cert__what">
                  Finish all {TOTAL_LESSONS} and the castle lights up: this page becomes a certificate with your name on it, ready to print.
                </p>
                <Link className="ci-btn ci-btn--ink cert__go" to={nextId && token ? `/lesson/${nextId}` : '/lessons'}>
                  {token ? (nextId ? `Lesson ${nextId} is next` : 'Back to the map') : 'See the lessons'}
                </Link>
              </div>
            </article>
          </>
        )}
      </main>
      <TabBar />
    </div>
  );
}
