// ── The tab called "The code", finally showing the code ──────────────────────
//
// Until now the tab labelled "The code" showed concepts, lesson chips and an
// AI-written explanation of the project — everything except the project. A
// child could not see a single line of what they had made, let alone change it.
//
// This is the part that makes CodeIt a place you build things rather than a
// place you receive things. It is a real editor over the child's real file:
// type into it and the project on the Play tab changes. No rebuild, no asking
// the AI, no waiting.
//
// Three things make that safe enough to hand to a ten-year-old:
//
//   * When it breaks, the studio says what broke and points at the line — in
//     their own numbering, which is why everything CodeIt injects is kept to a
//     single line (see previewErrors.js).
//   * The last version that actually ran is kept, and going back is one button
//     that says how much it would undo.
//   * Typing is debounced, so the preview reloads when they pause rather than
//     flickering on every keystroke.
//
// The editor itself is loaded only when this tab is opened. CodeMirror is not
// small, and a seven-year-old who never leaves the Play tab should not pay for
// it.

import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { lineContext } from './previewErrors';
import { canRestore, costOfRestoring } from './codeSafety';
import './CodePanel.css';

const CodeEditor = lazy(() => import('./CodeEditor'));

/** How long to wait after the last keystroke before running the project. */
const RUN_DEBOUNCE_MS = 700;

function ErrorCard({ error, code }) {
  const context = lineContext(code, error.line);

  return (
    <li className="cp-error">
      <div className="cp-error__head">
        <span className="cp-error__icon" aria-hidden="true">!</span>
        <p className="cp-error__title">{error.title}</p>
        {error.count > 1 && (
          <span className="cp-error__count">{error.count} times</span>
        )}
      </div>

      <p className="cp-error__fix">{error.fix}</p>

      {context.length > 0 && (
        <div className="cp-error__lines">
          {context.map(line => (
            <div
              key={line.number}
              className={`cp-error__line${line.isTheOne ? ' cp-error__line--here' : ''}`}
            >
              <span className="cp-error__lineno">{line.number}</span>
              <code>{line.text || ' '}</code>
            </div>
          ))}
        </div>
      )}

      {!error.recognised && (
        // We did not recognise this one. Showing the browser's own words beats
        // inventing a friendly explanation that might send a child the wrong way.
        <p className="cp-error__raw">
          <span>The browser said:</span> <code>{error.raw}</code>
        </p>
      )}
    </li>
  );
}

export default function CodePanel({
  code = '',
  onCodeChange,
  errors = [],
  safety,
  onRestore,
  guideLevel = 'independent',
}) {
  const [draft, setDraft] = useState(code);
  const [dirty, setDirty] = useState(false);
  const timer = useRef(null);
  const onCodeChangeRef = useRef(onCodeChange);

  useEffect(() => { onCodeChangeRef.current = onCodeChange; }, [onCodeChange]);

  // The project changed somewhere else — the AI edited it, a colour was picked,
  // something was dragged, a version was restored. Take the new code, unless
  // the child is mid-sentence in the editor, in which case their typing wins.
  useEffect(() => {
    setDraft(current => (dirty ? current : code));
  }, [code, dirty]);

  useEffect(() => () => clearTimeout(timer.current), []);

  function handleChange(next) {
    setDraft(next);
    setDirty(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setDirty(false);
      onCodeChangeRef.current?.(next);
    }, RUN_DEBOUNCE_MS);
  }

  function runNow() {
    clearTimeout(timer.current);
    setDirty(false);
    onCodeChangeRef.current?.(draft);
  }

  const lineCount = useMemo(() => draft.split('\n').length, [draft]);
  const restorable = canRestore(safety, code);
  const cost = costOfRestoring(safety, code);

  return (
    <section className="cp" aria-labelledby="cp-title">
      <header className="cp__head">
        <div>
          <h3 id="cp-title" className="cp__title">Your code</h3>
          <p className="cp__sub">
            {guideLevel === 'early'
              ? 'This is what your project is really made of. Change a word and watch what happens.'
              : 'This is your project, for real. Change anything and it runs straight away.'}
          </p>
        </div>
        <span className="cp__lines">{lineCount} lines</span>
      </header>

      <div className="cp__editor">
        <Suspense fallback={<div className="cp__loading">Opening your code…</div>}>
          <CodeEditor value={draft} onChange={handleChange} />
        </Suspense>
      </div>

      <div className="cp__bar">
        <button
          type="button"
          className={`cp__run${dirty ? ' cp__run--waiting' : ''}`}
          onClick={runNow}
        >
          {dirty ? 'Run it now' : 'Running your latest code'}
        </button>

        {restorable && (
          <button type="button" className="cp__restore" onClick={onRestore}>
            Put it back to the last version that worked
            <span className="cp__restore-cost">
              undoes {cost} {cost === 1 ? 'line' : 'lines'}
            </span>
          </button>
        )}
      </div>

      {errors.length > 0 ? (
        <div className="cp__errors" role="status">
          <h4 className="cp__errors-title">
            {errors.length === 1 ? 'Something went wrong' : `${errors.length} things went wrong`}
          </h4>
          <ul className="cp__errors-list">
            {errors.map((error, index) => (
              <ErrorCard key={`${error.raw}-${error.line}-${index}`} error={error} code={code} />
            ))}
          </ul>
        </div>
      ) : (
        <p className="cp__ok">Your project is running with no errors.</p>
      )}
    </section>
  );
}
