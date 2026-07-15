-- agent_settings.selected_voice used to default to Bland's "june" voice.
-- Now that calls run through ElevenLabs, switch the default and backfill
-- any rows still holding the old Bland voice name.
alter table agent_settings alter column selected_voice set default '21m00Tcm4TlvDq8ikWAM';

update agent_settings
set selected_voice = '21m00Tcm4TlvDq8ikWAM'
where selected_voice = 'june' or selected_voice is null;

-- Holds the per-call context (which agent, which campaign/contact, what to say,
-- which voice) that the Twilio webhook needs when a call connects. Twilio's
-- TwiML webhook only gets a short-lived HTTP request with no way to carry rich
-- data itself, so we stash it here and pass just the row id in the webhook URL.
create table if not exists voice_call_contexts (
  id uuid default gen_random_uuid() primary key,
  org_id text not null,
  agent_id text not null,
  campaign_id uuid references campaigns(id),
  contact_id uuid references contacts(id),
  contact_name text,
  contact_phone text,
  opening_message text not null,
  system_prompt text,
  voice_id text not null,
  direction text not null default 'outbound', -- outbound, inbound
  created_at timestamp default now()
);

alter table voice_call_contexts enable row level security;

create policy "org members can view voice_call_contexts" on voice_call_contexts
  for select using (org_id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid()));

create policy "org members can insert voice_call_contexts" on voice_call_contexts
  for insert with check (org_id = (select raw_user_meta_data->>'org_id' from auth.users where id = auth.uid()));

-- Written/read by the voice-agent Node service using the service role key,
-- which bypasses RLS — the policies above just cover the app's own dashboard use.
