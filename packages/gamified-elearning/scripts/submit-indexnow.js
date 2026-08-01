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

async function main() {
  const sitemap = fs.readFileSync(path.resolve(__dirname, '../public/sitemap.xml'), 'utf8');
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

module.exports = { KEY, KEY_LOCATION, sitemapUrls, submissionPayload };
