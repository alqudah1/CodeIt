import React from 'react';
import './PageErrorBoundary.css';

// ── One broken line must not take the whole site down ────────────────────────
//
// On 1 September a single expression in the lesson template read a property off
// null on first render. There was no boundary above it, so React unmounted the
// tree and all 31 lessons served a blank white page for a day. Nobody saw an
// error, because a white page does not report itself: it looks like a slow site.
//
// The only boundary in the app was inside SplineScene, guarding a 3D widget.
// The pages children actually use had none.
//
// What this gives back is small on purpose. It cannot repair the page. It can
// say that this page broke rather than that the internet broke, keep the two
// places worth going next reachable, and tell us it happened.
class PageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    // Console first, so a browser check or a person with devtools open sees the
    // real stack rather than the friendly sentence.
    console.error('Page crashed:', error, info?.componentStack);
    // Best effort, and never allowed to throw on top of a throw. No message,
    // no stack, no URL: an event name is enough to know a page died, and this
    // route must not become a way to post arbitrary text to the ingest.
    try {
      const { trackEvent } = require('../../utils/trackEvent');
      void trackEvent('page_crash');
    } catch (_) { /* reporting must never be the reason a page stays broken */ }
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="page-error" role="alert">
        <div className="page-error__card">
          <p className="page-error__title">This page did not load.</p>
          <p className="page-error__body">
            Something on this page broke. It is our fault, not anything you did,
            and nothing you have made has been lost.
          </p>
          <div className="page-error__actions">
            <a className="page-error__btn page-error__btn--primary" href="/lessons">Go to the lessons</a>
            <a className="page-error__btn" href="/builder">Go to the studio</a>
            <button
              type="button"
              className="page-error__btn"
              onClick={() => window.location.reload()}
            >
              Try this page again
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default PageErrorBoundary;
