-- campaign_contacts was missed in the earlier column-backfill pass. The real
-- pre-existing table only had id/campaign_id/contact_id/status/sent_at/
-- response_at/created_at — missing channel, external_id, duration_seconds,
-- and updated_at that Campaigns.jsx and bland-webhook both write, and
-- missing the unique(campaign_id, contact_id) constraint that the upsert's
-- on_conflict clause depends on. Without that constraint, Postgres rejects
-- the on_conflict target outright (400, no matching unique/exclusion
-- constraint) — confirmed live as the cause of both the upsert POST and the
-- later status-update PATCH failing.

alter table campaign_contacts
  add column if not exists channel text,
  add column if not exists external_id text,
  add column if not exists duration_seconds int,
  add column if not exists updated_at timestamptz default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'campaign_contacts_unique'
      and conrelid = 'campaign_contacts'::regclass
  ) then
    alter table campaign_contacts
      add constraint campaign_contacts_unique unique (campaign_id, contact_id);
  end if;
end $$;
