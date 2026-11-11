// ── The stage ───────────────────────────────────────────────────────────────
//
// A lesson used to answer a child's first line of Python with grey text in a
// grey box. This is the same answer with somebody saying it: Pixel stands in
// a small drawn morning, and every line the child's code prints comes out of
// Pixel's mouth as a speech bubble, in order, one after another.
//
// Nothing here is pretend. The bubbles are the real output of the real run,
// line for line; the Output box underneath still shows it as text. A step
// that is answered by tapping (a guess, a gap to fill) plays the lines its
// code would print once the answer is right.
//
// A step asks for it with `stage: 'say'`. Before the first run the bubble
// holds the step's one instruction (`idle`), so the stage is also the only
// voice telling a child what to do next.

import React from 'react';
import Mascot from '../../arcade/Mascot';
import { Sun, Cloud, Bush, Flower } from '../../pages/Lessons/MapArt';
import './LessonStage.css';

const MOST = 4;          // bubbles shown at once: more than four is a wall again

/** Output text as the lines Pixel says. Blank lines are a pause, not a line. */
export function stageLines(output) {
  return String(output || '').split('\n').map((line) => line.trimEnd()).filter((line) => line.trim() !== '');
}

export default function LessonStage({ lines = [], runKey = 0, idle = '', mood, thinking = false }) {
  const said = lines.slice(0, MOST);
  const more = lines.length - said.length;
  const speaking = said.length > 0 && !thinking;
  return (
    <div className={`ls${speaking ? ' ls--speaking' : ''}`} data-testid="lesson-stage">
      <div className="ls__sky" aria-hidden="true">
        <Sun className="ls__sun" size={64} />
        <Cloud className="ls__cloud ls__cloud--a" width={70} />
        <Cloud className="ls__cloud ls__cloud--b" width={48} />
      </div>
      <div className="ls__ground" aria-hidden="true">
        <Bush className="ls__bush" size={44} />
        <Flower className="ls__flower ls__flower--a" size={18} />
        <Flower className="ls__flower ls__flower--b" size={16} petal="#FFC93C" />
      </div>
      <div className="ls__pixel">
        <Mascot mood={mood || (speaking ? 'happy' : thinking ? 'lean' : 'base')} size={84} />
      </div>
      {/* The words. Polite, so a screen reader hears what Pixel said after the run. */}
      <div className="ls__says" aria-live="polite" aria-label="Pixel says">
        {speaking ? (
          <>
            {said.map((line, i) => (
              <p key={`${runKey}-${i}`} className="ls__say" style={{ animationDelay: `${i * 0.42}s` }}>{line}</p>
            ))}
            {more > 0 && (
              <p key={`${runKey}-more`} className="ls__say ls__say--more" style={{ animationDelay: `${said.length * 0.42}s` }}>
                and {more} more {more === 1 ? 'line' : 'lines'}
              </p>
            )}
          </>
        ) : (
          <p className={`ls__say ls__say--idle${thinking ? ' ls__say--thinking' : ''}`}>
            {thinking ? <span className="ls__dots" aria-label="Thinking"><i /><i /><i /></span> : idle}
          </p>
        )}
      </div>
    </div>
  );
}
