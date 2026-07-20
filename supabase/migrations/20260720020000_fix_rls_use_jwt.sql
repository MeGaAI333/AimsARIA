-- Every RLS policy in this app queried auth.users directly to read
-- org_id (`select raw_user_meta_data->>'org_id' from auth.users where id =
-- auth.uid()`) — Supabase does not grant the authenticated role SELECT on
-- that table (it holds emails, password hashes, etc.), so every one of
-- these policies was guaranteed to fail with 'permission denied for table
-- users' the moment it actually evaluated, confirmed live when campaign
-- creation failed with exactly that error. Reading org_id out of the
-- session's JWT via auth.jwt() instead needs no table grants at all.

drop policy if exists "org members can view their own org" on organizations;
create policy "org members can view their own org" on organizations
  for select using (id = (auth.jwt() -> 'user_metadata' ->> 'org_id') or parent_org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can view contacts" on contacts;
create policy "org members can view contacts" on contacts
  for select using (org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can insert contacts" on contacts;
create policy "org members can insert contacts" on contacts
  for insert with check (org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can update contacts" on contacts;
create policy "org members can update contacts" on contacts
  for update using (org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can delete contacts" on contacts;
create policy "org members can delete contacts" on contacts
  for delete using (org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can view tasks" on tasks;
create policy "org members can view tasks" on tasks
  for select using (org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can insert tasks" on tasks;
create policy "org members can insert tasks" on tasks
  for insert with check (org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can update tasks" on tasks;
create policy "org members can update tasks" on tasks
  for update using (org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can delete tasks" on tasks;
create policy "org members can delete tasks" on tasks
  for delete using (org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can view notes" on notes;
create policy "org members can view notes" on notes
  for select using (org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can insert notes" on notes;
create policy "org members can insert notes" on notes
  for insert with check (org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can delete notes" on notes;
create policy "org members can delete notes" on notes
  for delete using (org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can view events" on events;
create policy "org members can view events" on events
  for select using (org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can insert events" on events;
create policy "org members can insert events" on events
  for insert with check (org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can delete events" on events;
create policy "org members can delete events" on events
  for delete using (org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can view conversations" on conversations;
create policy "org members can view conversations" on conversations
  for select using (org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can insert conversations" on conversations;
create policy "org members can insert conversations" on conversations
  for insert with check (org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can update conversations" on conversations;
create policy "org members can update conversations" on conversations
  for update using (org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can view communication_logs" on communication_logs;
create policy "org members can view communication_logs" on communication_logs
  for select using (org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can insert communication_logs" on communication_logs;
create policy "org members can insert communication_logs" on communication_logs
  for insert with check (org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can update communication_logs" on communication_logs;
create policy "org members can update communication_logs" on communication_logs
  for update using (org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can view campaigns" on campaigns;
create policy "org members can view campaigns" on campaigns
  for select using (org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can insert campaigns" on campaigns;
create policy "org members can insert campaigns" on campaigns
  for insert with check (org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can update campaigns" on campaigns;
create policy "org members can update campaigns" on campaigns
  for update using (org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can delete campaigns" on campaigns;
create policy "org members can delete campaigns" on campaigns
  for delete using (org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can view lyric_posts" on lyric_posts;
create policy "org members can view lyric_posts" on lyric_posts
  for select using (org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can insert lyric_posts" on lyric_posts;
create policy "org members can insert lyric_posts" on lyric_posts
  for insert with check (org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can update lyric_posts" on lyric_posts;
create policy "org members can update lyric_posts" on lyric_posts
  for update using (org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can delete lyric_posts" on lyric_posts;
create policy "org members can delete lyric_posts" on lyric_posts
  for delete using (org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can view schedule_rules" on schedule_rules;
create policy "org members can view schedule_rules" on schedule_rules
  for select using (org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can insert schedule_rules" on schedule_rules;
create policy "org members can insert schedule_rules" on schedule_rules
  for insert with check (org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can update schedule_rules" on schedule_rules;
create policy "org members can update schedule_rules" on schedule_rules
  for update using (org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can delete schedule_rules" on schedule_rules;
create policy "org members can delete schedule_rules" on schedule_rules
  for delete using (org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can view org_settings" on org_settings;
create policy "org members can view org_settings" on org_settings
  for select using (org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can upsert org_settings" on org_settings;
create policy "org members can upsert org_settings" on org_settings
  for insert with check (org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can update org_settings" on org_settings;
create policy "org members can update org_settings" on org_settings
  for update using (org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can view client_profiles" on client_profiles;
create policy "org members can view client_profiles" on client_profiles
  for select using (org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can upsert client_profiles" on client_profiles;
create policy "org members can upsert client_profiles" on client_profiles
  for insert with check (org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can update client_profiles" on client_profiles;
create policy "org members can update client_profiles" on client_profiles
  for update using (org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can view onboarding_data" on onboarding_data;
create policy "org members can view onboarding_data" on onboarding_data
  for select using (org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can upsert onboarding_data" on onboarding_data;
create policy "org members can upsert onboarding_data" on onboarding_data
  for insert with check (org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can update onboarding_data" on onboarding_data;
create policy "org members can update onboarding_data" on onboarding_data
  for update using (org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "Users can view org notifications" on notifications;
create policy "Users can view org notifications" on notifications
  for select using (org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can view campaign_contacts" on campaign_contacts;
create policy "org members can view campaign_contacts" on campaign_contacts
  for select using (campaign_id in (select id from campaigns where org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id')));

drop policy if exists "org members can insert campaign_contacts" on campaign_contacts;
create policy "org members can insert campaign_contacts" on campaign_contacts
  for insert with check (campaign_id in (select id from campaigns where org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id')));

drop policy if exists "org members can update campaign_contacts" on campaign_contacts;
create policy "org members can update campaign_contacts" on campaign_contacts
  for update using (campaign_id in (select id from campaigns where org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id')));

drop policy if exists "org members can view call_recordings" on call_recordings;
create policy "org members can view call_recordings" on call_recordings
  for select using (org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can view voice_call_contexts" on voice_call_contexts;
create policy "org members can view voice_call_contexts" on voice_call_contexts
  for select using (org_id is null or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can insert voice_call_contexts" on voice_call_contexts;
create policy "org members can insert voice_call_contexts" on voice_call_contexts
  for insert with check (org_id is null or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "anyone can read global or own-org voice configs" on agent_voice_configs;
create policy "anyone can read global or own-org voice configs" on agent_voice_configs
  for select using (org_id is null or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can insert their own voice configs" on agent_voice_configs;
create policy "org members can insert their own voice configs" on agent_voice_configs
  for insert with check (org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can update their own voice configs" on agent_voice_configs;
create policy "org members can update their own voice configs" on agent_voice_configs
  for update using (org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

