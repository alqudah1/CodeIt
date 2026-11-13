'use strict';

// A class account's work is for its class. It reaches the projector and the
// class arcade through Publish, which every one of the twelve lesson plans
// has each child press, and it must never reach the public gallery, where
// anyone browsing sees its title and the first 800 characters of its code.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { isClassAccountSql, isClassAccountRow } = require('./classAccounts');

test('a class account is a member with no email of any kind', () => {
  assert.strictEqual(isClassAccountRow({ email: null, parent_email: null }), true);
  assert.strictEqual(isClassAccountRow({ email: 'a@b.test', parent_email: null }), false);
  assert.strictEqual(isClassAccountRow({ email: null, parent_email: 'p@b.test' }), false);
  assert.strictEqual(isClassAccountRow(null), false);
});

test('the SQL helper only ever takes a column reference', () => {
  assert.match(isClassAccountSql('p.user_id'), /class_members/);
  assert.throws(() => isClassAccountSql("p.user_id OR 1=1"));
  assert.throws(() => isClassAccountSql('user_id'));
});

test('every public listing in Explore keeps class accounts out', () => {
  // Read the route, not a list of queries, so a listing added next month
  // without the exclusion fails here rather than quietly putting a
  // classroom's games in front of strangers.
  const source = fs.readFileSync(path.join(__dirname, 'routes', 'explore.js'), 'utf8');
  const listings = source
    .split(/(?=pool\.query\(|const base = )/)
    .filter(chunk => /is_public\s*=\s*1/.test(chunk.slice(0, 600)))
    .filter(chunk => !/public_id\s*=\s*\?/.test(chunk.slice(0, 600)));   // a lookup by link, not a listing
  assert.ok(listings.length >= 2, `found ${listings.length} public listings; the split is wrong`);
  const unguarded = listings.filter(chunk => !/isClassAccountSql\(/.test(chunk.slice(0, 600)) && !/^pool\.query\(base/.test(chunk));
  assert.deepEqual(unguarded.map(c => c.slice(0, 90).replace(/\s+/g, ' ')), [],
    'a public Explore listing does not exclude class accounts');
});
