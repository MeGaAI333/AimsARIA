-- Admin accounts (cled@aimsmarketingsystems.com, meghan@aimsmarketingsystems.com)
-- have role: 'admin' in their metadata but no org_id at all — they're AIMS
-- staff who manage every client, not members of one org. Every policy so far
-- only checked org_id, so admins could never pass any of them (confirmed live:
-- 'new row violates row-level security policy' creating a campaign as admin).
-- This matches what the old pre-session admin_all_conversations /
-- admin_all_onboarding policies were clearly designed to do — rebuilding that
-- as a role = 'admin' bypass on every policy instead of just those two tables.

drop policy if exists "org members can view their own org" on organizations;
create policy "org members can view their own org" on organizations
  for select using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or id = (auth.jwt() -> 'user_metadata' ->> 'org_id') or parent_org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can view contacts" on contacts;
create policy "org members can view contacts" on contacts
  for select using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can insert contacts" on contacts;
create policy "org members can insert contacts" on contacts
  for insert with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can update contacts" on contacts;
create policy "org members can update contacts" on contacts
  for update using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can delete contacts" on contacts;
create policy "org members can delete contacts" on contacts
  for delete using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can view tasks" on tasks;
create policy "org members can view tasks" on tasks
  for select using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can insert tasks" on tasks;
create policy "org members can insert tasks" on tasks
  for insert with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can update tasks" on tasks;
create policy "org members can update tasks" on tasks
  for update using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can delete tasks" on tasks;
create policy "org members can delete tasks" on tasks
  for delete using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can view campaigns" on campaigns;
create policy "org members can view campaigns" on campaigns
  for select using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can insert campaigns" on campaigns;
create policy "org members can insert campaigns" on campaigns
  for insert with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can update campaigns" on campaigns;
create policy "org members can update campaigns" on campaigns
  for update using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can delete campaigns" on campaigns;
create policy "org members can delete campaigns" on campaigns
  for delete using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can view lyric_posts" on lyric_posts;
create policy "org members can view lyric_posts" on lyric_posts
  for select using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can insert lyric_posts" on lyric_posts;
create policy "org members can insert lyric_posts" on lyric_posts
  for insert with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can update lyric_posts" on lyric_posts;
create policy "org members can update lyric_posts" on lyric_posts
  for update using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can delete lyric_posts" on lyric_posts;
create policy "org members can delete lyric_posts" on lyric_posts
  for delete using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can view schedule_rules" on schedule_rules;
create policy "org members can view schedule_rules" on schedule_rules
  for select using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can insert schedule_rules" on schedule_rules;
create policy "org members can insert schedule_rules" on schedule_rules
  for insert with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can update schedule_rules" on schedule_rules;
create policy "org members can update schedule_rules" on schedule_rules
  for update using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can delete schedule_rules" on schedule_rules;
create policy "org members can delete schedule_rules" on schedule_rules
  for delete using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can view notes" on notes;
create policy "org members can view notes" on notes
  for select using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can insert notes" on notes;
create policy "org members can insert notes" on notes
  for insert with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can delete notes" on notes;
create policy "org members can delete notes" on notes
  for delete using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can view events" on events;
create policy "org members can view events" on events
  for select using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can insert events" on events;
create policy "org members can insert events" on events
  for insert with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can delete events" on events;
create policy "org members can delete events" on events
  for delete using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can view conversations" on conversations;
create policy "org members can view conversations" on conversations
  for select using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can insert conversations" on conversations;
create policy "org members can insert conversations" on conversations
  for insert with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can update conversations" on conversations;
create policy "org members can update conversations" on conversations
  for update using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can view communication_logs" on communication_logs;
create policy "org members can view communication_logs" on communication_logs
  for select using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can insert communication_logs" on communication_logs;
create policy "org members can insert communication_logs" on communication_logs
  for insert with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can update communication_logs" on communication_logs;
create policy "org members can update communication_logs" on communication_logs
  for update using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can view org_settings" on org_settings;
create policy "org members can view org_settings" on org_settings
  for select using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can upsert org_settings" on org_settings;
create policy "org members can upsert org_settings" on org_settings
  for insert with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can update org_settings" on org_settings;
create policy "org members can update org_settings" on org_settings
  for update using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can view client_profiles" on client_profiles;
create policy "org members can view client_profiles" on client_profiles
  for select using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can upsert client_profiles" on client_profiles;
create policy "org members can upsert client_profiles" on client_profiles
  for insert with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can update client_profiles" on client_profiles;
create policy "org members can update client_profiles" on client_profiles
  for update using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can view onboarding_data" on onboarding_data;
create policy "org members can view onboarding_data" on onboarding_data
  for select using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can upsert onboarding_data" on onboarding_data;
create policy "org members can upsert onboarding_data" on onboarding_data
  for insert with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can update onboarding_data" on onboarding_data;
create policy "org members can update onboarding_data" on onboarding_data
  for update using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "Users can view org notifications" on notifications;
create policy "Users can view org notifications" on notifications
  for select using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can view campaign_contacts" on campaign_contacts;
create policy "org members can view campaign_contacts" on campaign_contacts
  for select using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or campaign_id in (select id from campaigns where org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id')));

drop policy if exists "org members can insert campaign_contacts" on campaign_contacts;
create policy "org members can insert campaign_contacts" on campaign_contacts
  for insert with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or campaign_id in (select id from campaigns where org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id')));

drop policy if exists "org members can update campaign_contacts" on campaign_contacts;
create policy "org members can update campaign_contacts" on campaign_contacts
  for update using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or campaign_id in (select id from campaigns where org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id')));

drop policy if exists "org members can view call_recordings" on call_recordings;
create policy "org members can view call_recordings" on call_recordings
  for select using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can view voice_call_contexts" on voice_call_contexts;
create policy "org members can view voice_call_contexts" on voice_call_contexts
  for select using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or org_id is null or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can insert voice_call_contexts" on voice_call_contexts;
create policy "org members can insert voice_call_contexts" on voice_call_contexts
  for insert with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or org_id is null or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "anyone can read global or own-org voice configs" on agent_voice_configs;
create policy "anyone can read global or own-org voice configs" on agent_voice_configs
  for select using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or org_id is null or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can insert their own voice configs" on agent_voice_configs;
create policy "org members can insert their own voice configs" on agent_voice_configs
  for insert with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

drop policy if exists "org members can update their own voice configs" on agent_voice_configs;
create policy "org members can update their own voice configs" on agent_voice_configs
  for update using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id'));

