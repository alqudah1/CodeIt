// ── Example games, so no page is ever a blank wall ──────────────────────────
//
// Each card is one sentence a child could type, drawn the way the engine
// will build it: the real sky, the real player, enemy and treasure sprites,
// moving a little. Every card says "Example" and none carries a name, a play
// count or anything else that would pretend a child made it. Tapping one
// builds that game, so an example is always one tap from being theirs.

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { IDEAS, localRecipe } from '../pages/Build/recipeLocal';
import { spriteNameFor, spriteUri } from '../pages/Build/sprites';
import './ds.css';
import './Examples.css';

export const MORE_IDEAS = [
  'a dragon that dodges fireballs at sunset',
  'a robot that catches gems in the day',
  'an alien that shoots bombs at night',
  'a bunny that runs and jumps over rocks',
];

const SKY = { space: ['#2A1E5C', '#5B3FD6'], night: ['#1E1B3A', '#3B2A6B'], ocean: ['#042F4A', '#0E7490'], candy: ['#FF6B6B', '#FF9FB5'], day: ['#3EB7F8', '#8FD3FF'], sunset: ['#FF7A00', '#FFC93C'] };
const VERB = { shooter: 'Shoot', catch: 'Catch', dodge: 'Dodge', runner: 'Run' };

/** Every example, as the engine reads it. */
export const EXAMPLES = [...IDEAS, ...MORE_IDEAS].map((sentence) => {
  const r = localRecipe(sentence);
  return {
    sentence,
    kind: r.kind,
    sky: r.sky,
    player: spriteNameFor(r.player, 'hero'),
    enemy: spriteNameFor(r.enemy, 'rock'),
    treasure: spriteNameFor(r.treasure, 'gem'),
  };
});

export const buildHref = (sentence) => `/build?prompt=${encodeURIComponent(sentence)}`;

/** n examples starting at `from`, wrapping, never the same one twice. */
export function examplesFrom(from = 0, count = 4) {
  const n = Math.min(count, EXAMPLES.length);
  return Array.from({ length: n }, (_, k) => EXAMPLES[(from + k) % EXAMPLES.length]);
}

function Stage({ ex }) {
  return (
    <span className={`ex__stage is-${ex.kind}`} aria-hidden="true">
      <img className="ex__enemy" src={spriteUri(ex.enemy)} alt="" />
      <img className="ex__enemy ex__enemy--b" src={spriteUri(ex.enemy)} alt="" />
      <img className="ex__treasure" src={spriteUri(ex.treasure)} alt="" />
      {ex.kind === 'shooter' && <i className="ex__shot" />}
      <img className="ex__player" src={spriteUri(ex.player)} alt="" />
    </span>
  );
}

export function ExampleCard({ ex, onPick, link = true, i = 0 }) {
  const [a, b] = SKY[ex.sky] || SKY.day;
  const props = { className: 'ex__card', style: { background: `linear-gradient(160deg, ${a}, ${b})`, animationDelay: `${i * 0.05}s` } };
  const inner = (
    <>
      <span className="ex__tag">Example</span>
      <span className="ex__verb">{VERB[ex.kind]}</span>
      <Stage ex={ex} />
      <span className="ex__say">{ex.sentence}</span>
    </>
  );
  if (onPick) return <button type="button" {...props} onClick={() => onPick(ex.sentence)}>{inner}</button>;
  if (link) return <Link {...props} to={buildHref(ex.sentence)}>{inner}</Link>;
  return <div {...props}>{inner}</div>;
}

export default function ExampleCards({ from = 0, count = 4, onPick, link = true, title, note, wide = false, className = '' }) {
  return (
    <section className={`ex ${className}`}>
      {title && <h2 className="ci-h2 ex__title">{title}</h2>}
      {note && <p className="ci-sub ex__note">{note}</p>}
      <div className={`ex__grid${wide ? ' ex__grid--4' : ''}`}>
        {examplesFrom(from, count).map((ex, i) => <ExampleCard key={ex.sentence} ex={ex} onPick={onPick} link={link} i={i} />)}
      </div>
    </section>
  );
}

/** The big one, for an empty game frame: an example a few seconds at a time. */
export function ExampleHero({ onPick, every = 4500 }) {
  const [at, setAt] = useState(0);
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const id = setInterval(() => setAt((n) => (n + 1) % EXAMPLES.length), every);
    return () => clearInterval(id);
  }, [every]);
  const ex = EXAMPLES[at];
  const [a, b] = SKY[ex.sky] || SKY.day;
  return (
    <div className="ex__hero" style={{ background: `linear-gradient(160deg, ${a}, ${b})` }}>
      <span className="ex__tag">Example</span>
      <span className="ex__verb">{VERB[ex.kind]}</span>
      <Stage key={ex.sentence} ex={ex} />
      <div className="ex__herofoot">
        <span className="ex__say" key={`s-${ex.sentence}`}>{ex.sentence}</span>
        {onPick && <button type="button" className="ci-btn ci-btn--sm" onClick={() => onPick(ex.sentence)}>Build this one</button>}
        <small>Your game shows up here two seconds after you press Build.</small>
      </div>
      <div className="ex__dots" aria-hidden="true">{EXAMPLES.map((e, k) => <i key={e.sentence} className={k === at ? 'is-on' : ''} />)}</div>
    </div>
  );
}
