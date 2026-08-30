'use strict';

/**
 * `node --test "scripts/**\/*.test.js"` runs here and fails on the machine that
 * matters.
 *
 * Node only learned to expand a glob passed to --test in version 22. On Node 20
 * it takes the pattern as a literal path and reports:
 *
 *   Could not find '/Users/.../packages/gamified-elearning/scripts/**\/*.test.js'
 *
 * CI pins Node 22, so it passed there and on this machine, and failed the first
 * time it was run on the laptop it was written for. Quoting the pattern is what
 * caused it: unquoted, the shell npm runs the script through expands it and
 * hands Node a list of real filenames, which every version understands.
 *
 * The same mistake was in the root package.json's test:api.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const MANIFESTS = [
  ['packages/gamified-elearning/package.json', path.resolve(__dirname, '../package.json')],
  ['package.json', path.resolve(__dirname, '../../../package.json')],
];

test('no test script depends on Node expanding a glob for it', () => {
  let checked = 0;

  for (const [label, file] of MANIFESTS) {
    const { scripts = {} } = JSON.parse(fs.readFileSync(file, 'utf8'));

    for (const [name, command] of Object.entries(scripts)) {
      if (!command.includes('--test')) continue;
      checked += 1;

      assert.ok(
        !/["'][^"']*\*[^"']*["']/.test(command),
        `${label} script "${name}" quotes a glob: ${command}\n` +
          'Quoted, the pattern reaches Node, which only expands it from version 22. ' +
          'Unquoted, the shell expands it and every version works.'
      );
      assert.ok(
        !command.includes('**'),
        `${label} script "${name}" uses a recursive glob: ${command}\n` +
          'A plain shell does not expand ** either. Every test file sits one level down.'
      );
    }
  }

  assert.ok(checked >= 2, `only ${checked} test scripts were examined`);
});

test('the flat glob still reaches every test file', () => {
  // The fix trades recursion for portability, so it is only correct while no
  // test file is nested. If one ever is, this fails rather than quietly
  // skipping it — which is the failure the glob was reaching for in the first
  // place.
  const dir = path.resolve(__dirname);
  const nested = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) =>
      fs.readdirSync(path.join(dir, entry.name))
        .filter((name) => name.endsWith('.test.js'))
        .map((name) => `${entry.name}/${name}`)
    );

  assert.deepEqual(
    nested,
    [],
    `${nested.join(', ')} sit below scripts/ and the flat glob in test:seo will not run them`
  );

  const flat = fs.readdirSync(dir).filter((name) => name.endsWith('.test.js'));
  assert.ok(flat.length > 10, `only ${flat.length} test files found beside this one`);
});
