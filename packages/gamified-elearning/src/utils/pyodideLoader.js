const PYODIDE_VERSION = '0.29.0';
// Python comes from this site first, through a Vercel rewrite that proxies
// jsDelivr (vercel.json: /pyodide/* -> cdn.jsdelivr.net/pyodide/*), so a
// school whose filter allows codeitlearn.com and nothing else still gets
// Python. A school in North Yorkshire wrote in on 10 November 2026: the
// teacher could open the lessons and the pupils could not, because their
// filter let the site through and not the CDN. The CDN stays as the fallback
// for the case where the proxy itself is what fails.
const ORIGIN = typeof window !== 'undefined' && window.location ? window.location.origin : '';
const PYODIDE_BASES = [
  `${ORIGIN}/pyodide/v${PYODIDE_VERSION}/full/`,
  `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`,
];
let PYODIDE_BASE_URL = PYODIDE_BASES[0];
const SCRIPT_ID = 'codeit-pyodide-loader';

let scriptPromise = null;
let runtimePromise = null;

function loadScriptFrom(base) {
  return new Promise((resolve, reject) => {
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
      script.src = `${base}pyodide.js`;
      script.async = true;
      document.head.appendChild(script);
    }
  });
}

function loadScript() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Python is only available in the browser.'));
  }
  if (typeof window.loadPyodide === 'function') return Promise.resolve(window.loadPyodide);
  if (scriptPromise) return scriptPromise;

  // Each base in turn; the one that loads is the one the runtime's files
  // (the wasm, the standard library) are fetched from as well. A script
  // that loaded but was not Python is not a download problem, so the next
  // base is not tried for it.
  scriptPromise = (async () => {
    let lastError = new Error('Could not download the Python runtime.');
    for (const base of PYODIDE_BASES) {
      try {
        const fn = await loadScriptFrom(base);
        PYODIDE_BASE_URL = base;
        return fn;
      } catch (error) {
        lastError = error;
        if (/without its initializer/.test(error.message)) throw error;
      }
    }
    throw lastError;
  })().catch((error) => {
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

export { PYODIDE_BASE_URL, PYODIDE_BASES };
