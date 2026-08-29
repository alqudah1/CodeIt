-- The dashboard's automatic-RLS helper is administrative only and must not be
-- callable through the public Data API.
--
-- ── Why the guard ────────────────────────────────────────────────────────────
--
-- rls_auto_enable() is created by the Supabase dashboard, not by anything in
-- this repository. On Supabase it exists and this revoke matters. On a plain
-- Postgres — a restore, a laptop, the database a CI run builds to point a
-- browser at — it does not exist, and a bare REVOKE against a missing function
-- is a hard error that stops every migration after it.
--
-- That is how a migration set stops being able to rebuild the thing it
-- describes: it ran once, on the machine it was written for, and nobody found
-- out until the day it had to run somewhere else. Guarding it changes nothing
-- on Supabase and makes the set portable everywhere else.
do $$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'rls_auto_enable'
  ) then
    execute 'revoke execute on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end
$$;

-- Cover the nullable adult account foreign key used during legacy review claims.
--
-- IF NOT EXISTS because a database that has already been hardened by hand has
-- this index, and a migration that cannot be run twice is a migration nobody
-- dares run once.
create index if not exists idx_legacy_review_adult on public.legacy_parent_reviews(adult_user_id);
