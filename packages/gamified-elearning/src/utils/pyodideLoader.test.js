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

    await expect(first).resolves.toBe(runtime);
    await expect(second).resolves.toBe(runtime);
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
    await expect(getPyodideRuntime()).resolves.toBe(runtime);
    expect(window.loadPyodide).toHaveBeenCalledTimes(2);
  });

  test('removes a loaded script that did not provide an initializer', async () => {
    const { getPyodideRuntime } = require('./pyodideLoader');
    const attempt = getPyodideRuntime();
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
    await expect(getPyodideRuntime()).resolves.toBe(runtime);
    expect(appended[0]).toContain('/pyodide/v0.29.0/full/pyodide.js');
    expect(appended[1]).toBe('https://cdn.jsdelivr.net/pyodide/v0.29.0/full/pyodide.js');
    expect(window.loadPyodide).toHaveBeenCalledWith({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.29.0/full/' });
  } finally {
    document.head.appendChild = realAppend;
  }
});
