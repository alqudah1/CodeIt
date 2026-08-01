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
