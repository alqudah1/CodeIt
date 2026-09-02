#!/usr/bin/env bash
# Every browser check, against a stack built from nothing.
#
# ── Why this exists ──────────────────────────────────────────────────────────
#
# There was CI, and it ran the unit tests and the build. Every bug that actually
# reached a child — the four-step checklist crushed into unreadable columns, the
# publish that refused silently, the fast path hidden below the fold, the
# generated game that threw on its first frame — passed every one of those unit
# tests. The checks that would have caught them live in this folder and were run
# by hand, by whoever remembered.
#
# So this runs them the way CI has to: build the site, stand up a database from
# this repository's own migrations, start the backend, put one child in it, and
# point a browser at the result.
#
#   DATABASE_URL=postgresql://... ops/checks/run-all.sh
#
# Everything it starts, it stops.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
FRONTEND="$ROOT/packages/gamified-elearning"
BACKEND="$ROOT/packages/codeit-backend"

PORT_WEB="${PORT_WEB:-4599}"
PORT_API="${PORT_API:-5000}"
export CHECK_BASE="http://localhost:$PORT_WEB"
export CHECK_API="http://localhost:$PORT_API"
export CODEIT_TOKEN_FILE="${CODEIT_TOKEN_FILE:-/tmp/codeit-check-token}"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is not set. These checks need a database — three of the"
  echo "screens they measure do not exist without one." >&2
  exit 2
fi

# A throwaway signing key for a throwaway database. Nothing here ever sees a
# real learner, and the real secret must never be in a checkout.
export JWT_SECRET="${JWT_SECRET:-check-runner-signing-key-not-a-real-secret}"
export NODE_ENV=development
export PORT="$PORT_API"
export BILLING_ENABLED=false
export CORS_ORIGINS="$CHECK_BASE"

web_pid=""
api_pid=""
cleanup() {
  [ -n "$api_pid" ] && kill "$api_pid" 2>/dev/null || true
  [ -n "$web_pid" ] && kill "$web_pid" 2>/dev/null || true
}
trap cleanup EXIT

wait_for() {
  local url="$1" name="$2" tries=0
  until curl -sf -o /dev/null "$url"; do
    tries=$((tries + 1))
    if [ "$tries" -gt 60 ]; then echo "$name never came up at $url" >&2; exit 1; fi
    sleep 1
  done
}

echo "── Database ──────────────────────────────────────────────────────────────"
# --baseline on an empty database would mark everything applied without running
# it, which is right for production and wrong here: this database has nothing in
# it and needs every migration actually run.
node "$ROOT/ops/db/migrate.js" --fresh --apply

echo
echo "── Build ─────────────────────────────────────────────────────────────────"
( cd "$FRONTEND" && REACT_APP_API_URL="$CHECK_API" npx --no-install react-scripts build )

echo
echo "── Servers ───────────────────────────────────────────────────────────────"
( cd "$BACKEND" && node test-quiz.js ) & api_pid=$!
( cd "$FRONTEND" && npx --no-install serve -s build -l "$PORT_WEB" ) > /dev/null & web_pid=$!
wait_for "$CHECK_API/api/lessons" "the backend"
wait_for "$CHECK_BASE/" "the site"
echo "  backend on $PORT_API, site on $PORT_WEB"

echo
echo "── One child in the database ─────────────────────────────────────────────"
node "$ROOT/ops/checks/seed.js"

failed=0
run() {
  echo
  echo "── $1 ${2:-}"
  printf '%.0s─' $(seq 1 $((74 - ${#1}))) ; echo
  if node "$ROOT/ops/checks/$1"; then :; else failed=$((failed + 1)); echo "  ↑ FAILED"; fi
}

# Ordered cheapest first, so a broken build is obvious before ten minutes of
# browser work.
run quizzes-check.js
run starters-run.js
run editable-worlds.js
run maze-drag.js
run readable-check.js
run controls-check.js
run device-sweep.js
run screen-share.js
run complaints-check.js
run first-five-minutes.js
run kid-alone.js
run lesson-alone.js
run shelf-alignment.js
run a11y-sweep.js

echo
if [ "$failed" -gt 0 ]; then
  echo "$failed check(s) failed."
  exit 1
fi
echo "Every browser check passed."
