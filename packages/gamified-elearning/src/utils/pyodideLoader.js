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

// ── Where Python runs ────────────────────────────────────────────────────────
//
// In a worker (public/py-worker.js), not on the page. On the page, a child's
// `while True: pass` held the only thread there is: the ten-second timer
// that was meant to stop it could not fire, and the tab locked up. From the
// page, a worker can always be ended, so the limit is now one that works: when
// the time is up the worker is ended, the child is told, and a new Python is
// started for the next Run.
//
// What callers get is a handle, not Pyodide itself:
//   handle.run(code, { varsSource, timeoutMs }) -> { output, varsJson }
// It rejects with an Error for a Python error (the message is Python's own),
// and with `error.timedOut === true` when the limit stopped it.
//
// The page is still the fallback. If a worker cannot be made, or Python will
// not start inside one, Python starts on the page the way it always did, with
// the old timer, which still cannot stop an endless loop. That is worse than a
// worker and better than no Python.
const WORKER_URL = `${ORIGIN}/py-worker.js?v=1`;
const RUN_LIMIT_MS = 10_000;
const RUN_LIMIT_SECONDS = RUN_LIMIT_MS / 1000;
const TIME_LIMIT_MESSAGE = `⏱ Stopped after ${RUN_LIMIT_SECONDS} seconds. A loop that never ends does this. Check that something inside the loop changes, so the loop can finish.`;

let scriptPromise = null;
let runtimePromise = null;

function timeLimitError() {
  const error = new Error(TIME_LIMIT_MESSAGE);
  error.timedOut = true;
  return error;
}

function setCurrent(handle) {
  if (typeof window !== 'undefined') window.pyodide = handle;
}

// ── In a worker ──────────────────────────────────────────────────────────────

function workerHandle(worker) {
  const waiting = new Map();
  let count = 0;
  let ended = false;
  const handle = { kind: 'worker', run };

  function end() {
    if (ended) return;
    ended = true;
    try { worker.terminate(); } catch (e) { /* already gone */ }
    if (typeof window !== 'undefined' && window.pyodide === handle) window.pyodide = null;
    runtimePromise = null;
  }

  worker.onmessage = (event) => {
    const message = event.data || {};
    if (message.type !== 'done') return;
    const job = waiting.get(message.id);
    if (!job) return;
    waiting.delete(message.id);
    clearTimeout(job.timer);
    if (message.ok) job.resolve({ output: message.output || '', varsJson: message.varsJson || '' });
    else job.reject(new Error(message.error || 'An error occurred'));
  };
  // The worker itself broke. Whatever was running is told, and the next Run
  // starts a new one.
  worker.onerror = () => {
    end();
    waiting.forEach((job) => { clearTimeout(job.timer); job.reject(new Error('Python stopped before it finished.')); });
    waiting.clear();
  };

  function run(code, { varsSource = '', timeoutMs = RUN_LIMIT_MS } = {}) {
    if (ended) return Promise.reject(new Error('Python stopped before it finished.'));
    return new Promise((resolve, reject) => {
      count += 1;
      const id = count;
      const timer = setTimeout(() => {
        // Time is up. Ending the worker is the one thing an endless loop
        // cannot ignore. Anything else waiting on it is told too.
        end();
        waiting.forEach((job) => { clearTimeout(job.timer); job.reject(timeLimitError()); });
        waiting.clear();
        // A new Python for the next Run, started now so it is not a wait then.
        getPyodideRuntime().catch(() => {});
      }, timeoutMs);
      waiting.set(id, { resolve, reject, timer });
      worker.postMessage({ type: 'run', id, code: String(code), varsSource });
    });
  }

  return handle;
}

function startInWorker() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || typeof window.Worker !== 'function') {
      reject(new Error('No workers here.'));
      return;
    }
    let worker;
    try {
      worker = new window.Worker(WORKER_URL);
    } catch (error) {
      reject(error);
      return;
    }
    const give = (error) => {
      try { worker.terminate(); } catch (e) { /* already gone */ }
      reject(error);
    };
    worker.onmessage = (event) => {
      const message = event.data || {};
      if (message.type === 'ready') {
        if (message.base) PYODIDE_BASE_URL = message.base;
        resolve(workerHandle(worker));
      } else if (message.type === 'failed') {
        give(new Error(message.message || 'Could not download the Python runtime.'));
      }
    };
    worker.onerror = () => give(new Error('Python could not start in a worker.'));
    worker.postMessage({ type: 'start', bases: PYODIDE_BASES });
  });
}

// ── On the page (the fallback) ───────────────────────────────────────────────

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

function pageHandle(pyodide) {
  return {
    kind: 'page',
    async run(code, { varsSource = '', timeoutMs = RUN_LIMIT_MS } = {}) {
      window.printOutput = '';
      let timer;
      const limit = new Promise((_, reject) => { timer = setTimeout(() => reject(timeLimitError()), timeoutMs); });
      try {
        await Promise.race([pyodide.runPythonAsync(String(code)), limit]);
      } finally {
        clearTimeout(timer);
      }
      let varsJson = '';
      if (varsSource) {
        try { varsJson = String(pyodide.runPython(varsSource) || ''); } catch (e) { varsJson = ''; }
      }
      return { output: window.printOutput || '', varsJson };
    },
  };
}

function startOnPage() {
  return loadScript()
    .then((loadPyodide) => loadPyodide({ indexURL: PYODIDE_BASE_URL }))
    .then((pyodide) => {
      window.printOutput = '';
      pyodide.setStdout({
        batched: (text) => { window.printOutput += `${text}\n`; },
      });
      return pageHandle(pyodide);
    });
}

// ── What the rest of the site calls ──────────────────────────────────────────

export function getPyodideRuntime() {
  if (typeof window !== 'undefined' && window.pyodide) return Promise.resolve(window.pyodide);
  if (runtimePromise) return runtimePromise;

  const attempt = startInWorker()
    .catch(() => startOnPage())
    .then((handle) => {
      setCurrent(handle);
      return handle;
    })
    .catch((error) => {
      if (runtimePromise === attempt) runtimePromise = null;
      throw error;
    });
  runtimePromise = attempt;

  return runtimePromise;
}

export { PYODIDE_BASE_URL, PYODIDE_BASES, RUN_LIMIT_MS, TIME_LIMIT_MESSAGE, WORKER_URL };
