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
//
// A page whose code could not be downloaded is a different thing. Every page
// is its own file, fetched the first time it opens, so when school Wi-Fi drops
// the next page a child taps cannot arrive. That is not "something broke", and
// "it is our fault" would be a strange thing to read with no internet. It gets
// its own words, and opens by itself when the connection is back. The same
// failure with the connection up means a new version went out while the tab
// was open; one reload fixes that, so it reloads once, by itself.

/** The code for this page could not be fetched. */
export function isChunkError(error) {
  const said = `${error?.name || ''} ${error?.message || ''}`;
  return /ChunkLoadError|Loading (CSS )?chunk|dynamically imported module|Importing a module script failed/i.test(said);
}

const RELOADED_KEY = 'codeit.chunk-reload';
function reloadedJustNow(now = Date.now()) {
  try { return now - Number(sessionStorage.getItem(RELOADED_KEY) || 0) < 30000; } catch { return true; }
}
function markReload(now = Date.now()) {
  try { sessionStorage.setItem(RELOADED_KEY, String(now)); } catch { /* then it will not reload again */ }
}

class PageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false, chunk: false };
    this.whenOnline = () => window.location.reload();
  }

  static getDerivedStateFromError(error) {
    return { failed: true, chunk: isChunkError(error) };
  }

  componentDidUpdate(prevProps) {
    // A link in the header moves to another page; that page deserves its own
    // chance rather than this one's error card.
    if (this.state.failed && prevProps.resetKey !== this.props.resetKey) {
      window.removeEventListener('online', this.whenOnline);
      this.setState({ failed: false, chunk: false });
    }
  }

  componentWillUnmount() {
    window.removeEventListener('online', this.whenOnline);
  }

  componentDidCatch(error, info) {
    if (isChunkError(error)) {
      console.error('Page code did not download:', error);
      const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
      if (!offline && !reloadedJustNow()) { markReload(); window.location.reload(); return; }
      window.addEventListener('online', this.whenOnline);
      return;
    }
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
    if (this.state.chunk) {
      return (
        <div className="page-error" role="alert" data-page-offline="1">
          <div className="page-error__card">
            <p className="page-error__title">This page needs the connection to open.</p>
            <p className="page-error__body">
              The connection seems to have dropped. Nothing you have made is lost.
              Go back to the page you were on, or wait: this page opens by
              itself when the connection is back.
            </p>
            <div className="page-error__actions">
              <button type="button" className="page-error__btn page-error__btn--primary" onClick={() => window.history.back()}>Go back</button>
              <button type="button" className="page-error__btn" onClick={() => window.location.reload()}>Try again</button>
            </div>
          </div>
        </div>
      );
    }
    return (
      // data-page-error is what smoke-every-page.cjs looks for. Without it the
      // boundary hides the very failure the smoke run exists to find: a page
      // that crashes now paints a friendly card, which is more than five words,
      // so a blank-page check calls it healthy. The boundary was added the same
      // day as the checker and nearly blinded it.
      <div className="page-error" role="alert" data-page-error="1">
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
