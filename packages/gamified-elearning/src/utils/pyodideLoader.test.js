describe('getPyodideRuntime', () => {
  beforeEach(() => {
    jest.resetModules();
    delete window.pyodide;
    delete window.loadPyodide;
    delete window.printOutput;
    document.getElementById('codeit-pyodide-loader')?.remove();
  });

  test('deduplicates concurrent runtime initialization', async () => {
    const runtime = { setStdout: jest.fn() };
    window.loadPyodide = jest.fn().mockResolvedValue(runtime);
    const { getPyodideRuntime } = require('./pyodideLoader');

    const first = getPyodideRuntime();
    const second = getPyodideRuntime();

    // No workers in this test's browser, so Python starts on the page. What
    // comes back is a handle with run(), the same one for both callers.
    const handle = await first;
    expect(handle.kind).toBe('page');
    expect(typeof handle.run).toBe('function');
    await expect(second).resolves.toBe(handle);
    expect(window.pyodide).toBe(handle);
    expect(window.loadPyodide).toHaveBeenCalledTimes(1);
    expect(runtime.setStdout).toHaveBeenCalledTimes(1);
  });

  test('allows a retry after runtime initialization fails', async () => {
    const runtime = { setStdout: jest.fn() };
    window.loadPyodide = jest.fn()
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockResolvedValueOnce(runtime);
    const { getPyodideRuntime } = require('./pyodideLoader');

    await expect(getPyodideRuntime()).rejects.toThrow('temporary failure');
    await expect(getPyodideRuntime()).resolves.toEqual(expect.objectContaining({ kind: 'page' }));
    expect(window.loadPyodide).toHaveBeenCalledTimes(2);
  });

  test('removes a loaded script that did not provide an initializer', async () => {
    const { getPyodideRuntime } = require('./pyodideLoader');
    const attempt = getPyodideRuntime();
    // A worker is tried first; with none here, the page's own script follows
    // a moment later.
    await new Promise((resolve) => setTimeout(resolve, 0));
    const script = document.getElementById('codeit-pyodide-loader');

    script.dispatchEvent(new Event('load'));

    await expect(attempt).rejects.toThrow('without its initializer');
    expect(document.getElementById('codeit-pyodide-loader')).toBeNull();
  });
});

