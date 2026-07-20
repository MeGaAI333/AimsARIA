-- Base schema for the AIMS AI Command Center. Reconstructed from how the
-- application code actually reads/writes these tables (src/lib/db.js, every
-- view, and the Edge Functions) — no schema.sql or original migration for
-- this ever existed in the repo, even though every later migration
-- (add_campaign_contacts.sql, add_twilio_voice_pipeline.sql, etc.) assumes
-- these tables already exist. Must run before all of those.
--
-- org_id is TEXT everywhere (not uuid) to match the existing convention:
-- every RLS policy in this app compares against
-- raw_user_meta_data->>'org_id', which is text.

-- The source of truth for org_id: every org_id column below is a real
-- foreign key against this table, so a typo or an org that was never set
-- up can't silently create orphaned rows or leak into another org's data.
-- parent_org_id groups multiple locations under one client (e.g.
-- 'acme-downtown' and 'acme-uptown' both pointing at 'acme') for reporting
-- — it does NOT widen data access; every RLS policy still keys off the
-- exact org_id on the row, never the parent chain.
create table if not exists organizations (
  id text primary key,
  name text not null,
  parent_org_id text references organizations(id),
  created_at timestamptz default now()
);

alter table organizations enable row level security;

drop policy if exists "org members can view their own org" on organizations;
create policy "org members can view their own org" on organizations
  for select using (
    id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid())
    or parent_org_id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid())
  );

-- Sentinel row for legacy/unassigned data — voice-agent/server.js and the
-- bland-webhook function fall back to org_id = 'default' when a call
-- context has no resolved org, so this must exist or those inserts would
-- fail the FK constraint below.
insert into organizations (id, name) values ('default', 'Unassigned')
on conflict (id) do nothing;

create table if not exists contacts (
  id uuid default gen_random_uuid() primary key,
  org_id text references organizations(id),
  name text not null,
  company text,
  email text,
  phone text,
  industry text,
  stage text default 'cold', -- cold, contacted, qualified, negotiating, won, lost
  value numeric default 0,
  score int default 50,
  source text,
  assigned_to text, -- agent id, e.g. 'aria'
  tags text[] default '{}',
  last_contact timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table contacts enable row level security;

drop policy if exists "org members can view contacts" on contacts;
create policy "org members can view contacts" on contacts
  for select using (org_id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid()));
drop policy if exists "org members can insert contacts" on contacts;
create policy "org members can insert contacts" on contacts
  for insert with check (org_id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid()));
drop policy if exists "org members can update contacts" on contacts;
create policy "org members can update contacts" on contacts
  for update using (org_id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid()));
drop policy if exists "org members can delete contacts" on contacts;
create policy "org members can delete contacts" on contacts
  for delete using (org_id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid()));

create table if not exists tasks (
  id uuid default gen_random_uuid() primary key,
  org_id text references organizations(id),
  title text not null,
  due text,
  priority text default 'medium',
  contact_name text,
  assignee text,
  done boolean default false,
  status text,
  created_at timestamptz default now()
);

alter table tasks enable row level security;

drop policy if exists "org members can view tasks" on tasks;
create policy "org members can view tasks" on tasks
  for select using (org_id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid()));
drop policy if exists "org members can insert tasks" on tasks;
create policy "org members can insert tasks" on tasks
  for insert with check (org_id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid()));
drop policy if exists "org members can update tasks" on tasks;
create policy "org members can update tasks" on tasks
  for update using (org_id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid()));
drop policy if exists "org members can delete tasks" on tasks;
create policy "org members can delete tasks" on tasks
  for delete using (org_id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid()));

create table if not exists notes (
  id uuid default gen_random_uuid() primary key,
  org_id text references organizations(id),
  contact_name text,
  content text,
  author text,
  role text,
  created_at timestamptz default now()
);

alter table notes enable row level security;

drop policy if exists "org members can view notes" on notes;
create policy "org members can view notes" on notes
  for select using (org_id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid()));
drop policy if exists "org members can insert notes" on notes;
create policy "org members can insert notes" on notes
  for insert with check (org_id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid()));
drop policy if exists "org members can delete notes" on notes;
create policy "org members can delete notes" on notes
  for delete using (org_id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid()));

create table if not exists events (
  id uuid default gen_random_uuid() primary key,
  org_id text references organizations(id),
  title text not null,
  date date,
  time text,
  duration text default '30 min',
  type text default 'call',
  contact_name text,
  agent text,
  created_at timestamptz default now()
);

alter table events enable row level security;

drop policy if exists "org members can view events" on events;
create policy "org members can view events" on events
  for select using (org_id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid()));
drop policy if exists "org members can insert events" on events;
create policy "org members can insert events" on events
  for insert with check (org_id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid()));
drop policy if exists "org members can delete events" on events;
create policy "org members can delete events" on events
  for delete using (org_id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid()));

create table if not exists conversations (
  id uuid default gen_random_uuid() primary key,
  org_id text references organizations(id),
  contact_id uuid references contacts(id) on delete set null,
  contact_name text,
  contact_company text,
  contact_phone text,
  agent_id text,
  status text default 'active', -- active, needs_human, human_active, closed
  channel text,
  messages jsonb default '[]',
  assigned_to_human text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table conversations enable row level security;

drop policy if exists "org members can view conversations" on conversations;
create policy "org members can view conversations" on conversations
  for select using (org_id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid()));
