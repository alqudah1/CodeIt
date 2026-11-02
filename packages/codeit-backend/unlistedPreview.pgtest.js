'use strict';

// A chat app drawing a link preview (api/share.js asks with ?preview=1) is
// not a play. A real open still counts. Against a real Postgres.

const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'a-test-secret-that-is-at-least-32-chars-long';
const DB_URL = process.env.DATABASE_URL || '';
const HAS_PG = /@(localhost|127\.0\.0\.1)[:/]/.test(DB_URL);

test('a link preview reads the friend link without counting a play', { skip: !HAS_PG && 'no local Postgres' }, async () => {
  const pool = require('./db');
  const id = Array.from({ length: 12 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
  await pool.query(
    `INSERT INTO unlisted_projects (public_id, title, project_type, generated_code) VALUES (?, 'Rock Blaster', 'game', ?)`,
    [id, '<!doctype html><html><body><h1>Rock Blaster</h1><div id="score">0</div></body></html>']
  );
  const app = express(); app.use('/api/builder/unlisted', require('./routes/unlisted'));
  const server = await new Promise((resolve) => { const s = app.listen(0, () => resolve(s)); });
  const base = `http://127.0.0.1:${server.address().port}/api/builder/unlisted/${id}`;
  const views = async () => { await new Promise((r) => setTimeout(r, 150)); const [[row]] = await pool.query('SELECT view_count FROM unlisted_projects WHERE public_id = ?', [id]); return Number(row.view_count); };
  try {
    const preview = await (await fetch(`${base}?preview=1`)).json();
    assert.equal(preview.project.title, 'Rock Blaster');
    assert.equal(await views(), 0);
    await fetch(base);
    assert.equal(await views(), 1);
  } finally {
    server.close();
  }
});