test('Python is fetched from this site first, and from the CDN only when that fails', async () => {
  const { PYODIDE_BASES } = require('./pyodideLoader');
  expect(PYODIDE_BASES[0]).toBe(`${window.location.origin}/pyodide/v0.29.0/full/`);
  expect(PYODIDE_BASES[1]).toMatch(/^https:\/\/cdn\.jsdelivr\.net\/pyodide\//);

  // The same-origin script fails (a proxy fault), the CDN one loads: the
  // runtime is then told to fetch its files from the CDN too.
  const runtime = { setStdout: jest.fn() };
  const appended = [];
  const realAppend = document.head.appendChild.bind(document.head);
  document.head.appendChild = (el) => {
    appended.push(el.src);
    realAppend(el);
    setTimeout(() => {
      if (el.src.startsWith('https://cdn.jsdelivr.net/')) { window.loadPyodide = jest.fn().mockResolvedValue(runtime); el.dispatchEvent(new Event('load')); }
      else el.dispatchEvent(new Event('error'));
    }, 0);
    return el;
  };
  try {
    const { getPyodideRuntime } = require('./pyodideLoader');
    await expect(getPyodideRuntime()).resolves.toEqual(expect.objectContaining({ kind: 'page' }));
    expect(appended[0]).toContain('/pyodide/v0.29.0/full/pyodide.js');
    expect(appended[1]).toBe('https://cdn.jsdelivr.net/pyodide/v0.29.0/full/pyodide.js');
    expect(window.loadPyodide).toHaveBeenCalledWith({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.29.0/full/' });
  } finally {
    document.head.appendChild = realAppend;
  }
});

// ── Python in a worker ───────────────────────────────────────────────────────
// 21 November 2026: `while True: pass` locked the tab. The ten-second timer
// ran on the same thread as the loop, so it could never fire. Python now runs
// in a worker and the page ends the worker when the time is up. These use a
// stand-in worker that the test drives; the real one is run in a browser by
// ops/checks and by hand.
describe('Python in a worker', () => {
  let made;
  class FakeWorker {
    constructor(url) { this.url = url; this.sent = []; this.terminated = false; made.push(this); }
    postMessage(message) { this.sent.push(message); }
    terminate() { this.terminated = true; }
    answer(message) { this.onmessage({ data: message }); }
  }
  beforeEach(() => {
    jest.resetModules();
    made = [];
    delete window.pyodide;
    delete window.loadPyodide;
    window.Worker = FakeWorker;
  });
  afterEach(() => { delete window.Worker; delete window.pyodide; jest.useRealTimers(); });

  test('starts from this site\'s own worker file, with this site first in the list of places to fetch Python', async () => {
    const { getPyodideRuntime, PYODIDE_BASES } = require('./pyodideLoader');
    const starting = getPyodideRuntime();
    expect(made).toHaveLength(1);
    expect(made[0].url).toBe(`${window.location.origin}/py-worker.js?v=1`);
    expect(made[0].sent[0]).toEqual({ type: 'start', bases: PYODIDE_BASES });
    made[0].answer({ type: 'ready', base: PYODIDE_BASES[0] });
    const handle = await starting;
    expect(handle.kind).toBe('worker');
    expect(window.pyodide).toBe(handle);
    // Asked again, the same Python: one worker for the page.
    await expect(getPyodideRuntime()).resolves.toBe(handle);
    expect(made).toHaveLength(1);
  });

  test('a run comes back with what was printed and what is in the boxes', async () => {
    const { getPyodideRuntime } = require('./pyodideLoader');
    const starting = getPyodideRuntime();
    made[0].answer({ type: 'ready', base: 'x' });
    const handle = await starting;
    const running = handle.run('print("hi")', { varsSource: 'the boxes' });
    const sent = made[0].sent[1];
    expect(sent).toEqual({ type: 'run', id: 1, code: 'print("hi")', varsSource: 'the boxes' });
    made[0].answer({ type: 'done', id: 1, ok: true, output: 'hi\n', varsJson: '[]', error: '' });
    await expect(running).resolves.toEqual({ output: 'hi\n', varsJson: '[]' });
  });

  test('a Python error is Python\'s own words, and Python is still there afterwards', async () => {
    const { getPyodideRuntime } = require('./pyodideLoader');
    const starting = getPyodideRuntime();
    made[0].answer({ type: 'ready', base: 'x' });
    const handle = await starting;
    const running = handle.run('print(');
    made[0].answer({ type: 'done', id: 1, ok: false, output: '', varsJson: '', error: 'SyntaxError: \'(\' was never closed' });
    await expect(running).rejects.toThrow("SyntaxError: '(' was never closed");
    expect(made[0].terminated).toBe(false);
    expect(window.pyodide).toBe(handle);
  });

  test('code still running when the time is up is stopped: the worker is ended and a new Python is started', async () => {
    jest.useFakeTimers();
    const { getPyodideRuntime, RUN_LIMIT_MS, TIME_LIMIT_MESSAGE } = require('./pyodideLoader');
    const starting = getPyodideRuntime();
    made[0].answer({ type: 'ready', base: 'x' });
    const handle = await starting;
    const running = handle.run('while True:\n    pass');
    const outcome = running.then(() => 'finished', (error) => error);
    // Nothing answers: the loop never ends. The page's own clock runs out.
    jest.advanceTimersByTime(RUN_LIMIT_MS - 1);
    expect(made[0].terminated).toBe(false);
    jest.advanceTimersByTime(1);
    const error = await outcome;
    expect(error.timedOut).toBe(true);
    expect(error.message).toBe(TIME_LIMIT_MESSAGE);
    expect(error.message).toMatch(/Stopped after 10 seconds/);
    expect(made[0].terminated).toBe(true);
    // The stopped Python is not offered again, and another is already starting.
    expect(window.pyodide).toBeNull();
    expect(made).toHaveLength(2);
    expect(made[1].sent[0].type).toBe('start');
    made[1].answer({ type: 'ready', base: 'x' });
    const next = await getPyodideRuntime();
    expect(next).not.toBe(handle);
    expect(next.kind).toBe('worker');
    await expect(handle.run('print(1)')).rejects.toThrow('Python stopped before it finished.');
  });

  test('if Python will not start in a worker, it starts on the page as it used to', async () => {
    const runtime = { setStdout: jest.fn() };
    window.loadPyodide = jest.fn().mockResolvedValue(runtime);
    const { getPyodideRuntime } = require('./pyodideLoader');
    const starting = getPyodideRuntime();
    made[0].answer({ type: 'failed', message: 'Could not download the Python runtime.' });
    const handle = await starting;
    expect(made[0].terminated).toBe(true);
    expect(handle.kind).toBe('page');
    expect(window.loadPyodide).toHaveBeenCalledTimes(1);
  });

  test('the worker file is plain script that loads Python from the addresses it is given, and answers in the shapes the page expects', () => {
    const fs = require('fs');
    const path = require('path');
    const worker = fs.readFileSync(path.join(__dirname, '../../public/py-worker.js'), 'utf8');
    expect(worker).toMatch(/importScripts\(base \+ 'pyodide\.js'\)/);
    expect(worker).toMatch(/self\.loadPyodide\(\{ indexURL: base \}\)/);
    for (const type of ['ready', 'failed', 'done']) expect(worker).toContain(`type: '${type}'`);
    // No build step reads this file, so it must not need one.
    expect(worker).not.toMatch(/^\s*(import|export)\s/m);
    expect(worker).not.toMatch(/=>/);
  });
});
