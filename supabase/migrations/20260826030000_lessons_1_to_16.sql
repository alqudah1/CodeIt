-- Lessons 1 to 16.
--
-- ── Why this did not exist until now ────────────────────────────────────────
--
-- The first sixteen lessons have only ever existed as rows somebody typed into
-- the production database. No migration created them, no seed file, no fixture.
-- The repository held the React content that displays a lesson and no record at
-- all of the rows the backend reads to award XP and unlock the next one.
--
-- So if that Supabase project were lost, or a staging environment were stood up
-- tomorrow, lessons 1 to 16 would simply not be there — and nothing anywhere
-- would have warned that this was true. It is the same shape as the migration
-- folder that nothing ran: something real living in exactly one place, with
-- nothing checking that it still does.
--
-- ── What this file is, and is not ───────────────────────────────────────────
--
-- It is a faithful record of what production holds right now, read from the
-- public GET /api/lessons endpoint. It is NOT a correction. Every insert is
-- guarded by ON CONFLICT (id) DO NOTHING, so running it against the live
-- database changes nothing whatsoever; it exists so an empty database can be
-- brought up to match.
--
-- ── Seven descriptions, corrected on 30 August 2026 ─────────────────────────
--
-- As first recorded, seven of these sixteen rows carried descriptions from an
-- older ten-lesson course (lesson 7, "Basic Lists", said "Read and write
-- files…" — this course has no file-handling lesson at all). Production was
-- corrected on 30 August 2026, from the Supabase SQL editor, to the summaries
-- in src/pages/Lessons/lessonRegistry.js — the same texts held in
-- packages/codeit-backend/maintenanceSql.js. This file now records the
-- corrected descriptions, so a database rebuilt from migrations matches the
-- production that exists, not the production that was wrong.
--
-- ── What this file cannot reproduce ─────────────────────────────────────────
--
-- content, example_code, starter_code, expected_output and hints are not
-- exposed by any public endpoint, so they are not here and will be null in a
-- rebuilt database. They are nullable columns and nothing in the backend reads
-- them for lessons 1 to 16 — the lesson bodies live in React. If they turn out
-- to hold anything, export them and add them here rather than guessing.

begin;

insert into public.lessons (id, title, description, xp)
values (1, 'Hello Python', 'Write your first Python program using print statements and string literals', 50)
  on conflict (id) do nothing;

insert into public.lessons (id, title, description, xp)
values (2, 'Storing Info with Variables', 'Store names, numbers and text using Python variables', 50)
  on conflict (id) do nothing;

insert into public.lessons (id, title, description, xp)
values (3, 'Strings', 'Work with text using quotes, len(), and string methods', 60)
  on conflict (id) do nothing;

insert into public.lessons (id, title, description, xp)
values (4, 'Making Decisions with If Statements', 'Make decisions in Python using if, elif and else', 60)
  on conflict (id) do nothing;

insert into public.lessons (id, title, description, xp)
values (5, 'Simple Repetition', 'Repeat code automatically using for i in range()', 70)
  on conflict (id) do nothing;

insert into public.lessons (id, title, description, xp)
values (6, 'For Loops', 'Loop over characters and sequences with for loops', 60)
  on conflict (id) do nothing;

insert into public.lessons (id, title, description, xp)
values (7, 'Basic Lists', 'Create and use Python lists. Index, append, and len()', 65)
  on conflict (id) do nothing;

insert into public.lessons (id, title, description, xp)
values (8, 'Loops with Lists', 'Combine loops and lists to process collections of data', 70)
  on conflict (id) do nothing;

insert into public.lessons (id, title, description, xp)
values (9, 'Basic Functions', 'Write reusable functions using def, parameters, and return', 75)
  on conflict (id) do nothing;

insert into public.lessons (id, title, description, xp)
values (10, 'Combining Concepts', 'Put it all together. Functions, loops, and lists in one program', 80)
  on conflict (id) do nothing;

insert into public.lessons (id, title, description, xp)
values (11, 'Numbers & Arithmetic', 'Integers, floats, and arithmetic operators (+, -, *, /, //, %, **)', 190)
  on conflict (id) do nothing;

insert into public.lessons (id, title, description, xp)
values (12, 'Booleans & Comparisons', 'True/False values and comparison operators (==, !=, <, >, <=, >=)', 190)
  on conflict (id) do nothing;

insert into public.lessons (id, title, description, xp)
values (13, 'Logical Operators', 'Combine conditions with and, or, and not', 200)
  on conflict (id) do nothing;

insert into public.lessons (id, title, description, xp)
values (14, 'Type Casting', 'Convert between int, float, str, and bool using built-in functions', 200)
  on conflict (id) do nothing;

insert into public.lessons (id, title, description, xp)
values (15, 'String Formatting', 'Build clean output with f-strings and format specifiers', 210)
  on conflict (id) do nothing;

insert into public.lessons (id, title, description, xp)
values (16, 'String Methods', 'strip, replace, split, join, find, and count', 210)
  on conflict (id) do nothing;

-- Keep the identity sequence ahead of the highest id, so a later insert that
-- does not name an id does not collide with one of these.
select setval(pg_get_serial_sequence('public.lessons', 'id'),
              greatest((select max(id) from public.lessons), 1));

commit;