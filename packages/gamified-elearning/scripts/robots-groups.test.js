'use strict';

/**
 * Every group in robots.txt has to say the same thing.
 *
 * A crawler that finds its own name in robots.txt obeys that group and ignores
 * "User-agent: *" completely. There is no inheritance. So the moment the file
 * names GPTBot, ClaudeBot and the rest, a Disallow added to the wildcard group
 * applies to Googlebot and to none of them — and it reads, to anyone scanning
 * the file, as though it applies to everything.
 *
 * That is the whole hazard introduced by naming them on 24 October 2026, and
 * naming them bought no crawling permission that the wildcard did not already
 * give. These tests are the reason the trade is worth making: the file can say
 * the permission out loud, and it cannot quietly mean something different to
 * different crawlers.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ROBOTS = fs.readFileSync(
  path.resolve(__dirname, '../public/robots.txt'),
  'utf8'
);

/** [{ agent, rules: ['Allow: /'] }], comments and blank lines dropped. */
function groups(text) {
  const found = [];
  let current = null;

  for (const raw of text.split('\n')) {
    const line = raw.replace(/#.*$/, '').trim();
    if (!line) continue;

    const agent = /^User-agent:\s*(.+)$/i.exec(line);
    if (agent) {
      // Consecutive User-agent lines share one group of rules.
      if (current && current.rules.length === 0) {
        current.agents.push(agent[1].trim());
        continue;
      }
      current = { agents: [agent[1].trim()], rules: [] };
      found.push(current);
      continue;
    }

    if (/^(Allow|Disallow|Crawl-delay):/i.test(line)) {
      assert.ok(current, `rule outside any group: ${line}`);
      current.rules.push(line.replace(/\s+/g, ' '));
    }
  }
  return found;
}

const GROUPS = groups(ROBOTS);

/**
 * The rules one agent actually gets, as a parser sees them.
 *
 * A file may name the same agent more than once, and a real parser merges
 * those groups rather than honouring the first and discarding the rest. The
 * first version of this test used only the first match, so appending a second
 * "User-agent: *" group with a Disallow in it passed cleanly — which is the
 * single likeliest way for this file to go wrong.
 */
function rulesFor(agent) {
  const rules = [];
  for (const group of GROUPS) {
    if (group.agents.includes(agent)) rules.push(...group.rules);
  }
  return [...new Set(rules)].sort();
}

const NAMED_AGENTS = [...new Set(GROUPS.flatMap(group => group.agents))]
  .filter(agent => agent !== '*');

test('robots.txt still allows everything to everything unnamed', () => {
  assert.ok(
    GROUPS.some(group => group.agents.includes('*')),
    'there is no "User-agent: *" group'
  );
  assert.deepStrictEqual(
    rulesFor('*'),
    ['Allow: /'],
    'the wildcard group no longer simply allows everything. '
      + 'Every named group below has to change with it, or they stop matching.'
  );
});

test('every named agent ends up with exactly what the wildcard says', () => {
  const wildcard = rulesFor('*');

  assert.ok(
    NAMED_AGENTS.length >= 8,
    `expected the assistant crawlers to be named, found ${NAMED_AGENTS.length}`
  );

  for (const agent of NAMED_AGENTS) {
    assert.deepStrictEqual(
      rulesFor(agent),
      wildcard,
      `${agent} ends up with different rules from "User-agent: *". `
        + 'A named crawler ignores the wildcard group entirely, so the two must match. '
        + 'Change every group or remove the named ones.'
    );
  }
});

test('the assistant crawlers this site means to allow are all named', () => {
  const named = new Set(NAMED_AGENTS);
  for (const agent of [
    'GPTBot', 'OAI-SearchBot', 'ChatGPT-User',
    'ClaudeBot', 'Claude-SearchBot', 'PerplexityBot',
    'Google-Extended', 'Applebot-Extended',
  ]) {
    assert.ok(named.has(agent), `${agent} is no longer named in robots.txt`);
  }
});

test('the sitemap and the llms.txt pointer survive', () => {
  assert.match(ROBOTS, /^Sitemap:\s*https:\/\/codeitlearn\.com\/sitemap\.xml$/m);
  assert.match(ROBOTS, /^LLM-Content:\s*https:\/\/codeitlearn\.com\/llms\.txt$/m);
});