drop policy if exists "org members can insert conversations" on conversations;
create policy "org members can insert conversations" on conversations
  for insert with check (org_id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid()));
drop policy if exists "org members can update conversations" on conversations;
create policy "org members can update conversations" on conversations
  for update using (org_id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid()));

-- Written by both the browser (org member sending outreach) and the
-- twilio-webhook / bland-webhook Edge Functions via the service role key
-- (which bypasses RLS), so only the browser-facing path needs a policy.
create table if not exists communication_logs (
  id uuid default gen_random_uuid() primary key,
  org_id text references organizations(id),
  contact_id uuid references contacts(id) on delete set null,
  contact_name text,
  contact_phone text,
  contact_email text,
  agent_id text,
  channel text, -- call, text, email
  message text,
  status text,
  external_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table communication_logs enable row level security;

drop policy if exists "org members can view communication_logs" on communication_logs;
create policy "org members can view communication_logs" on communication_logs
  for select using (org_id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid()));
drop policy if exists "org members can insert communication_logs" on communication_logs;
create policy "org members can insert communication_logs" on communication_logs
  for insert with check (org_id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid()));
drop policy if exists "org members can update communication_logs" on communication_logs;
create policy "org members can update communication_logs" on communication_logs
  for update using (org_id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid()));

create table if not exists campaigns (
  id uuid default gen_random_uuid() primary key,
  org_id text references organizations(id),
  created_by uuid references auth.users(id),
  name text not null,
  description text,
  agent_id text,
  campaign_type text,
  channel text default 'call',
  target_audience text,
  goal text,
  start_date date,
  status text default 'draft', -- draft, active, completed
  launched_at timestamptz,
  created_at timestamptz default now()
);

alter table campaigns enable row level security;

drop policy if exists "org members can view campaigns" on campaigns;
create policy "org members can view campaigns" on campaigns
  for select using (org_id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid()));
drop policy if exists "org members can insert campaigns" on campaigns;
create policy "org members can insert campaigns" on campaigns
  for insert with check (org_id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid()));
drop policy if exists "org members can update campaigns" on campaigns;
create policy "org members can update campaigns" on campaigns
  for update using (org_id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid()));
drop policy if exists "org members can delete campaigns" on campaigns;
create policy "org members can delete campaigns" on campaigns
  for delete using (org_id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid()));

-- retry_count and backoff_until are added by the next migration
-- (20260705063631_add_retry_count_to_lyric_posts.sql), not here, so that
-- migration keeps doing real work instead of becoming a no-op.
create table if not exists lyric_posts (
  id uuid default gen_random_uuid() primary key,
  org_id text references organizations(id),
  content_type text,
  platform text,
  topic text,
  copy text,
  text text, -- used as a fallback body by retry-failed-communications
  images jsonb default '[]',
  image text, -- single-image fallback used by retry-failed-communications
  profile_ids text[],
  status text default 'draft', -- draft, pending_approval, published, failed, discarded
  scheduled_at timestamptz,
  published_at timestamptz,
  buffer_post_id text,
  buffer_id text,
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table lyric_posts enable row level security;

drop policy if exists "org members can view lyric_posts" on lyric_posts;
create policy "org members can view lyric_posts" on lyric_posts
  for select using (org_id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid()));
drop policy if exists "org members can insert lyric_posts" on lyric_posts;
create policy "org members can insert lyric_posts" on lyric_posts
  for insert with check (org_id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid()));
drop policy if exists "org members can update lyric_posts" on lyric_posts;
create policy "org members can update lyric_posts" on lyric_posts
  for update using (org_id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid()));
drop policy if exists "org members can delete lyric_posts" on lyric_posts;
create policy "org members can delete lyric_posts" on lyric_posts
  for delete using (org_id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid()));

create table if not exists schedule_rules (
  id uuid default gen_random_uuid() primary key,
  org_id text references organizations(id),
  name text,
  platforms text[],
  days_of_week text[],
  time_of_day text,
  duration_days int,
  start_date date,
  created_at timestamptz default now()
);

alter table schedule_rules enable row level security;

drop policy if exists "org members can view schedule_rules" on schedule_rules;
create policy "org members can view schedule_rules" on schedule_rules
  for select using (org_id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid()));
drop policy if exists "org members can insert schedule_rules" on schedule_rules;
create policy "org members can insert schedule_rules" on schedule_rules
  for insert with check (org_id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid()));
drop policy if exists "org members can update schedule_rules" on schedule_rules;
create policy "org members can update schedule_rules" on schedule_rules
  for update using (org_id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid()));
drop policy if exists "org members can delete schedule_rules" on schedule_rules;
create policy "org members can delete schedule_rules" on schedule_rules
  for delete using (org_id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid()));

