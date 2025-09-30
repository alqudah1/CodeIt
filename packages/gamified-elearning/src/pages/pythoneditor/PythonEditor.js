import React, { useState, useEffect, useRef } from 'react';

const PythonEditor = ({ initialCode, onOutput }) => {
  const [code, setCode] = useState(initialCode || '');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const outputRef = useRef(null);

  useEffect(() => {
    const setupPyodide = async () => {
      try {
        const pyodide = await loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/',
        });

        window.printOutput = '';
        pyodide.setStdout({
          batched: (text) => {
            // add a newline when capturing output
            window.printOutput += text + "\n";
          },
        });

        setIsLoading(false);
        window.pyodide = pyodide;
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
      const errorText = err.message || 'An error occurred during execution.';
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
