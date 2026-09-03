import { humanError, reportFailure, GENERIC_FAILURE } from './humanError';

describe('what a person is shown when something fails', () => {
  test('a message we wrote goes straight through', () => {
    expect(humanError(new Error('That username is already taken.'))).toBe('That username is already taken.');
    expect(humanError(new Error('Confirm the adult account email first.')))
      .toBe('Confirm the adult account email first.');
  });

  test('the parser error that reached real visitors does not', () => {
    // Verbatim, from a screenshot of /explore with the API answering HTML.
    const real = new Error(`Unexpected token '<', "<!doctype "... is not valid JSON`);
    expect(humanError(real)).toBe(GENERIC_FAILURE);
  });

  test('browser network noise does not', () => {
    for (const message of ['Failed to fetch', 'NetworkError when attempting to fetch resource.',
      'Load failed', 'The operation was aborted.']) {
      expect(humanError(new Error(message))).toBe(GENERIC_FAILURE);
    }
  });

  test('a stack or a dump does not', () => {
    expect(humanError(new Error('x'.repeat(400)))).toBe(GENERIC_FAILURE);
    expect(humanError(new Error('{}[]()<>'))).toBe(GENERIC_FAILURE);
  });

  test('an empty or missing error still says something', () => {
    expect(humanError(null)).toBe(GENERIC_FAILURE);
    expect(humanError(new Error(''))).toBe(GENERIC_FAILURE);
    expect(humanError(undefined, 'We could not load the projects just now.'))
      .toBe('We could not load the projects just now.');
  });

  test('the real error reaches the console even when the screen does not show it', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const shown = reportFailure('Explore feed', new Error('Failed to fetch'));
    expect(shown).toBe(GENERIC_FAILURE);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
