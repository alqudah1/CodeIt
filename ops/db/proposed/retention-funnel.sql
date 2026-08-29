-- Where do learners actually stop?
--
-- ── Why this exists ─────────────────────────────────────────────────────────
--
-- Two sessions have now argued about the same two numbers: 230 people started
-- lesson 1 and 11 finished. One said the cause was lessons 17 to 31 returning
-- 404 for six days. The other said the drop is motivational and proved the
-- 17 → 18 gate works end to end with a real account.
--
-- Neither of us looked at the shape in between. Both explanations fit a summary
-- of two numbers, which is exactly why a summary of two numbers should not have
-- been used to decide anything.
--
-- This is read-only. Nothing here writes, updates or deletes. Safe to run on
-- production, and the point is to run it there, because staging has no learners.
--
-- ── How to read the result ──────────────────────────────────────────────────
--
-- A cliff at lesson 2 or 3 means the opening does not hold people, and no amount
-- of curriculum further along will help. That is the motivational case.
--
-- A flat curve that falls off after 16 means the missing lessons were the wall
-- and the migration has already fixed it. Expect the numbers to recover on their
-- own over the next few weeks.
--
-- A gentle slope all the way down is the ordinary shape of a free course, and
-- means neither story is right and the honest answer is that the product is fine
-- and not enough people are arriving.

\echo '── Completions per lesson ─────────────────────────────────────────────'

select
  l.id                                          as lesson,
  l.title,
  count(distinct p.user_id)                     as learners_completed,
  round(
    100.0 * count(distinct p.user_id)
    / nullif(max(count(distinct p.user_id)) over (), 0)
  , 1)                                          as pct_of_peak
from public.lessons l
left join public.student_lesson_progress p on p.lesson_id = l.id
group by l.id, l.title
order by l.id;

\echo ''
\echo '── The drop between consecutive lessons ───────────────────────────────'
\echo '   Biggest numbers here are where people leave.'

with per_lesson as (
  select l.id, l.title, count(distinct p.user_id) as learners
  from public.lessons l
  left join public.student_lesson_progress p on p.lesson_id = l.id
  group by l.id, l.title
)
select
  id                                            as lesson,
  title,
  learners,
  lag(learners) over (order by id) - learners   as lost_since_previous,
  case
    when lag(learners) over (order by id) > 0
    then round(100.0 * (lag(learners) over (order by id) - learners)
               / lag(learners) over (order by id), 1)
  end                                           as pct_lost
from per_lesson
order by id;

\echo ''
\echo '── Headline numbers, so "230 and 11" can be checked ───────────────────'

select
  (select count(*) from public.users)                                    as accounts,
  (select count(distinct user_id) from public.student_lesson_progress)   as ever_completed_a_lesson,
  (select count(distinct user_id) from public.student_lesson_progress
     where lesson_id = 1)                                                as completed_lesson_1,
  (select count(distinct user_id) from public.student_lesson_progress
     where lesson_id = 16)                                               as completed_lesson_16,
  (select count(distinct user_id) from public.student_lesson_progress
     where lesson_id = 31)                                               as completed_lesson_31;

\echo ''
\echo '── Did anyone hit the wall while 17 to 31 were missing? ───────────────'
\echo '   Learners whose furthest completed lesson is exactly 16 are the'
\echo '   people the 404s would have stopped. If this is near zero, the'
\echo '   missing lessons were not the cause and I was wrong.'

with furthest as (
  select user_id, max(lesson_id) as furthest_lesson
  from public.student_lesson_progress
  group by user_id
)
select
  furthest_lesson,
  count(*) as learners
from furthest
group by furthest_lesson
order by furthest_lesson;
