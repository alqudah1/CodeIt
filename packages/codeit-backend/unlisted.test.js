'use strict';

// The promises this feature makes, as tests. Each was made to fail on the real
// behaviour before the code was written.

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROUTE_SRC = fs.readFileSync(path.join(__dirname, 'routes', 'unlisted.js'), 'utf8');

// Assert on CODE, not prose. The first version of this file failed because the
// comment explaining why no email is collected contains the word "email",
// which is exactly the kind of test that trains people to ignore tests.
const ROUTE = ROUTE_SRC
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .split('\n')
  .filter(line => !line.trim().startsWith('//'))
  .join('\n');
const SCHEMA_SRC = fs.readFileSync(
  path.join(__dirname, '..', '..', 'supabase', 'migrations', '20260901010000_unlisted_projects.sql'),
  'utf8'
);
const SCHEMA = SCHEMA_SRC.split('\n').filter(line => !line.trim().startsWith('--')).join('\n');

test('the project record itself collects no personal information', () => {
  // The project row must never carry an identity. The optional grown-up email
  // lives in a separate table and is tested below.
  const projectTable = SCHEMA.slice(
    SCHEMA.indexOf('create table if not exists public.unlisted_projects'),
    SCHEMA.indexOf('alter table')
  );
  assert.ok(!/email/i.test(projectTable), 'unlisted_projects must have no email column');
  assert.ok(!/child|parent_name|full_name/i.test(projectTable), 'no identity columns');
});

test('the optional email never touches the consent record', () => {
  // adult_email_verifications means "the adult who owns account N confirmed
  // this address", with parent_child_links hanging consent_version and
  // public_sharing_allowed off it. An address typed by an anonymous visitor
  // means none of that. If this route ever writes there, the consent record
  // stops being trustworthy, so this fails loudly.
  assert.ok(!/adult_email_verifications/.test(ROUTE),
    'the anonymous route must never write to the consent table');
  assert.ok(!/parent_child_links/.test(ROUTE),
    'the anonymous route must never write to the family link table');
  assert.match(ROUTE, /project_link_emails/, 'it uses its own honest table');
});

test('a blank email is a valid answer, not an error', () => {
  // The field is optional and the project is already saved by this point.
  assert.match(ROUTE, /if \(!email\) return res\.json\(\{ success: true, skipped: true \}\)/,
    'blank must return success, never a 400');
});

test('the email capture is double opt in with a way out', () => {
  assert.match(ROUTE, /confirm_token_hash/, 'a confirmation must be required');
  assert.match(ROUTE, /unsubscribe_token/, 'every row must carry an unsubscribe token');
  // Nothing may be marked confirmed at the moment it is typed.
  const insert = ROUTE.slice(ROUTE.indexOf('INSERT INTO project_link_emails'));
  assert.ok(!/confirmed_at/.test(insert.slice(0, 400)),
    'the insert must not pre-confirm the address');
});

test('unlisted projects never enter a public feed', () => {
  // Unlisted means the URL is the only way in. Nothing here may join
  // /explore, which is the listed, browsable surface.
  assert.ok(!/explore/i.test(ROUTE), 'unlisted projects must not touch the explore feed');
  assert.ok(!/is_public/i.test(ROUTE), 'unlisted projects must not set a public flag');
});

test('the write path is bounded: size and rate', () => {
  assert.match(ROUTE, /MAX_CODE_BYTES\s*=\s*\d+/, 'a size cap must exist');
  assert.match(ROUTE, /rateLimit/, 'anonymous writes must be rate limited');
  assert.match(ROUTE, /413|too big/i, 'an oversized project must be refused, not truncated');
});

test('a reported project stops rendering immediately', () => {
  assert.match(SCHEMA, /reported\s+boolean/i, 'the table must carry a reported flag');
  assert.match(ROUTE, /project\.reported/, 'the read must check it before returning code');
});

test('public ids are unguessable and validated on the way in', () => {
  assert.match(ROUTE, /randomBytes\(6\)/, 'ids must come from a CSPRNG');
  assert.match(ROUTE, /PUBLIC_ID_RE\s*=\s*\/\^\[a-f0-9\]\{12\}\$\//,
    'a read must validate the id shape before touching the database');
});

test('the security model is the sandbox, not a keyword blocklist', () => {
  // A regex blocklist over eval/innerHTML/fetch is bypassed by
  // window['ev'+'al'] and breaks real projects: designEngine writes innerHTML
  // while building ordinary UI. The opaque-origin iframe is the real defence.
  for (const banned of [/\beval\b.*(block|forbid|reject)/i, /innerHTML.*(block|forbid|reject)/i]) {
    assert.ok(!banned.test(ROUTE), 'no keyword blocklist: it is bypassable and breaks real projects');
  }
});
