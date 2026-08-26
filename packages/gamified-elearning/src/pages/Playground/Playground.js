import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../Header/Header';
import CodeRunnerPython from '../../components/CodeRunnerPython';
import { useSEO } from '../../hooks/useSEO';
import './Playground.css';

const PRESETS = [
  {
    label: 'Hello World',
    code: '# Print a message to the screen\nprint("Hello, World!")\nprint("Welcome to Python!")',
  },
  {
    label: 'Variables',
    code: '# Store values in variables\nname = "Alex"\nage = 12\nfavorite = "coding"\n\nprint(name)\nprint(age)\nprint("I love " + favorite)',
  },
  {
    label: 'If / Else',
    code: '# Make decisions with if/else\nscore = 85\n\nif score >= 90:\n    print("Grade: A")\nelif score >= 80:\n    print("Grade: B")\nelif score >= 70:\n    print("Grade: C")\nelse:\n    print("Grade: F")',
  },
  {
    label: 'For Loop',
    code: '# Repeat code with a for loop\nfor i in range(1, 6):\n    print("Step", i)\n\nprint("Done!")',
  },
  {
    label: 'Lists',
    code: '# Work with lists\nfruits = ["apple", "banana", "cherry"]\n\nfor fruit in fruits:\n    print("I like", fruit)\n\nfruits.append("mango")\nprint("Total fruits:", len(fruits))',
  },
  {
    label: 'Functions',
    code: '# Define reusable functions\ndef greet(name):\n    return "Hello, " + name + "!"\n\ndef add(a, b):\n    return a + b\n\nprint(greet("Alex"))\nprint(greet("Sam"))\nprint("3 + 4 =", add(3, 4))',
  },
  {
    label: 'Strings',
    code: '# String methods\nword = "python"\n\nprint(word.upper())\nprint(word.capitalize())\nprint(len(word))\nprint("hello " + word)',
  },
  {
    label: 'Math',
    code: 'import math\n\nprint("Pi =", round(math.pi, 4))\nprint("Square root of 25 =", math.sqrt(25))\nprint("2 to the power 8 =", 2 ** 8)\nprint("Absolute value of -7 =", abs(-7))',
  },
  {
    label: 'Booleans',
    code: '# Compare values to get True or False\na = 10\nb = 7\nprint("a == b:", a == b)\nprint("a > b:", a > b)\nprint("a != b:", a != b)\n\n# Logical operators\nprint("a > 5 and b > 5:", a > 5 and b > 5)\nprint("a > 15 or b > 5:", a > 15 or b > 5)\nprint("not (a == b):", not (a == b))',
  },
  {
    label: 'Type Casting',
    code: '# Convert between types\ntext = "42"\nnumber = int(text)\nprint("int:", number, type(number))\n\ndecimal = float("3.14")\nprint("float:", decimal, type(decimal))\n\nas_string = str(100)\nprint("str:", as_string, type(as_string))\n\nprint("int division:", 7 // 2)\nprint("remainder:", 7 % 2)',
  },
  {
    label: 'F-Strings',
    code: '# Build clean output with f-strings\nname = "Alex"\nage = 14\nscore = 98.5\n\nprint(f"Hello, {name}!")\nprint(f"Age: {age}")\nprint(f"Score: {score:.1f}")\nprint(f"{name} scored {score:.0f} points at age {age}.")',
  },
];

const Playground = () => {
  const navigate = useNavigate();

  useSEO({
    canonical:   '/playground',
  });

  const [activePreset, setActivePreset] = useState(0);
  // key forces CodeRunnerPython to remount (reset code) when preset changes
  const [editorKey, setEditorKey] = useState(0);

  const selectPreset = (idx) => {
    setActivePreset(idx);
    setEditorKey(k => k + 1);
  };

  return (
    <div className="pg-page">
      <Header />

      <div className="pg-body">
        {/* ── Back nav ─────────────────────────────────── */}
        <nav className="pg-breadcrumb" aria-label="Page navigation">
          <button className="pg-back-btn" onClick={() => navigate(-1)}>
            &#8592; Back
          </button>
          <span className="pg-breadcrumb__sep" aria-hidden="true">/</span>
          <span className="pg-breadcrumb__current">Playground</span>
        </nav>

        {/* ── Page heading ─────────────────────────────── */}
        <div className="pg-heading">
          <span className="pg-heading__tag">Free Python Sandbox</span>
          <h1 className="pg-title">Python Playground</h1>
          <p className="pg-subtitle">
            Write and run Python code right in your browser. No install needed.
          </p>
        </div>

        {/* ── Preset bar ───────────────────────────────── */}
        <div className="pg-presets-panel">
          <p className="pg-section-label">Starter Templates</p>
          <div className="pg-presets" role="group" aria-label="Code presets">
            {PRESETS.map((p, i) => (
              <button
                key={p.label}
                className={`pg-preset-btn${i === activePreset ? ' pg-preset-btn--active' : ''}`}
                onClick={() => selectPreset(i)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Editor ───────────────────────────────────── */}
        <div className="pg-editor-wrap">
          <CodeRunnerPython
            key={editorKey}
            starterCode={PRESETS[activePreset].code}
            title={PRESETS[activePreset].label}
            height="380px"
          />
        </div>

        {/* ── Tips ─────────────────────────────────────── */}
        <div className="pg-tips">
          <span className="pg-tip">Ctrl+Enter to run</span>
          <span className="pg-tip-sep" aria-hidden="true">·</span>
          <span className="pg-tip">Python runs in your browser via Pyodide</span>
          <span className="pg-tip-sep" aria-hidden="true">·</span>
          <span className="pg-tip">Edit any template and make it yours</span>
        </div>
      </div>
    </div>
  );
};

export default Playground;
