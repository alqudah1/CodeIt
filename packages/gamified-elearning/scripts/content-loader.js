'use strict';

/**
 * content-loader.js
 * -----------------
 * Reads the app's ESM content modules (blog posts, lesson data) from a plain
 * CommonJS build script, without adding a bundler step.
 *
 * Why this exists: the static SEO generator runs as `postbuild` in Node. The
 * content it needs to inline lives in `src/data/blogPosts.js` and
 * `src/pages/Lessons/lessonData/*.js`, which are ES modules and contain regex
 * literals (so they cannot simply be JSON.parse'd). We evaluate them in a vm
 * sandbox after rewriting `export default X` to `module.exports = X`.
 *
 * Single source of truth is preserved: the React app and the crawlable static
 * HTML are generated from the same files. Edit the content once.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SRC = path.resolve(__dirname, '../src');

function loadEsmDefault(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');

  // `export default foo;` -> `module.exports = foo;`
  // Also tolerates `export default { ... };`
  const cjs = source.replace(/export\s+default\s+/g, 'module.exports = ');

  const sandboxModule = { exports: {} };
  const context = vm.createContext({
    module: sandboxModule,
    exports: sandboxModule.exports,
    require: () => {
      throw new Error(
        `content-loader: ${path.basename(filePath)} must not import other modules`
      );
    },
    console,
  });

  try {
    vm.runInContext(cjs, context, { filename: filePath, timeout: 5000 });
  } catch (error) {
    throw new Error(`content-loader: failed to evaluate ${filePath}\n${error.message}`);
  }

  return sandboxModule.exports;
}

/** All blog posts, in file order. */
function loadBlogPosts() {
  const posts = loadEsmDefault(path.join(SRC, 'data/blogPosts.js'));
  if (!Array.isArray(posts) || posts.length === 0) {
    throw new Error('content-loader: blogPosts.js did not export a non-empty array');
  }
  return posts;
}

/** Lessons 1..16 keyed by lesson number. Missing files are skipped, not fatal. */
function loadLessons() {
  const dir = path.join(SRC, 'pages/Lessons/lessonData');
  const lessons = new Map();

  for (const file of fs.readdirSync(dir)) {
    const match = /^lesson(\d+)\.js$/.exec(file);
    if (!match) continue;
    const number = Number(match[1]);
    try {
      lessons.set(number, loadEsmDefault(path.join(dir, file)));
    } catch (error) {
      console.warn(`content-loader: skipping ${file} — ${error.message}`);
    }
  }

  if (lessons.size === 0) {
    throw new Error('content-loader: no lesson data files could be loaded');
  }
  return lessons;
}

/** Long-form guide pages, shared with the React GuidePage component. */
function loadGuidePages() {
  const guides = loadEsmDefault(path.join(SRC, 'data/guidePages.js'));
  if (!Array.isArray(guides) || guides.length === 0) {
    throw new Error('content-loader: guidePages.js did not export a non-empty array');
  }
  return guides;
}

/** The same Markdown renderer the React app uses, so both agree exactly. */
function loadMarkdownRenderer() {
  const render = loadEsmDefault(path.join(SRC, 'utils/markdown.js'));
  if (typeof render !== 'function') {
    throw new Error('content-loader: markdown.js did not export a function');
  }
  return render;
}

module.exports = { loadBlogPosts, loadLessons, loadGuidePages, loadMarkdownRenderer, loadEsmDefault };
