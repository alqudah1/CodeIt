import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { trackEvent } from '../../utils/trackEvent';
import Icon from '../../components/Icon/Icon';
import './TryPython.css';

// ── The one thing on this page nobody has to take on trust ───────────────────
//
// Every other claim on the home page is a sentence about the product. This is
// the product. A parent who has heard that "AI does the work for them" can type
// into this box and watch Python answer, before reading a word of copy, without
// an account, and with no AI anywhere near it.
//
// It is loaded on demand rather than bundled into the home page: the editor is
// large and Python itself is roughly ten megabytes, and neither should be
// downloaded by a visitor who came to read. The panel below is real markup, so
// the code is on the screen and readable while the editor arrives; pressing Run
// or focusing the panel is what starts the download.
const CodeRunnerPython = lazy(() => import('../../components/CodeRunnerPython'));

export const HELLO = 'print("Hello, World!")\nprint("Welcome to Python!")';

export default function TryPython() {
  const [live, setLive] = useState(false);
  const wrapRef = useRef(null);

  // Touching it in any way that suggests intent to use it: a click, a tap, a
  // key, or arriving by keyboard. Hovering does not count, because hovering is
  // not a decision.
  useEffect(() => {
    const node = wrapRef.current;
    if (!node || live) return undefined;
    const wake = () => {
      setLive(true);
      trackEvent('landing_cta_click', 'try-python');
    };
    node.addEventListener('pointerdown', wake, { once: true });
    node.addEventListener('keydown', wake, { once: true });
    node.addEventListener('focusin', wake, { once: true });
    return () => {
      node.removeEventListener('pointerdown', wake);
      node.removeEventListener('keydown', wake);
      node.removeEventListener('focusin', wake);
    };
  }, [live]);

  return (
    <section className="tryp" aria-labelledby="tryp-title" ref={wrapRef}>
      <div className="tryp__head">
        <h2 id="tryp-title">Type Python here. It runs in this page.</h2>
        <p>No account, no download, and no AI. Your child writes the line; Python answers it.</p>
      </div>

      <div className="tryp__panel">
        {live ? (
          <Suspense fallback={<pre className="tryp__still" aria-live="polite">Opening the editor…</pre>}>
            <CodeRunnerPython
              starterCode={HELLO}
              title="Python"
              height="150px"
              loadPython="demand"
            />
          </Suspense>
        ) : (
          <button
            type="button"
            className="tryp__still-button"
            onClick={() => setLive(true)}
          >
            <span className="tryp__still-label">Python</span>
            <pre className="tryp__still"><code>{HELLO}</code></pre>
            <span className="tryp__still-run"><Icon name="play" size={16} /> Run this</span>
          </button>
        )}
      </div>

      <p className="tryp__more">
        <Link
          to="/playground"
          onClick={() => trackEvent('landing_cta_click', 'try-python-playground')}
        >
          Eleven more templates in the playground
        </Link>
      </p>
    </section>
  );
}
