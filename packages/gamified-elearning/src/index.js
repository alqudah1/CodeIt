// The entry file is deliberately almost empty.
//
// A school's web filter reads every file it lets through and scores the words
// in it. One large file holding the whole site (every lesson, the studio, the
// legal pages, and the libraries underneath) adds up words that have nothing
// to do with each other, and on 12 November 2026 that sum was what stood
// between a class and its first lesson: the page arrived, the stylesheet
// arrived, and the one big script did not.
//
// So this file only makes storage safe and asks for the app. The app and the
// libraries then arrive as separate files, each one about one thing.

// First, before anything that might read saved data: see utils/safeStorage.js.
import './utils/safeStorage';

// There are two builds of the app (see scripts/build.js). When a network has
// stopped the main one's files, the watcher in public/index.html starts the
// small-files one in its place and says so here. The main one then stands
// aside, so the two are never both on the page.
if (process.env.REACT_APP_LITE === '1' || !(window.__codeitBoot && window.__codeitBoot.small)) import('./boot');
