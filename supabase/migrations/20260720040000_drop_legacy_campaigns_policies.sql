-- These four pre-date this session and were never touched by earlier
-- "drop policy if exists" fixes because they have different names than the
-- replacement policies added in 20260701000000_base_schema.sql. Confirmed
-- live (via pg_policies) that they query auth.users directly, same bug as
-- everything else this session fixed — and because Postgres OR's every
-- policy for the same command together, this stale broken one kept failing
-- every insert even after the correctly-written replacement was in place.
-- No admin-specific campaigns policy exists to preserve here (unlike
-- conversations/onboarding_data, handled separately) — the "org members
-- can ... campaigns" policies already fully cover select/insert/update/delete.
drop policy if exists "Create org campaigns" on campaigns;
drop policy if exists "Delete org campaigns" on campaigns;
drop policy if exists "Update org campaigns" on campaigns;
drop policy if exists "View org campaigns" on campaigns;
