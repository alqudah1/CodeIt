import React, { useState, useEffect, useRef } from 'react';
import { getPyodideRuntime } from '../../utils/pyodideLoader';

function cleanPythonError(raw) {
  if (!raw) return raw;
  const lines = raw.split('\n');
  const kept = lines.filter(line => {
    const t = line.trim();
    if (!t) return false;
    if (t.startsWith('File "/lib/')) return false;
    if (/^\.\.\.<\d+ lines>/.test(t)) return false;
    if (t.startsWith('await CodeRunner(')) return false;
    if (t.startsWith('.run_async(')) return false;
    if (t.startsWith('coroutine = eval(')) return false;
    return true;
  });
  return kept.join('\n').replace(/\n{2,}/g, '\n').trim() || raw;
}

const PythonEditor = ({ initialCode, onOutput }) => {
  const [code, setCode] = useState(initialCode || '');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const outputRef = useRef(null);

  useEffect(() => {
    const setupPyodide = async () => {
      try {
        await getPyodideRuntime();
        setIsLoading(false);
      } catch (err) {
        console.error('Pyodide load error:', err);
        setOutput('Error loading Python interpreter: ' + err.message);
        setIsLoading(false);
      }
    };
    setupPyodide();
  }, []);

  const runCode = async () => {
    if (isLoading || !window.pyodide) return;

    setOutput('');
    try {
      window.printOutput = ''; 
      await window.pyodide.runPythonAsync(code);

      const outputText = window.printOutput.trimEnd();
      setOutput(outputText || '');

      if (onOutput) onOutput(outputText || '');
    } catch (err) {
      console.error('Execution error:', err);
      const errorText = cleanPythonError(err.message || 'An error occurred during execution.');
      setOutput(errorText);
      if (onOutput) onOutput(errorText);
    }

    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  };

  const handleCodeChange = (e) => {
    setCode(e.target.value);
  };

  return (
    <div className="python-editor">
      <h3>Your Sunny Challenge:</h3>
      <textarea
        value={code}
        onChange={handleCodeChange}
        className="code-editor"
        placeholder="Write your Python code here..."
        rows={6}
      />
      <button onClick={runCode} className="run-button" disabled={isLoading}>
        Run Code ▶️
      </button>
      {isLoading && <p>Loading Python interpreter...</p>}
      <pre ref={outputRef} className="editor-output">
        {output || 'Run your code to see output here!'}
      </pre>
    </div>
  );
};

export default PythonEditor;
