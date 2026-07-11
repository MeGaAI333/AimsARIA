-- Tracks which contacts were targeted by a campaign and the outcome of each outreach attempt
create table if not exists campaign_contacts (
  id uuid default gen_random_uuid() primary key,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  channel text not null,
  status text default 'pending', -- pending, sent, failed, completed, no_answer
  external_id text,
  duration_seconds int,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  constraint campaign_contacts_unique unique(campaign_id, contact_id)
);

alter table campaign_contacts enable row level security;

create policy "org members can view campaign_contacts" on campaign_contacts
  for select using (
    campaign_id in (select id from campaigns where org_id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid()))
  );

create policy "org members can insert campaign_contacts" on campaign_contacts
  for insert with check (
    campaign_id in (select id from campaigns where org_id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid()))
  );

create policy "org members can update campaign_contacts" on campaign_contacts
  for update using (
    campaign_id in (select id from campaigns where org_id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid()))
  );

-- Link call recordings back to the campaign that triggered them, so results roll up
alter table call_recordings add column if not exists campaign_id uuid references campaigns(id);
