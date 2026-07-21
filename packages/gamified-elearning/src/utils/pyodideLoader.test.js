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
