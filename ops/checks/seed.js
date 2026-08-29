// A database with a child in it, built from nothing.
//
// Three of the browser checks measure screens that do not exist for a stranger:
// signed out, /explore is an API error, /profile is a login form and /quiz/1
// says "please log in". Measuring those is measuring nothing — an early run of
// screen-share.js did exactly that and reported a login form as a profile.
//
// So: one learner, over 13 so the under-13 rule does not block them, with a few
// published projects and a couple of finished lessons. Everything goes through
// the same API a child uses, so a route that breaks breaks the seed too.
//
//   DATABASE_URL=... node ops/checks/seed.js
//
// Idempotent. Run it twice and the second run signs the same learner in rather
// than failing on a duplicate username.
//
// The token is written where the checks look for it: $CODEIT_TOKEN_FILE, or
// /tmp/codeit-check-token.
'use strict';

const fs = require('fs');

const API = process.env.CHECK_API || 'http://localhost:5000';
const TOKEN_FILE = process.env.CODEIT_TOKEN_FILE || '/tmp/codeit-check-token';

// Not a secret. This account exists only inside a throwaway check database and
// has no bearing on any real learner.
const LEARNER = {
  accountType: 'student',
  username: 'checkrunner',
  name: 'Maya',
  password: 'Check-Runner-2026',
  dob: '2010-05-02',
};

// Each with its true type: the explore page colours and labels cards by
// project_type, and four "games" that are really a quiz and a shop made the
// whole feed one identical orange wall.
const PROJECTS = [
  { title: 'Build a maze',     prompt: 'a maze you walk through',        project_type: 'game' },
  { title: 'Catch the stars',  prompt: 'a game where you catch things',  project_type: 'game' },
  { title: 'Animal quiz',      prompt: 'a quiz about animals',           project_type: 'quiz' },
  { title: 'Cupcake shop',     prompt: 'a shop that sells cupcakes',     project_type: 'shop' },
];

// Lessons 1 and 2 so a quiz gate opens, and 17 because quizzes 17 to 31 are the
// ones whose questions have always been in a migration.
const FINISHED = [1, 2, 17];

async function call(path, { token, ...options } = {}) {
  const response = await fetch(API + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text.slice(0, 200); }
  return { status: response.status, body };
}

async function main() {
  // Sign up, or sign in if this database has been seeded before.
  let signup = await call('/api/signup', { method: 'POST', body: JSON.stringify(LEARNER) });
  if (signup.status !== 200 && signup.status !== 201) {
    console.log(`  signup said ${signup.status}, trying to sign in instead`);
  }

  const login = await call('/api/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: LEARNER.username, password: LEARNER.password }),
  });
  if (!login.body?.token) {
    throw new Error(`could not sign the check learner in: ${login.status} ${JSON.stringify(login.body).slice(0, 160)}`);
  }
  const token = login.body.token;
  fs.writeFileSync(TOKEN_FILE, token);

  // Projects, saved and published, so /explore and the shelf have something in
  // them. Published deliberately: an empty Explore is a different screen.
  const existing = await call('/api/builder/projects', { token });
  const already = new Set((existing.body?.projects || []).map(p => p.title));
  let made = 0;
  for (const project of PROJECTS) {
    if (already.has(project.title)) continue;
    const code = `<!doctype html><html><head><style>body{font-family:system-ui}</style></head>`
      + `<body><h1>${project.title}</h1><script>const name = "${project.title}"; console.log(name);<\/script></body></html>`;
    const saved = await call('/api/builder/projects', {
      token,
      method: 'POST',
      body: JSON.stringify({ ...project, generated_code: code }),
    });
    const id = saved.body?.project?.id;
    if (!id) { console.log(`  could not save ${project.title}: ${saved.status}`); continue; }
    await call(`/api/builder/projects/${id}/publish`, { token, method: 'POST', body: '{}' });
    made += 1;
  }

  for (const lesson of FINISHED) {
    await call(`/api/lessons/${lesson}/complete`, { token, method: 'POST', body: '{}' });
  }

  const projects = await call('/api/builder/projects', { token });
  const progress = await call('/api/lessons/progress', { token });
  console.log(`  learner: ${LEARNER.username}, ${projects.body?.projects?.length ?? 0} projects (${made} new this run)`);
  console.log(`  finished lessons: ${(progress.body?.completedLessons || []).join(', ') || 'none'}`);
  console.log(`  token written to ${TOKEN_FILE}`);
}

main().catch(error => { console.error(error.message); process.exit(1); });
