import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ── Twemoji: replace native emoji with crisp SVG images ──
// Runs after React renders and re-runs whenever the DOM changes.
(function setupTwemoji() {
  const rootEl = document.getElementById('root');
  if (!rootEl) return;

  function parseEmoji() {
    if (!window.twemoji) return;
    window.twemoji.parse(rootEl, {
      folder: 'svg',
      ext: '.svg',
      base: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/',
    });
  }

  // Initial parse after React's first render
  setTimeout(parseEmoji, 120);

  // Re-parse whenever React updates the DOM (debounced to avoid loops)
  let debounce;
  const observer = new MutationObserver(() => {
    clearTimeout(debounce);
    debounce = setTimeout(parseEmoji, 80);
  });
  observer.observe(rootEl, { childList: true, subtree: true });
})();
