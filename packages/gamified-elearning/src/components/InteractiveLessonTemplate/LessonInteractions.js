// ── The three non-typing step types ──────────────────────────────────────────
//
// Tap, not drag. HTML5 drag-and-drop does not exist on the iPads and Chromebooks
// most classrooms hand out, and it is unreachable by keyboard. Every interaction
// here is a button: pick a card, pick a hole, tap to move a line. That works on
// a touchscreen, with a mouse, with a keyboard, and with a screen reader.
//
// The grading lives in interactionGrading.js as pure functions. These components
// only handle the picking.

import React, { useState } from 'react';
import { BLANK, splitTemplate, blankCount } from './interactionGrading';
import './LessonInteractions.css';

// ── Predict the output ───────────────────────────────────────────────────────
//
// Read the code, say what it will print. No typing, and it tests understanding
// more directly than running someone else's code does.

/**
 * A multiple-choice question.
 *
 * `wrong` is the index of an answer that has been checked and was not right.
 * It exists because without it there was no such state: a child tapped an
 * answer, pressed Check my answer, was told no — and the answer they tapped
 * looked exactly as it had a second earlier, still outlined in orange as
 * though it had been accepted. Three things on the screen said nothing had
 * happened and one sentence underneath said it had.
 */
export function PredictOutput({ step, chosen, onChoose, wrong, locked }) {
  return (
    <div className="li-block">
      <p className="li-prompt">{step.question || 'What will this code print?'}</p>

      <div className="li-code">
        <div className="li-code__bar">
          <span className="li-code__dots"><i /><i /><i /></span>
          <span className="li-code__lang">Python</span>
        </div>
        <pre><code>{step.code}</code></pre>
      </div>

      <div className="li-choices" role="group" aria-label="Choose the output">
        {(step.choices || []).map((choice, index) => {
          const isChosen = Number(chosen) === index;
          const isWrong = Number(wrong) === index;
          return (
            <button
              key={choice}
              type="button"
              className={`li-choice${isChosen ? ' li-choice--chosen' : ''}${isWrong ? ' li-choice--wrong' : ''}`}
              onClick={() => !locked && onChoose(index)}
              disabled={locked}
              aria-pressed={isChosen}
            >
              <span className="li-choice__letter" aria-hidden="true">
                {isWrong ? '✗' : String.fromCharCode(65 + index)}
              </span>
              <span className="li-choice__text">{choice}</span>
              {/* Colour alone does not carry this. Roughly one boy in twelve
                  cannot tell the orange from the red. */}
              {isWrong && <span className="li-choice__verdict">Not this one</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Fill in the blanks ───────────────────────────────────────────────────────
//
// Two taps: pick a hole, pick a word. Deliberately not a text input — spelling
// and punctuation are not what this step is testing, and a five-year-old typing
// a quote mark on a tablet keyboard is a lesson in frustration, not in Python.

export function FillBlank({ step, filled, onFill, locked }) {
  const total = blankCount(step.template);
  const firstEmpty = () => {
    for (let i = 0; i < total; i += 1) if (filled[i] == null) return i;
    return 0;
  };
  const [activeBlank, setActiveBlank] = useState(0);
  const active = filled[activeBlank] == null ? activeBlank : firstEmpty();

  const place = (word) => {
    if (locked) return;
    const next = [...filled];
    next[active] = word;
    onFill(next);
    setActiveBlank(Math.min(active + 1, total - 1));
  };

  const clearBlank = (index) => {
    if (locked) return;
    const next = [...filled];
    next[index] = null;
    onFill(next);
    setActiveBlank(index);
  };

  let blankSeen = -1;

  return (
    <div className="li-block">
      <p className="li-prompt">{step.question || 'Tap the missing pieces into place.'}</p>

      <div className="li-code li-code--template">
        <div className="li-code__bar">
          <span className="li-code__dots"><i /><i /><i /></span>
          <span className="li-code__lang">Python</span>
        </div>
        <pre className="li-template">
          {splitTemplate(step.template).map((segment, i) => {
            if (segment.kind === 'text') return <span key={i}>{segment.value}</span>;
            blankSeen += 1;
            const index = blankSeen;
            const value = filled[index];
            const isActive = index === active && !locked;
            return (
              <button
                key={i}
                type="button"
                className={
                  'li-blank'
                  + (value != null ? ' li-blank--filled' : '')
                  + (isActive ? ' li-blank--active' : '')
                }
                onClick={() => (value != null ? clearBlank(index) : setActiveBlank(index))}
                disabled={locked}
                aria-label={
                  value != null
                    ? `Blank ${index + 1}, filled with ${value}. Tap to clear.`
                    : `Blank ${index + 1}, empty. Tap to choose it.`
                }
              >
                {value != null ? value : BLANK}
              </button>
            );
          })}
        </pre>
      </div>

      <div className="li-words" role="group" aria-label="Pieces to choose from">
        {(step.options || []).map(word => {
          const used = filled.includes(word);
          return (
            <button
              key={word}
              type="button"
              className={`li-word${used ? ' li-word--used' : ''}`}
              onClick={() => place(word)}
              disabled={locked}
            >
              {word}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Put the lines in order ───────────────────────────────────────────────────
//
// Tap a line, then tap the arrows to walk it up or down. Order matters enormously
// in Python and nothing else in the lesson teaches it.

export function OrderSteps({ step, arranged, onArrange, locked }) {
  const [picked, setPicked] = useState(null);

  const move = (from, to) => {
    if (locked || to < 0 || to >= arranged.length) return;
    const next = [...arranged];
    const [line] = next.splice(from, 1);
    next.splice(to, 0, line);
    onArrange(next);
    setPicked(to);
  };

  return (
    <div className="li-block">
      <p className="li-prompt">{step.question || 'Put these lines in the right order.'}</p>

      <ol className="li-order">
        {arranged.map((line, index) => (
          <li key={line} className={`li-line${picked === index ? ' li-line--picked' : ''}`}>
            <span className="li-line__num" aria-hidden="true">{index + 1}</span>
            <button
              type="button"
              className="li-line__code"
              onClick={() => setPicked(picked === index ? null : index)}
              disabled={locked}
              aria-label={`Line ${index + 1}: ${line}`}
            >
              <code>{line}</code>
            </button>
            <span className="li-line__arrows">
              <button
                type="button"
                className="li-arrow"
                onClick={() => move(index, index - 1)}
                disabled={locked || index === 0}
                aria-label={`Move line ${index + 1} up`}
              >
                ↑
              </button>
              <button
                type="button"
                className="li-arrow"
                onClick={() => move(index, index + 1)}
                disabled={locked || index === arranged.length - 1}
                aria-label={`Move line ${index + 1} down`}
              >
                ↓
              </button>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
