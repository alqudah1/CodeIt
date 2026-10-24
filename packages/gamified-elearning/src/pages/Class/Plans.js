// ── /teach/plans: twelve 45 minute classes, one per power ───────────────────

import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSEO } from '../../hooks/useSEO';
import Header from '../Header/Header';
import { PLANS, PLANS_INDEX, planMeta } from './lessonPlans';
import '../../ds/ds.css';
import './Class.css';

export default function Plans() {
  const { slug } = useParams();
  const plan = PLANS.find((p) => p.slug === slug) || null;
  // Indexed: these are the pages a teacher searching for a coding lesson should find.
  // The index takes its title from pageMeta.js; each plan builds its own from planMeta.
  useSEO(plan ? { canonical: `/teach/plans/${plan.slug}`, ...planMeta(plan) } : { canonical: '/teach/plans' });

  if (!plan) {
    return (
      <div className="cl">
        <Header />
        <main className="cl__main">
          <div className="ci-ey">{PLANS_INDEX.eyebrow}</div>
          <h1 className="ci-h1">{PLANS_INDEX.h1}</h1>
          <p className="ci-sub">{PLANS_INDEX.intro}</p>
          <div className="cl__list pl__list">
            {PLANS.map((p, i) => (
              <Link key={p.slug} to={`/teach/plans/${p.slug}`} className="ci-blk ci-blk--paper cl__item ci-rise" style={{ animationDelay: `${0.03 * i}s` }}>
                <span className="cl__itemcode">{p.n}</span>
                <span className="cl__itemname">{p.title}</span>
                <span className="cl__itemmeta">Board: {p.sentence}</span>
              </Link>
            ))}
          </div>
          <p className="cl__fine"><Link to="/teach">Your classes</Link></p>
        </main>
      </div>
    );
  }

  return (
    <div className="cl">
      <Header />
      <main className="cl__main pl">
        <Link to="/teach/plans" className="ci-ey cl__link-ey">Lesson plan {plan.n} of {PLANS.length}</Link>
        <h1 className="ci-h1">{plan.title}</h1>
        <div className="ci-blk ci-blk--sun pl__board ci-rise">
          <div className="ci-ey">On the board</div>
          <div className="pl__sentence">{plan.sentence}</div>
        </div>
        <ol className="pl__steps">
          {plan.steps.map((s) => (
            <li key={s.min} className="ci-blk ci-blk--paper ci-rise">
              <span className="pl__min">{s.min} min</span>
              <b>{s.head}</b>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
        <div className="ci-blk ci-blk--ink pl__look ci-rise">
          <div className="ci-ey">What to look for</div>
          <p>{plan.lookFor}</p>
        </div>
        <div className="pl__nav">
          {plan.n > 1 && <Link className="ci-chip" to={`/teach/plans/${PLANS[plan.n - 2].slug}`}>Previous: {PLANS[plan.n - 2].title.split('.')[0]}</Link>}
          {plan.n < PLANS.length && <Link className="ci-chip" to={`/teach/plans/${PLANS[plan.n].slug}`}>Next: {PLANS[plan.n].title.split('.')[0]}</Link>}
          <Link className="ci-chip" to={`/powers/${plan.slug}`}>Open the power</Link>
        </div>
      </main>
    </div>
  );
}
