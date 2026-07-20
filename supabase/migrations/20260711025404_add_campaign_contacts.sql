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

-- Stores Bland call outcomes (created here since it was referenced by the webhook
-- but never actually had a table backing it)
create table if not exists call_recordings (
  id uuid default gen_random_uuid() primary key,
  call_id text unique not null,
  org_id text not null references organizations(id),
  agent_id text,
  campaign_id uuid references campaigns(id),
  duration_seconds int default 0,
  transcript text,
  recording_url text,
  status text default 'in_progress', -- in_progress, completed
  completed_at timestamp,
  created_at timestamp default now()
);

alter table call_recordings enable row level security;

create policy "org members can view call_recordings" on call_recordings
  for select using (org_id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid()));

-- Written by the bland-webhook edge function using the service role key, which
-- bypasses RLS — no insert/update policy needed for that path.
