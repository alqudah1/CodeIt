import { render, screen } from '@testing-library/react';
import React from 'react';
import PageErrorBoundary, { isChunkError } from './PageErrorBoundary';

jest.mock('../../utils/trackEvent', () => ({ trackEvent: jest.fn(() => Promise.resolve(true)) }));

function Boom() {
  throw new TypeError("Cannot read properties of null (reading 'fromJourney')");
}

describe('the page error boundary', () => {
  let consoleError;
  beforeEach(() => { consoleError = jest.spyOn(console, 'error').mockImplementation(() => {}); });
  afterEach(() => { consoleError.mockRestore(); });

  test('a page that throws leaves the site standing', () => {
    // The exact failure of 1 September: a null read on first render, with no
    // boundary above it, which unmounted the whole application.
    render(<PageErrorBoundary><Boom /></PageErrorBoundary>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/This page did not load/i)).toBeInTheDocument();
  });

  test('it offers the two places worth going next', () => {
    render(<PageErrorBoundary><Boom /></PageErrorBoundary>);
    expect(screen.getByRole('link', { name: /lessons/i })).toHaveAttribute('href', '/lessons');
    expect(screen.getByRole('link', { name: /studio/i })).toHaveAttribute('href', '/builder');
  });

  test('the crash is reported, because a white page does not report itself', () => {
    const { trackEvent } = require('../../utils/trackEvent');
    render(<PageErrorBoundary><Boom /></PageErrorBoundary>);
    expect(trackEvent).toHaveBeenCalledWith('page_crash');
    // The real stack still reaches the console for whoever is debugging.
    expect(consoleError).toHaveBeenCalled();
  });

  test('a page that works is passed through untouched', () => {
    render(<PageErrorBoundary><p>the lesson</p></PageErrorBoundary>);
    expect(screen.getByText('the lesson')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('a page whose code could not download is a connection problem, said as one', () => {
    // School Wi-Fi drops, a child taps the next page, its file cannot arrive.
    // "It is our fault" would be untrue; the page says what happened instead.
    Object.defineProperty(window.navigator, 'onLine', { configurable: true, get: () => false });
    const { trackEvent } = require('../../utils/trackEvent');
    trackEvent.mockClear();
    function Missing() { throw Object.assign(new Error('Loading chunk 412 failed.'), { name: 'ChunkLoadError' }); }
    render(<PageErrorBoundary><Missing /></PageErrorBoundary>);
    expect(screen.getByText('This page needs the connection to open.')).toBeInTheDocument();
    expect(screen.getByText(/Nothing you have made is lost/)).toBeInTheDocument();
    expect(screen.queryByText(/our fault/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go back' })).toBeInTheDocument();
    expect(trackEvent).not.toHaveBeenCalled();
    Object.defineProperty(window.navigator, 'onLine', { configurable: true, get: () => true });
  });

  test('chunk failures are recognised in every browser\'s words, and ordinary bugs are not', () => {
    expect(isChunkError({ name: 'ChunkLoadError', message: 'Loading chunk 3 failed.' })).toBe(true);
    expect(isChunkError(new Error('Loading CSS chunk 7 failed.'))).toBe(true);
    expect(isChunkError(new TypeError('Failed to fetch dynamically imported module: /static/js/9.js'))).toBe(true);
    expect(isChunkError(new TypeError('Importing a module script failed.'))).toBe(true);
    expect(isChunkError(new TypeError("Cannot read properties of null (reading 'fromJourney')"))).toBe(false);
  });

  test('moving to another page gives that page its own chance', () => {
    const { rerender } = render(<PageErrorBoundary resetKey="/home"><Boom /></PageErrorBoundary>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    rerender(<PageErrorBoundary resetKey="/build"><p>the build page</p></PageErrorBoundary>);
    expect(screen.getByText('the build page')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
