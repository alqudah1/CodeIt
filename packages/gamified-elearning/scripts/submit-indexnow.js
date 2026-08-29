'use strict';

const fs = require('node:fs');
const https = require('node:https');
const path = require('node:path');

const HOST = 'codeitlearn.com';
const SITE = `https://${HOST}`;
const KEY = '30204272-7391-4a8f-9c50-29d2a604343e';
const KEY_LOCATION = `${SITE}/${KEY}.txt`;

function sitemapUrls(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((match) => match[1].trim())
    .filter((url) => url === SITE || url.startsWith(`${SITE}/`));
}

function submissionPayload(xml) {
  const urlList = sitemapUrls(xml);
  if (!urlList.length) throw new Error('No canonical CodeIt URLs were found in the sitemap.');
  return { host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList };
}

function submit(payload) {
  const body = JSON.stringify(payload);
  return new Promise((resolve, reject) => {
    const request = https.request({
      hostname: 'api.indexnow.org',
      path: '/indexnow',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (response) => {
      response.resume();
      response.on('end', () => {
        if (response.statusCode === 200 || response.statusCode === 202) {
          resolve(response.statusCode);
          return;
        }
        reject(new Error(`IndexNow returned HTTP ${response.statusCode}.`));
      });
    });
    request.on('error', reject);
    request.end(body);
  });
}

/**
 * Where the sitemap actually is.
 *
 * This read ../public/sitemap.xml, and that file does not exist: the hand
 * maintained sitemap was deleted when generate-static-seo.js took over writing
 * it, and the generated one goes into the build directory. So this script threw
 * ENOENT on every invocation, which nobody noticed because nothing ever ran it.
 */
function readSitemap() {
  const candidates = [
    path.resolve(__dirname, '../build/sitemap.xml'),
    path.resolve(__dirname, '../public/sitemap.xml'),
  ];
  for (const file of candidates) {
    if (fs.existsSync(file)) return fs.readFileSync(file, 'utf8');
  }
  throw new Error(
    `No sitemap found. Looked in:\n  ${candidates.join('\n  ')}\n` +
      'Run the build first: npm run build generates it as part of postbuild.'
  );
}

async function main() {
  const sitemap = readSitemap();
  const payload = submissionPayload(sitemap);
  const status = await submit(payload);
  console.log(`IndexNow accepted ${payload.urlList.length} CodeIt URLs (HTTP ${status}).`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

/**
 * Fire-and-forget notification for the build to call. Never throws into the
 * caller: the sitemap is already written by the time this runs, and a deploy
 * that fails because a search engine was busy is a worse outcome than a deploy
 * that is not announced.
 */
function notify(buildDir) {
  const file = buildDir ? path.join(buildDir, 'sitemap.xml') : null;
  const sitemap = file && fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : readSitemap();
  const payload = submissionPayload(sitemap);
  submit(payload)
    .then((status) => console.log(`IndexNow accepted ${payload.urlList.length} URLs (HTTP ${status}).`))
    .catch((error) => console.warn(`IndexNow notification failed: ${error.message}`));
}

module.exports = { KEY, KEY_LOCATION, sitemapUrls, submissionPayload, readSitemap, notify };
