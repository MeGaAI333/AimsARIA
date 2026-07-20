-- Holds the per-call context (which agent, which campaign/contact, fallback
-- opening line) that the Twilio webhook needs when a call connects. Twilio's
-- TwiML webhook only gets a short-lived HTTP request with no way to carry rich
-- data itself, so we stash it here and pass just the row id in the webhook URL.
--
-- org_id is nullable: inbound calls (and the global default voice config path)
-- may not have a resolved org at connect time.
create table if not exists voice_call_contexts (
  id uuid default gen_random_uuid() primary key,
  org_id text references organizations(id),
  agent_id text not null,
  campaign_id uuid references campaigns(id),
  contact_id uuid references contacts(id),
  contact_name text,
  contact_phone text,
  opening_message text,
  direction text not null default 'outbound', -- outbound, inbound
  created_at timestamp default now()
);

alter table voice_call_contexts enable row level security;

drop policy if exists "org members can view voice_call_contexts" on voice_call_contexts;
create policy "org members can view voice_call_contexts" on voice_call_contexts
  for select using (
    org_id is null or org_id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid())
  );

drop policy if exists "org members can insert voice_call_contexts" on voice_call_contexts;
create policy "org members can insert voice_call_contexts" on voice_call_contexts
  for insert with check (
    org_id is null or org_id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid())
  );

-- Written/read by the voice-agent Node service using the service role key,
-- which bypasses RLS — the policies above just cover the app's own dashboard use.
