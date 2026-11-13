// The app itself. index.js loads this file and nothing else; see the note there.
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
// Loaded after App so it wins on equal specificity. Everything in it was put
// there by the device sweep, not by taste — see the file for what and why.
import './styles/reachable.css';
// The design language. Loaded last on purpose: it owns colour, type, depth
// and motion for the whole site, and must win the cascade over per-component
// stylesheets. Layout stays in the component files. See styles/arcade.css.
import './styles/arcade.css';
import reportWebVitals from './reportWebVitals';

// Said before anything is drawn: from here on the app is running, and the
// watcher in public/index.html must not start a second one beside it.
if (window.__codeitBoot) window.__codeitBoot.app = true;

const container = document.getElementById('root');
// The small-files version is drawn by a different library, which would try to
// reuse the plain page that is already there. It starts from an empty box.
if (process.env.REACT_APP_LITE === '1') container.textContent = '';
const root = ReactDOM.createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
