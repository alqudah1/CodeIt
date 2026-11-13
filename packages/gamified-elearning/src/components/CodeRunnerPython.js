import React, { useState, useEffect, useRef, useCallback } from 'react';
import PlainEditor from './PlainEditor';
import { editorNow, fetchEditor } from './editorLoader';
import { getPyodideRuntime } from '../utils/pyodideLoader';
import { readVariables } from '../utils/pythonVariables';
import { errorOutput, explainPythonError } from '../utils/pythonErrors';
import { trackActivityStart } from '../utils/activity';
import Icon from './Icon/Icon';
import './CodeRunnerPython.css';

// Ask for the coloured editor now, so it is here before the first step is drawn.
fetchEditor();

// Starter code per lesson id
const LESSON_STARTER = {
  1:  `# 🐍 Hello Python!\nprint("Hello, World!")\nprint("I am learning Python!")`,
  2:  `# 📦 Variables\nname = "Alex"\nage = 10\nfavorite_color = "blue"\n\nprint(name)\nprint(age)\nprint(favorite_color)`,
  3:  `# 🔄 Functions & Loops\ndef greet(name):\n    print("Hello, " + name + "!")\n\nfor i in range(3):\n    greet("Coder")\n\nprint("Done!")`,
  4:  `# 🔀 Conditionals\ntemperature = 25\n\nif temperature > 30:\n    print("It's hot outside!")\nelif temperature > 20:\n    print("It's a nice day!")\nelse:\n    print("It's a bit cold.")`,
  5:  `# 📋 Lists\nfruits = ["apple", "banana", "cherry"]\n\nfor fruit in fruits:\n    print("I like " + fruit)\n\nprint("Total:", len(fruits))`,
  6:  `# 📚 Dictionaries\nstudent = {\n    "name": "Alex",\n    "age": 10,\n    "grade": "A"\n}\n\nfor key, value in student.items():\n    print(key + ":", value)`,
  7:  `# 📁 File Handling (simulated)\nlines = ["Line 1: Hello", "Line 2: World", "Line 3: Python"]\n\nfor line in lines:\n    print(line)`,
  8:  `# 🛡️ Exception Handling\ntry:\n    number = int("hello")\nexcept ValueError as e:\n    print("Caught an error:", e)\n\nprint("Program continues!")`,
  9:  `# 🏗️ Classes & Objects\nclass Dog:\n    def __init__(self, name, breed):\n        self.name = name\n        self.breed = breed\n\n    def bark(self):\n        print(self.name + " says: Woof!")\n\nmy_dog = Dog("Buddy", "Labrador")\nmy_dog.bark()\nprint("Breed:", my_dog.breed)`,
  10: `# 🧩 Modules\nimport math\nimport random\n\nprint("Pi =", round(math.pi, 4))\nprint("Sqrt of 16 =", math.sqrt(16))\nprint("Random 1-10:", random.randint(1, 10))`,
};

// How long a lesson waits, untouched, before it fetches Python by itself.
export const PYTHON_AFTER_MS = 6000;

const DEFAULT_CODE = `# Write your Python code here\nprint("Hello, Python!")`;

// ── The symbols a phone keyboard hides ──────────────────────────────────────
//
// Python is mostly quote marks, brackets, colons and equals signs, and on a
// phone every one of them is two or three taps away behind a "123" key.
// Mismatched brackets are the most common mistake beginners make, and a
// missing quote mark is the one children name as the hardest. So on a touch
// screen the symbols sit in a row above the code, as keys big enough for a
// child's finger. A key types at the cursor and does not close the keyboard.
const SYMBOL_KEYS = [
  ['"', 'quote mark'], ['(', 'open bracket'], [')', 'close bracket'], ['=', 'equals'], [':', 'colon'],
  ['[', 'open square bracket'], [']', 'close square bracket'], [',', 'comma'], ['+', 'plus'], ['    ', 'indent, four spaces'],
];
export function SymbolKeys({ onKey }) {
  return (
    <div className="cr-keys" role="group" aria-label="Symbol keys">
      {SYMBOL_KEYS.map(([text, name]) => (
        <button
          key={name}
          type="button"
          className={`cr-key${text.trim() ? '' : ' cr-key--wide'}`}
          aria-label={name}
          // Pressing a button takes focus from the editor, which closes the
          // phone's keyboard. Stopping that here keeps the cursor where it is.
          onPointerDown={(e) => e.preventDefault()}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onKey(text)}
        >
          {text.trim() ? text : 'indent'}
        </button>
      ))}
    </div>
  );
}

