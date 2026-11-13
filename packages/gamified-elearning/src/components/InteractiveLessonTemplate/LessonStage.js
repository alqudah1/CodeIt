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
//
// `stage: 'boxes'` adds a shelf under the scene: every variable the code made
// is a labelled box with its value inside, read from Python after the run.

import React from 'react';
import Mascot from '../../arcade/Mascot';
import { speak } from '../../utils/voice';
import { Sun, Cloud, Bush, Flower } from '../../pages/Lessons/MapArt';
import './LessonStage.css';

const MOST = 4;          // bubbles shown at once: more than four is a wall again
const MOST_SHORT = 12;   // unless every line is a few characters (a loop counting): then they sit side by side
const SHORT = 14;

/** Output text as the lines Pixel says. Blank lines are a pause, not a line. */
export function stageLines(output) {
  return String(output || '').split('\n').map((line) => line.trimEnd()).filter((line) => line.trim() !== '');
}

export default function LessonStage({ lines = [], boxes = null, runKey = 0, idle = '', oops = '', mood, thinking = false }) {
  // A loop that prints 0, 1, 2, 3, 4 is not five bubbles stacked to the ceiling:
  // short lines flow in a row, the way you would count them out loud.
  const row = lines.length > 3 && lines.every((line) => line.length <= SHORT);
  const said = lines.slice(0, row ? MOST_SHORT : MOST);
  const more = lines.length - said.length;
  const speaking = said.length > 0 && !thinking;
  // A run that ended in a Python error: Pixel says what to look for, in the
  // same place the words would have been.
  const stuck = !!oops && !thinking && !speaking;
  const shelf = Array.isArray(boxes);
  const filled = shelf && !thinking ? boxes : [];
  return (
    <div className={`ls${speaking ? ' ls--speaking' : ''}${stuck ? ' ls--stuck' : ''}${shelf ? ' ls--shelf' : ''}`} data-testid="lesson-stage">
      <div className="ls__scene">
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
        {/* Read to me. On a phone the floating guide used to carry this and sat
            on top of the code; it lives on the stage now, where the words are. */}
        <button
          type="button"
          className="ls__read"
          aria-label="Read to me"
          onClick={() => { void speak(stuck ? oops : speaking ? said.join('. ') : idle); }}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
            <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
            <path d="M16 8.5a4.5 4.5 0 0 1 0 7M18.5 6a8 8 0 0 1 0 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <div className="ls__pixel">
          <Mascot mood={stuck ? 'hmm' : (mood || (speaking ? 'happy' : thinking ? 'lean' : 'base'))} size={84} />
        </div>
        {/* The words. Polite, so a screen reader hears what Pixel said after the run. */}
        <div className={`ls__says${row && speaking ? ' ls__says--row' : ''}`} aria-live="polite" aria-label="Pixel says">
          {speaking ? (
            <>
              {said.map((line, i) => (
                <p key={`${runKey}-${i}`} className="ls__say" style={{ animationDelay: `${(filled.length ? 0.5 : 0) + i * (row ? 0.22 : 0.42)}s` }}>{line}</p>
              ))}
              {more > 0 && (
                <p key={`${runKey}-more`} className="ls__say ls__say--more" style={{ animationDelay: `${(filled.length ? 0.5 : 0) + said.length * (row ? 0.22 : 0.42)}s` }}>
                  and {more} more {more === 1 ? 'line' : 'lines'}
                </p>
              )}
            </>
          ) : stuck ? (
            <p key={`${runKey}-oops`} className="ls__say ls__say--oops">{oops}</p>
          ) : (
            <p className={`ls__say ls__say--idle${thinking ? ' ls__say--thinking' : ''}`}>
              {thinking ? <span className="ls__dots" aria-label="Thinking"><i /><i /><i /></span> : idle}
            </p>
          )}
        </div>
      </div>
      {/* The shelf: one box for every name the code made, holding what Python
          says it holds. Before a run it is a shelf with nothing on it. */}
      {shelf && (
        <ul className="ls__shelf" aria-live="polite" aria-label="The boxes">
          {filled.length === 0 && <li className="ls__box ls__box--empty" aria-label="No boxes yet"><span className="ls__box-name">?</span><span className="ls__box-val">empty</span></li>}
          {filled.map((box, i) => (
            <li key={`${runKey}-${box.name}`} className={`ls__box ls__box--${box.type === 'str' ? 'text' : Array.isArray(box.items) ? 'list' : 'number'}`} style={{ animationDelay: `${i * 0.18}s` }}>
              <span className="ls__box-name">{box.name}</span>
              {Array.isArray(box.items) ? (
                /* A list is one box with slots, and every slot has its number
                   under it, starting at 0: the thing a list lesson is about. */
                <span className={`ls__box-val ls__slots${box.labels ? ' ls__slots--named' : ''}`} aria-label={`${box.name} is a ${box.labels ? 'dictionary' : 'list'}: ${box.text}`}>
                  {box.items.length === 0 && <span className="ls__slot ls__slot--none"><b>empty</b></span>}
                  {box.items.map((item, k) => (
                    <span key={k} className="ls__slot"><b>{item}</b><i>{box.labels ? box.labels[k] : k}</i></span>
                  ))}
                  {box.more > 0 && <span className="ls__slot ls__slot--more"><b>+{box.more}</b></span>}
                </span>
              ) : (
                <span className="ls__box-val">{box.text}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
