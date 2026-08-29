'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { KEY, KEY_LOCATION, sitemapUrls, submissionPayload } = require('./submit-indexnow');

test('builds an IndexNow payload from canonical sitemap URLs', () => {
  const xml = '<urlset><url><loc>https://codeitlearn.com/</loc></url><url><loc>https://codeitlearn.com/pricing</loc></url><url><loc>https://other.example/page</loc></url></urlset>';
  const payload = submissionPayload(xml);

  assert.deepEqual(payload.urlList, ['https://codeitlearn.com/', 'https://codeitlearn.com/pricing']);
  assert.equal(payload.host, 'codeitlearn.com');
  assert.equal(payload.key, KEY);
  assert.equal(payload.keyLocation, `https://codeitlearn.com/${KEY}.txt`);
});

test('the ownership key file exactly matches the submitted public key', () => {
  const keyFile = fs.readFileSync(path.resolve(__dirname, `../public/${KEY}.txt`), 'utf8').trim();
  assert.equal(keyFile, KEY);
});

test('rejects a sitemap without canonical CodeIt URLs', () => {
  assert.deepEqual(sitemapUrls('<loc>https://example.com/</loc>'), []);
  assert.throws(() => submissionPayload('<urlset />'), /No canonical CodeIt URLs/);
});

/* ─── Wiring ───────────────────────────────────────────────────────────────
   This script existed for months, worked, and had never run: nothing invoked
   it, and invoking it by hand threw ENOENT because it read a sitemap file that
   was deleted when generate-static-seo.js took over writing one. Both halves
   of that are checked here, because either one alone puts it back to silent. */

test('the sitemap is read from where the build actually writes it', () => {
  const source = fs.readFileSync(path.resolve(__dirname, 'submit-indexnow.js'), 'utf8');
  assert.match(source, /build\/sitemap\.xml/, 'submit-indexnow does not look in the build directory');
  assert.match(source, /function readSitemap/, 'the sitemap lookup is gone');
});

test('the build notifies IndexNow on a production deploy', () => {
  const source = fs.readFileSync(path.resolve(__dirname, 'generate-static-seo.js'), 'utf8');
  assert.match(source, /submit-indexnow/, 'the build never calls submit-indexnow, so nothing ever runs it');
  assert.match(
    source,
    /VERCEL_ENV === 'production'/,
    'the notification is not gated to production; preview deploys would announce URLs about to change'
  );
});

test('notify is exported for the build to call', () => {
  assert.equal(typeof require('./submit-indexnow.js').notify, 'function');
});
