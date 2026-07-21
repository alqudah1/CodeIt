const PYODIDE_VERSION = '0.29.0';
const PYODIDE_BASE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
const SCRIPT_ID = 'codeit-pyodide-loader';

let scriptPromise = null;
let runtimePromise = null;

function loadScript() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Python is only available in the browser.'));
  }
  if (typeof window.loadPyodide === 'function') return Promise.resolve(window.loadPyodide);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID);
    const script = existing || document.createElement('script');

    const handleLoad = () => {
      if (typeof window.loadPyodide === 'function') resolve(window.loadPyodide);
      else {
        script.remove();
        reject(new Error('Python runtime loaded without its initializer.'));
      }
    };
    const handleError = () => {
      script.remove();
      reject(new Error('Could not download the Python runtime.'));
    };

    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });

    if (!existing) {
      script.id = SCRIPT_ID;
      script.src = `${PYODIDE_BASE_URL}pyodide.js`;
      script.async = true;
      document.head.appendChild(script);
    }
  }).catch((error) => {
    scriptPromise = null;
    throw error;
  });

  return scriptPromise;
}

export function getPyodideRuntime() {
  if (typeof window !== 'undefined' && window.pyodide) return Promise.resolve(window.pyodide);
  if (runtimePromise) return runtimePromise;

  runtimePromise = loadScript()
    .then((loadPyodide) => loadPyodide({ indexURL: PYODIDE_BASE_URL }))
    .then((pyodide) => {
      window.printOutput = '';
      pyodide.setStdout({
        batched: (text) => { window.printOutput += `${text}\n`; },
      });
      window.pyodide = pyodide;
      return pyodide;
    })
    .catch((error) => {
      runtimePromise = null;
      throw error;
    });

  return runtimePromise;
}

export { PYODIDE_BASE_URL };
