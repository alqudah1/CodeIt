/* Python, off the page's own thread.
 *
 * The lessons and the playground used to run a child's Python on the page
 * itself, with a ten-second timer beside it. A timer on the same thread
 * cannot fire while that thread is busy, so `while True: pass` did not stop
 * after ten seconds: it locked the tab (21 November 2026). Python now runs
 * here, in a worker. The page keeps its own clock, and when the time is up it
 * ends this worker and starts another, which nothing running in here can
 * prevent.
 *
 * Messages in:   { type: 'start', bases: [url, ...] }
 *                { type: 'run', id, code, varsSource }
 * Messages out:  { type: 'ready', base }   { type: 'failed', message }
 *                { type: 'done', id, ok, output, varsJson, error }
 *
 * Plain script, no build step: it is fetched from this site like any other
 * file, and loads Python from the same addresses the page always used (this
 * site first, so a school filter that allows only this site still gets it).
 */
var pyodide = null;
var printed = '';
var queue = Promise.resolve();

function start(bases) {
  var index = 0;
  var lastMessage = 'Could not download the Python runtime.';
  function tryNext() {
    if (index >= bases.length) {
      self.postMessage({ type: 'failed', message: lastMessage });
      return Promise.resolve();
    }
    var base = bases[index];
    index += 1;
    try {
      importScripts(base + 'pyodide.js');
    } catch (error) {
      lastMessage = 'Could not download the Python runtime.';
      return tryNext();
    }
    if (typeof self.loadPyodide !== 'function') {
      self.postMessage({ type: 'failed', message: 'Python runtime loaded without its initializer.' });
      return Promise.resolve();
    }
    return self.loadPyodide({ indexURL: base }).then(function (py) {
      py.setStdout({ batched: function (text) { printed += text + '\n'; } });
      pyodide = py;
      self.postMessage({ type: 'ready', base: base });
    }, function (error) {
      lastMessage = String((error && error.message) || error || lastMessage);
      return tryNext();
    });
  }
  return tryNext();
}

function run(message) {
  if (!pyodide) {
    self.postMessage({ type: 'done', id: message.id, ok: false, output: '', varsJson: '', error: 'Python has not started.' });
    return Promise.resolve();
  }
  printed = '';
  return pyodide.runPythonAsync(message.code).then(function () {
    var varsJson = '';
    if (message.varsSource) {
      // What is in the boxes: asked of Python after the run. If it cannot be
      // read the shelf is empty; that is never the child's error.
      try { varsJson = String(pyodide.runPython(message.varsSource) || ''); } catch (e) { varsJson = ''; }
    }
    self.postMessage({ type: 'done', id: message.id, ok: true, output: printed, varsJson: varsJson, error: '' });
  }, function (error) {
    self.postMessage({ type: 'done', id: message.id, ok: false, output: printed, varsJson: '', error: String((error && error.message) || error || 'An error occurred') });
  });
}

self.onmessage = function (event) {
  var message = event.data || {};
  if (message.type === 'start') queue = queue.then(function () { return start(message.bases || []); });
  if (message.type === 'run') queue = queue.then(function () { return run(message); });
};
