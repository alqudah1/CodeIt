// ── Guess first ─────────────────────────────────────────────────────────────
//
// Computing teachers in the UK teach Python with a sequence called PRIMM:
// Predict, Run, Investigate, Modify, Make (Sentance, Waite and Kalia, 2019).
// It starts with a prediction because a beginner learns to read code before
// they can write it, and guessing makes them reason about a line before the
// computer shows the answer.
//
// The rebuilt lessons already ran, investigated, modified and made. This is
// the P: before the first Run, three guesses to tap. It never blocks. Run
// works without a guess, and a wrong guess costs nothing; the point is the
// thinking, and the small surprise when Python says something else.
//
// The right answer is not written in the lesson. After the run the guess is
// compared with what Python really printed.

import React from 'react';
import { stageLines } from './LessonStage';

/** What a run printed, as one line, the way the guesses are written. */
export function saidAs(output) {
  return stageLines(output).join(' ');
}

export default function GuessFirst({ options = [], picked, output, onPick }) {
  const said = saidAs(output);
  const ran = said !== '';
  const right = ran && picked === said;
  return (
    <div className={`gf${ran ? ' gf--ran' : ''}`}>
      <p className="gf__ask" id="gf-ask">{ran ? 'Your guess' : 'Guess first: what will Pixel say?'}</p>
      <div className="gf__options" role="group" aria-labelledby="gf-ask">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={`gf__option${picked === option ? ' is-picked' : ''}${ran && option === said ? ' is-said' : ''}`}
            aria-pressed={picked === option}
            disabled={ran}
            onClick={() => onPick(option)}
          >
            {option}
          </button>
        ))}
      </div>
      {ran && picked && (
        <p className={`gf__verdict${right ? ' is-right' : ''}`} role="status">
          {right ? 'You guessed it!' : `Surprise! Pixel said ${said}. Now you know.`}
        </p>
      )}
    </div>
  );
}
