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
-- ── The part that is wrong, and is preserved anyway ─────────────────────────
--
-- Seven of these sixteen rows carry a description belonging to a different
-- curriculum. They are left exactly as production has them:
--
--    3  Strings              says "Repeat code with for loops and group actions
--                            into reusable functions"
--    5  Simple Repetition    says "Collect items in lists and manipulate text
--                            with string methods"
--    6  For Loops            says "Store key-value pairs in dictionaries and
--                            unique items in sets"
--    7  Basic Lists          says "Read and write files using Python open() and
--                            the with statement"
--    8  Loops with Lists     says "Catch and handle errors gracefully with try
--                            and except"
--    9  Basic Functions      says "Define classes and create objects with
--                            attributes and methods"
--   10  Combining Concepts   says "Import and use Python modules like math,
--                            random and datetime"
--
-- Lesson 7 is the clearest tell: this course has no file-handling lesson at
-- all. These read as the descriptions of an older ten-lesson course, left
-- behind when the titles were rewritten and never updated.
--
-- Recording what is true and changing what is true are two different acts, and
-- a migration that quietly did both would be untrustworthy for either. The
-- correction is a separate migration, for the owner to approve, and it is not
-- in this file.
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
values (3, 'Strings', 'Repeat code with for loops and group actions into reusable functions', 60)
  on conflict (id) do nothing;   -- ⚠ description does not match this lesson. See the note above.

insert into public.lessons (id, title, description, xp)
values (4, 'Making Decisions with If Statements', 'Make decisions in Python using if, elif and else', 60)
  on conflict (id) do nothing;

insert into public.lessons (id, title, description, xp)
values (5, 'Simple Repetition', 'Collect items in lists and manipulate text with string methods', 70)
  on conflict (id) do nothing;   -- ⚠ description does not match this lesson. See the note above.

insert into public.lessons (id, title, description, xp)
values (6, 'For Loops', 'Store key-value pairs in dictionaries and unique items in sets', 60)
  on conflict (id) do nothing;   -- ⚠ description does not match this lesson. See the note above.

insert into public.lessons (id, title, description, xp)
values (7, 'Basic Lists', 'Read and write files using Python open() and the with statement', 65)
  on conflict (id) do nothing;   -- ⚠ description does not match this lesson. See the note above.

insert into public.lessons (id, title, description, xp)
values (8, 'Loops with Lists', 'Catch and handle errors gracefully with try and except', 70)
  on conflict (id) do nothing;   -- ⚠ description does not match this lesson. See the note above.

insert into public.lessons (id, title, description, xp)
values (9, 'Basic Functions', 'Define classes and create objects with attributes and methods', 75)
  on conflict (id) do nothing;   -- ⚠ description does not match this lesson. See the note above.

insert into public.lessons (id, title, description, xp)
values (10, 'Combining Concepts', 'Import and use Python modules like math, random and datetime', 80)
  on conflict (id) do nothing;   -- ⚠ description does not match this lesson. See the note above.

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