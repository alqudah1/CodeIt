// The production build. Two things differ from plain Create React App.
//
// 1. No script file is allowed to grow large.
//
// 13 November 2026, from a school computer behind a web filter (Smoothwall):
// of the 74 script files the site was made of, six came back "403" and the
// app never started. The six largest files were 138 KB to 427 KB; everything
// up to 68 KB arrived, and so did every stylesheet and the whole of Python.
// So scripts are cut into parts of about 50 KB wherever the code can be cut.
// A part is a group of whole modules: one module that is bigger than that by
// itself cannot be cut by a build.
//
// 2. The site is built a second time, into build/lite, as a small-files
// version.
//
// Three things in the main build cannot be cut: React (130 KB in one module),
// the coloured code editor (185 KB) and the studio page (156 KB). The second
// build swaps React for Preact, which does the same job in about 20 KB, and
// leaves the coloured editor out (lessons use the plain one). Nothing in it
// that a lesson, the playground or signing in needs is over 50 KB. It is only
// ever loaded when the main version has been stopped on the way: the watcher
// in public/index.html sees the app's files fail to arrive and starts this
// one in its place. Everybody else gets the main build, unchanged.
//
// Only scripts are regrouped. Stylesheets stay exactly where they were, in
// the order they were, because their order is what decides how the site
// looks.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const MAX_PART = 50 * 1000;
// What a lesson, the playground and signing in may weigh in the small-files
// version. The largest script known to pass the filter was 68 KB.
const SMALL_LIMIT = 60 * 1000;
const APP = path.resolve(__dirname, '..');
const LITE = process.env.CODEIT_LITE === '1';

function smallFiles(config) {
  const split = config.optimization.splitChunks || {};
  config.optimization.splitChunks = {
    ...split,
    cacheGroups: {
      ...(split.cacheGroups || {}),
      // Every script module that arrives after the entry file, grouped into
      // parts no bigger than MAX_PART. Stylesheet modules are not matched,
      // so they stay in the chunk, and the order, they were written in.
      parts: {
        chunks: 'async',
        type: /^javascript\//,
        minChunks: 1,
        minSize: 0,
        maxSize: MAX_PART,
        priority: 10,
        reuseExistingChunk: true,
      },
    },
  };
  return config;
}

function smallVersion(config) {
  config.resolve.alias = {
    ...(config.resolve.alias || {}),
    'react/jsx-runtime': 'preact/jsx-runtime',
    'react/jsx-dev-runtime': 'preact/jsx-dev-runtime',
    'react-dom/client': 'preact/compat/client',
    // Not Preact's own: see src/small/staticMarkup.js for why.
    'react-dom/server': path.join(APP, 'src', 'small', 'staticMarkup.js'),
    'react-dom/test-utils': 'preact/test-utils',
    'react-dom': 'preact/compat',
    react: 'preact/compat',
  };
  // Both versions can be on one page for a moment (the main entry file has
  // already run when this one starts), so their chunk lists must not share a
  // name.
  config.output.chunkLoadingGlobal = 'webpackChunkcodeit_small';
  return config;
}

function patchCreateReactApp() {
  const configPath = require.resolve('react-scripts/config/webpack.config');
  const factory = require(configPath);
  require.cache[configPath].exports = (env) => {
    const config = smallFiles(factory(env));
    return LITE ? smallVersion(config) : config;
  };
}

function buildOnce(extraEnv) {
  const done = spawnSync(process.execPath, [__filename, '--one'], {
    cwd: APP,
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv },
  });
  if (done.status !== 0) process.exit(done.status || 1);
}

function scriptsIn(dir) {
  const folder = path.join(dir, 'static', 'js');
  if (!fs.existsSync(folder)) return [];
  return fs.readdirSync(folder)
    .filter((name) => name.endsWith('.js') && !name.startsWith('size-test-'))
    .map((name) => ({ name, size: fs.statSync(path.join(folder, name)).size }))
    .sort((a, b) => b.size - a.size);
}

// The small-files build copies the whole public folder again. Only its
// scripts, stylesheets and the list of them are wanted.
function pruneSmallVersion(dir) {
  for (const name of fs.readdirSync(dir)) {
    if (name === 'static' || name === 'asset-manifest.json') continue;
    fs.rmSync(path.join(dir, name), { recursive: true, force: true });
  }
}

// For /check.html: how big every file really is (a file that is stopped
// cannot be measured from the browser), and three test scripts with nothing
// in them but numbers, so one run tells size apart from content.
function writeCheckFiles(build) {
  const sizes = {};
  for (const [prefix, dir] of [['', build], ['/lite', path.join(build, 'lite')]]) {
    for (const kind of ['js', 'css']) {
      const folder = path.join(dir, 'static', kind);
      if (!fs.existsSync(folder)) continue;
      for (const name of fs.readdirSync(folder)) {
        if (name.endsWith('.' + kind)) sizes[`${prefix}/static/${kind}/${name}`] = fs.statSync(path.join(folder, name)).size;
      }
    }
  }
  const probes = [];
  for (const kb of [100, 200, 400]) {
    const name = `/static/js/size-test-${kb}.js`;
    const head = `/* CodeIt size test: ${kb} KB of numbers. Nothing runs. */\nwindow.__codeitSizeTest = (window.__codeitSizeTest || 0) + 1;\n// `;
    let body = '';
    for (let n = 0; body.length < kb * 1024 - head.length - 1; n += 1) body += `${n % 97} `;
    const text = (head + body).slice(0, kb * 1024 - 1) + '\n';
    fs.writeFileSync(path.join(build, name), text);
    probes.push({ url: name, size: text.length });
  }
  fs.writeFileSync(path.join(build, 'check-files.json'), JSON.stringify({ sizes, probes }));
}

function report(build) {
  const main = scriptsIn(build);
  const small = scriptsIn(path.join(build, 'lite'));
  const kb = (n) => `${Math.round(n / 1024)} KB`;
  console.log(`\nMain version: ${main.length} script files, largest ${main.slice(0, 3).map((f) => kb(f.size)).join(', ')}.`);
  console.log(`Small-files version: ${small.length} script files, largest ${small.slice(0, 3).map((f) => kb(f.size)).join(', ')}.`);
  const over = small.filter((f) => f.size > SMALL_LIMIT);
  if (over.length) console.log(`Over ${kb(SMALL_LIMIT)} in the small-files version: ${over.map((f) => `${f.name} (${kb(f.size)})`).join(', ')}.`);
}

module.exports = { smallFiles, smallVersion, scriptsIn, MAX_PART, SMALL_LIMIT };

if (require.main === module) {
  if (process.argv.includes('--one')) {
    process.env.NODE_ENV = process.env.NODE_ENV || 'production';
    process.env.BABEL_ENV = process.env.BABEL_ENV || 'production';
    patchCreateReactApp();
    require('react-scripts/scripts/build');
  } else {
    const build = path.join(APP, 'build');
    // CODEIT_ONLY=small rebuilds just the second version, for working on it.
    if (process.env.CODEIT_ONLY !== 'small') buildOnce({ CODEIT_LITE: '', REACT_APP_LITE: '' });
    buildOnce({
      CODEIT_LITE: '1',
      REACT_APP_LITE: '1',
      BUILD_PATH: path.join('build', 'lite'),
      PUBLIC_URL: '/lite',
      GENERATE_SOURCEMAP: 'false',
      // The same source was linted a minute ago, by the first build.
      DISABLE_ESLINT_PLUGIN: 'true',
    });
    pruneSmallVersion(path.join(build, 'lite'));
    writeCheckFiles(build);
    report(build);
  }
}
