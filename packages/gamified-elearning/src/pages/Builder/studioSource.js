// For tests that read the studio as text.
//
// The studio used to be one file, Builder.js, and a dozen tests read that file
// to check that a sentence or a call was still in it. It is in parts now (see
// the note at the top of Builder.js), so the thing to read is all of them.
const fs = require('fs');
const path = require('path');

const PARTS = /^studio(Kit|Screen|Actions)\d+\.js$/;

/** The names of the files the studio is made of, Builder.js first. */
function studioFiles() {
  return ['Builder.js', ...fs.readdirSync(__dirname).filter((name) => PARTS.test(name)).sort()];
}

/** The whole studio as one string, in that order. */
function readStudioSource() {
  return studioFiles().map((name) => fs.readFileSync(path.join(__dirname, name), 'utf8')).join('\n');
}

module.exports = { readStudioSource, studioFiles };