-- One row per org. buffer_api_token/buffer_token are the same value under
-- two different names used by different Edge Functions — kept both to
-- match what the code actually reads rather than picking one and silently
-- breaking the other function.
create table if not exists org_settings (
  org_id text primary key references organizations(id),
  buffer_api_token text,
  buffer_token text,
  buffer_connected_at timestamptz,
  notification_preferences jsonb default '{
    "lead_stage_changed": true,
    "post_published": true,
    "task_assigned": true,
    "communication_failed": true,
    "agent_escalation": true
  }'::jsonb,
  updated_at timestamptz default now()
);

alter table org_settings enable row level security;

drop policy if exists "org members can view org_settings" on org_settings;
create policy "org members can view org_settings" on org_settings
  for select using (org_id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid()));
drop policy if exists "org members can upsert org_settings" on org_settings;
create policy "org members can upsert org_settings" on org_settings
  for insert with check (org_id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid()));
drop policy if exists "org members can update org_settings" on org_settings;
create policy "org members can update org_settings" on org_settings
  for update using (org_id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid()));

create table if not exists client_profiles (
  org_id text primary key references organizations(id),
  business_name text,
  industry text,
  website text,
  service_area text,
  target_audience text,
  demographics text,
  pain_points text,
  platforms text[] default '{}',
  posting_frequency jsonb default '{}',
  content_pillars text,
  brand_tone text[] default '{}',
  competitors text,
  restrictions text,
  hashtags text,
  approval_contact text,
  buffer_setup boolean default false,
  notes text,
  updated_at timestamptz default now()
);

alter table client_profiles enable row level security;

drop policy if exists "org members can view client_profiles" on client_profiles;
create policy "org members can view client_profiles" on client_profiles
  for select using (org_id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid()));
drop policy if exists "org members can upsert client_profiles" on client_profiles;
create policy "org members can upsert client_profiles" on client_profiles
  for insert with check (org_id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid()));
drop policy if exists "org members can update client_profiles" on client_profiles;
create policy "org members can update client_profiles" on client_profiles
  for update using (org_id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid()));

create table if not exists onboarding_data (
  org_id text primary key references organizations(id),
  business_name text, industry text, years_in_business text, website text, phone text,
  service_area text, staff_size text, revenue_range text,
  primary_pain text, monthly_lead_volume text, ad_spend text, current_response_time text,
  current_crm text, crm_other text, situation_notes text,
  services_selected text[] default '{}', plan_tier text,
  lead_sources text[] default '{}', has_cold_list boolean default false, cold_list_size text, lead_source_notes text,
  agent_name text, brand_tone text[] default '{}', emoji_use boolean default false,
  certifications text, phrases_to_avoid text, top_objections text,
  google_rating text, google_review_count text, social_platforms text[] default '{}',
  last_post_date date, has_email_list boolean default false, email_list_size text, has_job_photos boolean default false,
  crm_integration text, calendar_system text, booking_link text,
  approval_contact text, leads_notification_contact text, integration_notes text,
  target_start_date date, kickoff_scheduled boolean default false, kickoff_date date, notes text,
  status text default 'Not Started',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table onboarding_data enable row level security;

drop policy if exists "org members can view onboarding_data" on onboarding_data;
create policy "org members can view onboarding_data" on onboarding_data
  for select using (org_id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid()));
drop policy if exists "org members can upsert onboarding_data" on onboarding_data;
create policy "org members can upsert onboarding_data" on onboarding_data
  for insert with check (org_id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid()));
drop policy if exists "org members can update onboarding_data" on onboarding_data;
create policy "org members can update onboarding_data" on onboarding_data
  for update using (org_id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid()));

-- Per-user (not per-org) — tracks which items a given person has checked off
-- in the onboarding hub / setup wizard.
create table if not exists onboarding_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  completed_tasks jsonb default '[]',
  updated_at timestamptz default now()
);

alter table onboarding_progress enable row level security;

drop policy if exists "users can view their own onboarding_progress" on onboarding_progress;
create policy "users can view their own onboarding_progress" on onboarding_progress
  for select using (user_id = auth.uid());
drop policy if exists "users can upsert their own onboarding_progress" on onboarding_progress;
create policy "users can upsert their own onboarding_progress" on onboarding_progress
  for insert with check (user_id = auth.uid());
drop policy if exists "users can update their own onboarding_progress" on onboarding_progress;
create policy "users can update their own onboarding_progress" on onboarding_progress
  for update using (user_id = auth.uid());

create table if not exists onboarding_wizard_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  form_data jsonb default '{}',
  updated_at timestamptz default now()
);

alter table onboarding_wizard_data enable row level security;

drop policy if exists "users can view their own onboarding_wizard_data" on onboarding_wizard_data;
create policy "users can view their own onboarding_wizard_data" on onboarding_wizard_data
  for select using (user_id = auth.uid());
drop policy if exists "users can upsert their own onboarding_wizard_data" on onboarding_wizard_data;
create policy "users can upsert their own onboarding_wizard_data" on onboarding_wizard_data
  for insert with check (user_id = auth.uid());
drop policy if exists "users can update their own onboarding_wizard_data" on onboarding_wizard_data;
create policy "users can update their own onboarding_wizard_data" on onboarding_wizard_data
  for update using (user_id = auth.uid());
