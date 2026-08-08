-- The dashboard's automatic-RLS helper is administrative only and must not be
-- callable through the public Data API.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- Cover the nullable adult account foreign key used during legacy review claims.
create index idx_legacy_review_adult on public.legacy_parent_reviews(adult_user_id);
