# Database migrations

## The short version

```bash
# What is pending?
DATABASE_URL='postgresql://...' npm run db:migrate

# First time only: tell it what the database already has.
DATABASE_URL='postgresql://...' node ops/db/migrate.js --baseline 20260820090000

# Apply what is left.
DATABASE_URL='postgresql://...' node ops/db/migrate.js --apply
```

`DATABASE_URL` is the pooled connection string from Supabase → Project Settings
→ Database. Do not paste it into a file, a chat, or a commit.

## Why the folder existed for months and never ran

`supabase/migrations/` has looked like a migration system since the first
commit. Nothing read it. Every migration in it was applied, if at all, by
someone opening the Supabase SQL editor and pasting a file in.

The lessons 17–31 migration is the proof. It was written in August, `git log`
says it shipped, and `/api/lessons/17` returned 404 for weeks afterwards.
Fifteen lessons — half the course — were unreachable, lesson 18 stayed locked
behind them, and the repository looked completely healthy the whole time.

A folder that looks like a system and is not one is worse than no folder,
because it stops anybody asking the question.

## Why the first run refuses

Four of the five migrations here were applied by hand before this tool existed,
and nothing anywhere recorded that. A runner starting from an empty ledger
concludes all five are pending, and the first one it would re-run is
`codeit_initial_schema`: 383 lines, 82 statements, **not one of them guarded by
`IF NOT EXISTS`**, against the database holding every child's account.

So the first run against a database with no ledger prints the plan and stops.
`--baseline <version>` writes the ledger for everything up to and including that
version *without running a line of it*. That is how you tell the tool what the
database already knows.

## Why there is no CI hook

There is deliberately no automatic migration step in `.github/workflows`.

Migrations run against the live database. The standing rule on this project is
that nothing destructive gets deployed and that data and accounts are preserved.
An automatic runner turns one bad merge into one bad Saturday. `--apply` is
typed on purpose, by a person who has read the plan.

The runner also refuses outright to apply anything containing `DROP`,
`TRUNCATE` or `DELETE FROM` outside a comment. Those get run by hand, having
been read, with a backup that has been tested. (Backups are still not enabled on
this project. They should be.)

## The bookkeeping table

Applied migrations are recorded in `supabase_migrations.schema_migrations` —
the same schema, table and columns the Supabase CLI uses. Running this tool and
later running `supabase db push` will agree about what is done rather than
fighting about it.

The table is created on first connection if it is not there. That is the only
schema change this tool makes on its own.

## Writing a new migration

Name it `YYYYMMDDHHMMSS_short_name.sql`. The timestamp is the version and it is
what orders them, so it must sort correctly.

Make it idempotent — `on conflict do nothing`, `where not exists`, `if not
exists` — and wrap it in `begin; ... commit;`. Then prove it: run it twice
against a scratch database and check the row counts do not move.

The 17–31 migration was verified that way. Applied to an empty Postgres it
inserts 15 lessons and 60 quiz questions; run a second time it inserts nothing
and the counts stay at 15 and 60.
