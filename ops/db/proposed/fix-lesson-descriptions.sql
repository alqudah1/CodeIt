-- Seven lesson descriptions that describe a different course
--
-- ── Not a migration, on purpose ─────────────────────────────────────────────
--
-- This file is in ops/db/proposed/ rather than supabase/migrations/ because it
-- rewrites rows in a live database and that is a decision the owner makes, not
-- a thing a runner does on a schedule. ops/db/migrate.js would refuse it
-- anyway: it stops before any migration that rewrites existing rows.
--
-- ── What is wrong ───────────────────────────────────────────────────────────
--
-- Seven of the sixteen original lesson rows carry a description belonging to an
-- older ten-lesson Python course. The titles were rewritten at some point and
-- the descriptions were not, so they now sit one topic out of step.
--
-- Lesson 7 is the clearest tell. It is called "Basic Lists" and production
-- describes it as "Read and write files using Python open() and the with
-- statement". This course has no file-handling lesson at all.
--
-- ── Where it shows, and where it does not ───────────────────────────────────
--
-- Not on the lesson map: that renders the title only, so no child is currently
-- reading these. They are served by GET /api/lessons, which is public and
-- unauthenticated, so they are what any other reader of that endpoint sees —
-- and they are what the database says these lessons are.
--
-- ── The replacement text ────────────────────────────────────────────────────
--
-- Taken from src/pages/Lessons/lessonRegistry.js, which is the summary written
-- for each lesson and shown beside it in the app. Nothing here is invented.
--
-- ── If you run this ─────────────────────────────────────────────────────────
--
-- Say so, because supabase/migrations/20260826030000_lessons_1_to_16.sql
-- records production as it is today, wrong descriptions and all. Once this is
-- applied that file needs the same seven lines changed, or a rebuilt database
-- will quietly disagree with the live one again.
--
-- Read it, take a backup you have tested, then:
--   psql "$DATABASE_URL" -f ops/db/proposed/fix-lesson-descriptions.sql

begin;

--  3  Strings
--     was: Repeat code with for loops and group actions into reusable functions
--     now: Work with text using quotes, len(), and string methods
update public.lessons set description = 'Work with text using quotes, len(), and string methods' where id = 3;

--  5  Simple Repetition
--     was: Collect items in lists and manipulate text with string methods
--     now: Repeat code automatically using for i in range()
update public.lessons set description = 'Repeat code automatically using for i in range()' where id = 5;

--  6  For Loops
--     was: Store key-value pairs in dictionaries and unique items in sets
--     now: Loop over characters and sequences with for loops
update public.lessons set description = 'Loop over characters and sequences with for loops' where id = 6;

--  7  Basic Lists
--     was: Read and write files using Python open() and the with statement
--     now: Create and use Python lists. Index, append, and len()
update public.lessons set description = 'Create and use Python lists. Index, append, and len()' where id = 7;

--  8  Loops with Lists
--     was: Catch and handle errors gracefully with try and except
--     now: Combine loops and lists to process collections of data
update public.lessons set description = 'Combine loops and lists to process collections of data' where id = 8;

--  9  Basic Functions
--     was: Define classes and create objects with attributes and methods
--     now: Write reusable functions using def, parameters, and return
update public.lessons set description = 'Write reusable functions using def, parameters, and return' where id = 9;

-- 10  Combining Concepts
--     was: Import and use Python modules like math, random and datetime
--     now: Put it all together. Functions, loops, and lists in one program
update public.lessons set description = 'Put it all together. Functions, loops, and lists in one program' where id = 10;

-- Look before you commit. Seven rows, and nothing else touched.
select id, title, description from public.lessons where id in (3, 5, 6, 7, 8, 9, 10) order by id;

commit;