/**
 * CodeRunnerPython
 *
 * Props:
 *   lessonId    {number}  — picks starter code from LESSON_STARTER map
 *   starterCode {string}  — override starter code directly
 *   title       {string}  — panel title (default: "Python Playground")
 *   height      {string}  — CodeMirror editor height (default: "220px")
 *   onOutput    {fn}      — called with output string after each run
 *   onBusy      {fn}      — called with true when Run is pressed, false when the run is over
 */
const CodeRunnerPython = ({
  lessonId,
  starterCode,
  title,
  height = '220px',
  onOutput,
  onBusy,
  // Long lines fold instead of sliding the start of the line off a phone.
  wrap = false,
  // A lesson that shows variables as boxes asks for what each name holds
  // after the run; it arrives as `vars` beside `success`.
  watchVariables = false,
  // The symbols Python needs and a phone keyboard hides (see SymbolKeys
  // below). Shown on touch screens; `true` or `false` forces it either way.
  symbolKeys = 'touch',
  // 'mount' downloads Python as soon as this editor appears, which is right on
  // a page the visitor opened in order to run Python. 'demand' waits for the
  // first Run, which is right for an editor embedded in a page somebody came
  // to read: a ten megabyte download nobody asked for is not a welcome.
  loadPython = 'mount',
  // 'dark' for the night screens (the child's home); the chrome around the
  // editor is themed by the page, this only switches the editor itself.
  theme = 'light',
}) => {
  const initialCode = starterCode || LESSON_STARTER[lessonId] || DEFAULT_CODE;

  const [code, setCode]       = useState(initialCode);
  const [output, setOutput]   = useState('');
  const [pyReady, setPyReady] = useState(false);
  const [running, setRunning] = useState(false);
  const [failed, setFailed]   = useState(false);   // the last run ended in a Python error
  // Separate from `running`. Python is roughly ten megabytes and on a phone on
  // cellular it is a real wait, so the wait has to be visible and it has to be
  // named: "Starting Python..." tells a child the machine heard them, and
  // "Running..." means their own code is going. One word for both is how a
  // button ends up looking dead.
  const [starting, setStarting] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const outputRef             = useRef(null);
  const mountedRef            = useRef(true);
  const editorRef             = useRef(null);
  const runWaiting            = useRef(false);  // a Run that is waiting for Python, or running
  const editorApi             = useRef(null);   // the editor on screen, for typing a symbol at the cursor
  // The coloured editor if it has arrived, null if it was stopped on the way
  // (then the plain one is used), undefined while it is still coming.
  const [Editor, setEditor]   = useState(() => editorNow());
  const [touch] = useState(() => {
    try { return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(pointer: coarse)').matches; } catch (e) { return false; }
  });
  const showKeys = symbolKeys === true || (symbolKeys === 'touch' && touch);
  // Put text where the cursor is, and keep the keyboard up.
  const typeAtCursor = useCallback((text) => {
    const editor = editorApi.current;
    if (!editor || !editor.typeAtCursor(text)) setCode((current) => current + text);
  }, []);

  useEffect(() => {
    if (Editor !== undefined) return undefined;
    let here = true;
    fetchEditor().then((editor) => { if (here) setEditor(() => editor); });
    return () => { here = false; };
  }, [Editor]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ── Starting Python ────────────────────────────────────────────────────────
  //
  // The bug this replaces: the first Run on /playground appeared to do nothing
  // for about thirty seconds. Pyodide is roughly ten megabytes, the button said
  // "Loading..." in the same small grey type as everything else, and there was
  // no progress of any kind. On a phone on cellular that is a page a parent
  // closes, and closing it is the correct response to a button that gives no
  // sign it heard you.
  // `asked` is true when a person pressed Run. A quiet preload that fails says
  // nothing: an error banner on a page nobody has touched yet is a page that
  // looks broken on arrival. The banner waits until someone has actually asked
  // for something and not got it.
  const startPython = useCallback((asked = false) => {
    if (typeof window !== 'undefined' && window.pyodide) {
      setPyReady(true);
      return Promise.resolve(window.pyodide);
    }
    setStarting(true);
    setLoadFailed(false);
    return getPyodideRuntime()
      .then((py) => {
        if (mountedRef.current) { setPyReady(true); setStarting(false); }
        return py;
      })
      .catch((err) => {
        console.error('CodeRunnerPython: Pyodide error', err);
        if (mountedRef.current) {
          setStarting(false);
          if (asked) {
            setLoadFailed(true);
            setOutput('Python could not start. Check the connection and press Run again.');
          }
        }
        return null;
      });
  }, []);

  // ── When Python is fetched ────────────────────────────────────────────────
  //
  // It used to start the moment a lesson opened. Measured on 13 November 2026
  // (PageSpeed Insights, a mid-range phone on slow 4G): starting Python kept
  // the page busy for seven seconds while it was still drawing itself, six
  // megabytes on a page nobody had touched yet. So it now starts at the first
  // sign of a person (a tap, a key) or after a few quiet seconds, whichever
  // comes first. A Run pressed before then starts it and says so, as it
  // always has.
  useEffect(() => {
    if (loadPython !== 'mount') return undefined;
    if (typeof window === 'undefined') return undefined;
    if (window.pyodide) { startPython(); return undefined; }
    const signs = ['pointerdown', 'keydown', 'touchstart'];
    let timer = null;
    const stop = () => {
      clearTimeout(timer);
      signs.forEach((name) => window.removeEventListener(name, begin, true));
    };
    function begin() { stop(); startPython(); }
    signs.forEach((name) => window.addEventListener(name, begin, { capture: true, passive: true }));
    timer = setTimeout(begin, PYTHON_AFTER_MS);
    return stop;
  }, [loadPython, startPython]);

  const runOnce = useCallback(async () => {
    // The engaged start for Python: a Run pressed, on any surface that runs
    // it (a lesson, the playground, the editor on the home page). Once per
    // session; the result of the run is a separate question.
    void trackActivityStart('python-run');
    if (onBusy) onBusy(true);
    // A Run pressed before Python has arrived is not ignored: it starts the
    // download and then runs. The old code returned silently here, which is the
    // other half of why the button looked dead.
    if (!window.pyodide) {
      const py = await startPython(true);
      if (!py || !mountedRef.current) { if (onBusy) onBusy(false); return; }
    }
    setRunning(true);
    setOutput('');
    setFailed(false);

    try {
      window.printOutput = '';
      const timeout = new Promise((_, rej) =>
        setTimeout(() => rej(new Error('⏱ Execution timed out (10 s limit)')), 10_000)
      );
      await Promise.race([window.pyodide.runPythonAsync(code), timeout]);

      const result = (window.printOutput || '').trimEnd();
      if (mountedRef.current) setOutput(result || '(no output)');
      // The student's code goes with the output: a lesson step needs to check
      // that the idea it taught is actually in there, not just that something
      // printed. Second argument, so existing callers keep working unchanged.
      if (onOutput) onOutput(result || '', code, watchVariables ? { success: true, vars: readVariables(window.pyodide, code) } : { success: true });
    } catch (err) {
      const raw = err.message || 'An error occurred';
      // The sentence a child can act on, then Python's own last line. The
      // sentence alone also goes to whoever is listening, so a lesson's
      // stage can say it.
      const msg = errorOutput(raw);
      if (mountedRef.current) { setOutput(msg); setFailed(true); }
      if (onOutput) onOutput(msg, code, { success: false, say: explainPythonError(raw).say });
    } finally {
      if (mountedRef.current) setRunning(false);
      if (onBusy) onBusy(false);
      if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [code, startPython, onOutput, onBusy, watchVariables]);

  const runCode = useCallback(async () => {
    // One Run at a time. A Run pressed while Python is still on its way is
    // kept, and runs when Python lands: it used to be dropped (the button was
    // switched off while Python started), so a child whose first tap on the
    // page was Run watched "Starting Python" finish and then nothing happen.
    if (runWaiting.current) return;
    runWaiting.current = true;
    try {
      await runOnce();
    } finally {
      runWaiting.current = false;
    }
  }, [runOnce]);

  const handleShortcut = useCallback((event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      runCode();
    }
  }, [runCode]);

  const resetCode = useCallback(() => {
    setCode(initialCode);
    setOutput('');
    setFailed(false);
  }, [initialCode]);

  return (
    <div className="cr-wrap">
      {/* ── Header bar ─────────────────────────────── */}
      <div className="cr-header">
        <span className="cr-title">{title || 'Python Playground'}</span>
        <div className="cr-actions">
          <button
            className="cr-btn cr-btn--reset"
            onClick={resetCode}
            title="Reset to starter code"
          >
            ↺ Reset
          </button>
          <button
            className={`cr-btn cr-btn--run${running || starting ? ' cr-btn--busy' : ''}`}
            onClick={runCode}
            disabled={running}
            aria-busy={running || starting}
            title={pyReady ? 'Run your Python code (Ctrl+Enter)' : 'Python starts the first time you press Run'}
          >
            {starting && <span className="cr-spinner" aria-hidden="true" />}
            {starting ? 'Starting Python…' : running ? 'Running…' : <><Icon name="play" size={14} /> Run</>}
          </button>
        </div>
      </div>

      {/* Said out loud, not only on the button: on a small screen the button
          label is the smallest text on the page, and this is the sentence that
          buys the thirty seconds. It occupies no space until it is true. */}
      {starting && (
        <p className="cr-starting" role="status">
          Starting Python in your browser. The first run takes a few seconds, then it is instant.
        </p>
      )}
      {loadFailed && !starting && (
        <p className="cr-starting cr-starting--failed" role="status">
          Python did not start. Check the connection and press Run again.
        </p>
      )}

      {/* ── Editor ─────────────────────────────────── */}
      {/* Ctrl+Enter was printed as a tip on /playground and was never wired to
          anything. A promise the product does not keep is worse than no tip. */}
      {showKeys && <SymbolKeys onKey={typeAtCursor} />}
      <div className="cr-editor" ref={editorRef} onKeyDown={handleShortcut}>
        {Editor === undefined ? (
          <pre className="cr-editor-wait" style={{ height }} aria-hidden="true">{code}</pre>
        ) : Editor ? (
          <Editor ref={editorApi} value={code} height={height} theme={theme} wrap={wrap} onChange={setCode} />
        ) : (
          <PlainEditor ref={editorApi} value={code} height={height} theme={theme} onChange={setCode} />
        )}
      </div>

      {/* ── Output panel ───────────────────────────── */}
      <div className="cr-output-wrap" ref={outputRef}>
        <span className="cr-output-label">Output</span>
        <pre
          className={`cr-output${failed || output.startsWith('❌') ? ' cr-output--error' : ''}`}
        >
          {output || 'Press Run and the output appears here.'}
        </pre>
      </div>
    </div>
  );
};

export default CodeRunnerPython;
