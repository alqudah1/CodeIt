// ── The certificate at the end of the map ───────────────────────────────────
//
// The castle stop on the lesson map leads here. With all 31 lessons done it
// is a certificate with the child's name, what they finished, and the day the
// last lesson was completed (from the server, not today's date). Before that
// it says plainly how far there is to go. Printable: a parent will want it on
// the fridge.

import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { ENDPOINTS } from '../../config/api';
import Header from '../Header/Header';
import TabBar from '../../ds/TabBar';
import BrandLogo from '../../components/BrandLogo/BrandLogo';
import { TOTAL_LESSONS } from './lessonRegistry';
import { useSEO } from '../../hooks/useSEO';
import './Certificate.css';

export function certificateDate(iso) {
  const d = new Date(iso || '');
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
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

  const done = progress ? (progress.completedLessons || []).length : 0;
  const earned = progress && done >= TOTAL_LESSONS && TOTAL_LESSONS > 0;
  const name = user?.name || user?.username || 'A CodeIt learner';

  return (
    <div className="cert-page">
      <Header />
      <main className="cert-main">
        {!progress && <p className="cert-wait">One moment...</p>}
        {progress && earned && (
          <>
            <article className="cert" aria-label="Certificate">
              <div className="cert__corner cert__corner--tl" aria-hidden="true" />
              <div className="cert__corner cert__corner--tr" aria-hidden="true" />
              <div className="cert__corner cert__corner--bl" aria-hidden="true" />
              <div className="cert__corner cert__corner--br" aria-hidden="true" />
              <BrandLogo className="cert__logo" alt="CodeIt" />
              <div className="cert__ribbon"><span>Certificate of completion</span></div>
              <p className="cert__awarded">This certifies that</p>
              <h1 className="cert__name">{name}</h1>
              <p className="cert__line">finished all {TOTAL_LESSONS} lessons of the CodeIt Python course</p>
              <p className="cert__what">printing, variables, if statements, loops, lists, functions, and a game of their own</p>
              <div className="cert__foot">
                <div className="cert__sig"><span className="cert__sig-line" /><small>CodeIt</small></div>
                <div className="cert__seal" aria-hidden="true"><span className="cert__seal-star">★</span><span>{TOTAL_LESSONS}/{TOTAL_LESSONS}</span></div>
                <div className="cert__sig"><span className="cert__sig-line" /><small>{progress.finishedAt ? certificateDate(progress.finishedAt) : 'Date'}</small></div>
              </div>
            </article>
            <div className="cert__actions">
              <button type="button" className="ci-btn ci-btn--ink" onClick={() => window.print()}>Print it</button>
              <Link className="ci-btn ci-btn--paper" to="/build">Build something with it</Link>
            </div>
          </>
        )}
        {progress && !earned && (
          <div className="cert-not-yet">
            <p className="cert__ey">The certificate</p>
            <h1>{token ? `${done} of ${TOTAL_LESSONS} lessons done.` : 'Sign in to see your progress.'}</h1>
            <p>Finish all {TOTAL_LESSONS} and this page becomes a certificate with your name on it, ready to print.</p>
            <Link className="ci-btn ci-btn--ink" to="/lessons">{token ? 'Back to the map' : 'See the lessons'}</Link>
          </div>
        )}
      </main>
      <TabBar />
    </div>
  );
}
