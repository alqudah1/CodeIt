// ── One line of code, taken apart ───────────────────────────────────────────
//
// The explanation of print() used to be a paragraph, then a KEY IDEA box with
// arrows that wrapped on a phone, then a read-only code block. This is the
// line itself, large, with each piece a button: tap `print` and it says what
// it is for. The child has just run this exact line, so they are taking apart
// something they made work, not reading about something they have not seen.
//
// A concept step asks for it with:
//   parts: { pieces: [['print', 'a'], ['(', 'b'], ['"Hello!"', 'c'], [')', 'b']],
//            notes: { a: '...', b: '...', c: '...' } }
// Pieces that share a letter light up together (the two brackets are one idea).

import React, { useState } from 'react';
import './LessonStage.css';

const COLOURS = ['#FFC93C', '#7BE39A', '#8FD0FF', '#FF9DBB'];

export default function CodeParts({ parts }) {
  const pieces = parts?.pieces || [];
  const notes = parts?.notes || {};
  const order = Object.keys(notes);
  const [open, setOpen] = useState([]);
  const colour = (key) => COLOURS[order.indexOf(key) % COLOURS.length];
  const tap = (key) => setOpen((prev) => (prev.includes(key) ? prev : [...prev, key]));
  const label = (key) => pieces.filter(([, k]) => k === key).map(([code]) => code).join(' ');
  if (!pieces.length) return null;
  return (
    <div className="ls-parts">
      <div className="ls-parts__line" role="group" aria-label="The pieces of the code. Tap one to see what it does.">
        {pieces.map(([code, key], i) => (
          <button
            key={`${code}-${i}`}
            type="button"
            className={`ls-parts__piece${open.includes(key) ? ' is-open' : ''}`}
            style={{ '--piece': colour(key) }}
            aria-expanded={open.includes(key)}
            onClick={() => tap(key)}
          >
            {code}
          </button>
        ))}
      </div>
      {open.length < order.length && (
        <p className="ls-parts__ask">
          {open.length === 0 ? 'Tap a piece to see what it does.' : `${order.length - open.length} more to tap.`}
        </p>
      )}
      <ul className="ls-parts__notes" aria-live="polite">
        {open.map((key) => (
          <li key={key} className="ls-parts__note" style={{ '--piece': colour(key) }}>
            <code>{label(key)}</code>
            <span>{notes[key]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
