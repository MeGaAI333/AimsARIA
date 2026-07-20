-- 20260701000000_base_schema.sql added an organizations table and FK'd
-- org_id against it, but CREATE TABLE IF NOT EXISTS silently skipped every
-- table that already existed with real data in it (contacts, campaigns,
-- org_settings, client_profiles, onboarding_data, call_recordings,
-- voice_call_contexts, agent_voice_configs) — so those never actually got
-- the constraint. This backfills it:
--   1. For each table, create an organizations row for any org_id already
--      in use that doesn't have one yet (so the constraint below doesn't
--      reject existing data).
--   2. Add the FK constraint, skipping tables that already have it (so
--      this migration can be re-run safely).
--
-- Named org_id-only (no display name) values get name = org_id itself,
-- same convention invite-user uses when no org_name is supplied.

do $$
declare
  t record;
begin
  for t in
    select unnest(array[
      'contacts', 'tasks', 'notes', 'events', 'conversations',
      'communication_logs', 'campaigns', 'lyric_posts', 'schedule_rules',
      'org_settings', 'client_profiles', 'onboarding_data',
      'call_recordings', 'voice_call_contexts', 'agent_voice_configs'
    ]) as table_name
  loop
    -- Backfill any org_id in use that has no organizations row yet.
    execute format(
      'insert into organizations (id, name)
       select distinct org_id, org_id from %I
       where org_id is not null
       on conflict (id) do nothing',
      t.table_name
    );

    -- Add the FK constraint if it isn't already there.
    if not exists (
      select 1 from pg_constraint
      where conname = t.table_name || '_org_id_fkey'
        and conrelid = t.table_name::regclass
    ) then
      execute format(
        'alter table %I add constraint %I foreign key (org_id) references organizations(id)',
        t.table_name, t.table_name || '_org_id_fkey'
      );
    end if;
  end loop;
end $$;
