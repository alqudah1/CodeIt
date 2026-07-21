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
const CodeRunnerPython = ({ lessonId, starterCode, title, height = '220px', onOutput }) => {
  const initialCode = starterCode || LESSON_STARTER[lessonId] || DEFAULT_CODE;

  const [code, setCode]       = useState(initialCode);
  const [output, setOutput]   = useState('');
  const [pyReady, setPyReady] = useState(false);
  const [running, setRunning] = useState(false);
  const outputRef             = useRef(null);
  const mountedRef            = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Load Python only when a runner is actually mounted on a lesson or playground.
  useEffect(() => {
    let cancelled = false;
    getPyodideRuntime()
      .then(() => {
        if (!cancelled && mountedRef.current) setPyReady(true);
      })
      .catch((err) => {
        console.error('CodeRunnerPython: Pyodide error', err);
        if (!cancelled && mountedRef.current) setOutput('❌ Could not load Python. Please refresh and try again.');
      });

    return () => { cancelled = true; };
  }, []);

  const runCode = useCallback(async () => {
    if (!window.pyodide || running) return;
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
      if (onOutput) onOutput(result || '');
    } catch (err) {
      const raw = err.message || 'An error occurred';
      const msg = cleanPythonError(raw);
      if (mountedRef.current) setOutput('❌ ' + msg);
      if (onOutput) onOutput(msg);
    } finally {
      if (mountedRef.current) setRunning(false);
      if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [code, running, onOutput]);

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
            className={`cr-btn cr-btn--run${running ? ' cr-btn--busy' : ''}`}
            onClick={runCode}
            disabled={!pyReady || running}
            title={pyReady ? 'Run your Python code (Ctrl+Enter)' : 'Loading Python interpreter…'}
          >
            {running ? 'Running...' : pyReady ? '▶ Run' : 'Loading...'}
          </button>
        </div>
      </div>

      {/* ── Editor ─────────────────────────────────── */}
      <div className="cr-editor">
        <CodeMirror
          value={code}
          height={height}
          theme="dark"
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
          {output || '— run your code to see output here —'}
        </pre>
      </div>
    </div>
  );
};

export default CodeRunnerPython;
