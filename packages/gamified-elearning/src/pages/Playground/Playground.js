import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../Header/Header';
import CodeRunnerPython from '../../components/CodeRunnerPython';
import { useSEO } from '../../hooks/useSEO';
import './Playground.css';

import { PRESETS } from './presets';

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
