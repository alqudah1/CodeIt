import React, { useState, useEffect, useRef, useCallback } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { getPyodideRuntime } from '../utils/pyodideLoader';
import './CodeRunnerPython.css';

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

const DEFAULT_CODE = `# Write your Python code here\nprint("Hello, Python!")`;

// Strip internal Pyodide traceback lines; keep only the user-relevant error
function cleanPythonError(raw) {
  if (!raw) return raw;
  const lines = raw.split('\n');
  const kept = lines.filter(line => {
    const t = line.trim();
    if (!t) return false;
    if (t.startsWith('File "/lib/')) return false;          // internal Pyodide paths
    if (/^\.\.\.<\d+ lines>/.test(t)) return false;         // collapsed internal frames
    if (t.startsWith('await CodeRunner(')) return false;
    if (t.startsWith('.run_async(')) return false;
    if (t.startsWith('coroutine = eval(')) return false;
    return true;
  });
  return kept.join('\n').replace(/\n{2,}/g, '\n').trim() || raw;
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
 */
const CodeRunnerPython = ({
  lessonId,
  starterCode,
  title,
  height = '220px',
  onOutput,
  // 'mount' downloads Python as soon as this editor appears, which is right on
  // a page the visitor opened in order to run Python. 'demand' waits for the
  // first Run, which is right for an editor embedded in a page somebody came
  // to read: a ten megabyte download nobody asked for is not a welcome.
  loadPython = 'mount',
}) => {
  const initialCode = starterCode || LESSON_STARTER[lessonId] || DEFAULT_CODE;

  const [code, setCode]       = useState(initialCode);
  const [output, setOutput]   = useState('');
  const [pyReady, setPyReady] = useState(false);
  const [running, setRunning] = useState(false);
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

  useEffect(() => {
    if (loadPython !== 'mount') return undefined;
    startPython();
    return undefined;
  }, [loadPython, startPython]);

  const runCode = useCallback(async () => {
    if (running || starting) return;
    // A Run pressed before Python has arrived is not ignored: it starts the
    // download and then runs. The old code returned silently here, which is the
    // other half of why the button looked dead.
    if (!window.pyodide) {
      const py = await startPython(true);
      if (!py || !mountedRef.current) return;
    }
    setRunning(true);
    setOutput('');

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
      if (onOutput) onOutput(result || '', code);
    } catch (err) {
      const raw = err.message || 'An error occurred';
      const msg = cleanPythonError(raw);
      if (mountedRef.current) setOutput(msg);
      if (onOutput) onOutput(msg, code);
    } finally {
      if (mountedRef.current) setRunning(false);
      if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [code, running, starting, startPython, onOutput]);

  const handleShortcut = useCallback((event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      runCode();
    }
  }, [runCode]);

  const resetCode = useCallback(() => {
    setCode(initialCode);
    setOutput('');
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
            disabled={running || starting}
            title={pyReady ? 'Run your Python code (Ctrl+Enter)' : 'Python starts the first time you press Run'}
          >
            {starting && <span className="cr-spinner" aria-hidden="true" />}
            {starting ? 'Starting Python…' : running ? 'Running…' : '▶ Run'}
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
      <div className="cr-editor" ref={editorRef} onKeyDown={handleShortcut}>
        <CodeMirror
          value={code}
          height={height}
          theme="light"
          extensions={[python()]}
          onChange={(val) => setCode(val)}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLine: true,
            tabSize: 4,
            indentOnInput: true,
            bracketMatching: true,
            autocompletion: false,
          }}
        />
      </div>

      {/* ── Output panel ───────────────────────────── */}
      <div className="cr-output-wrap" ref={outputRef}>
        <span className="cr-output-label">Output</span>
        <pre
          className={`cr-output${output.startsWith('❌') ? ' cr-output--error' : ''}`}
        >
          {output || 'Press Run and the output appears here.'}
        </pre>
      </div>
    </div>
  );
};

export default CodeRunnerPython;
