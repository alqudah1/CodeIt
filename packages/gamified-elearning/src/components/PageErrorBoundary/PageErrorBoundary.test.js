import { render, screen } from '@testing-library/react';
import React from 'react';
import PageErrorBoundary from './PageErrorBoundary';

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
});
