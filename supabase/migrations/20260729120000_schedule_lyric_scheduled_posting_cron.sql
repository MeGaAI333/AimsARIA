-- Approved LYRIC posts (lyric_posts.status = 'pending_approval') only ever get published
-- if something invokes the scheduled-posting Edge Function, which checks for posts due in
-- the last 5 minutes and pushes them to Buffer. Nothing in this project was calling it, so
-- approved posts sat forever. This schedules it to run every 5 minutes via pg_cron + pg_net.
--
-- pg_net calls the Edge Function over HTTPS, so it needs this project's URL and a service
-- role key. Those are project-specific secrets and must never be committed to git — before
-- this job can run successfully, create them once via the SQL editor:
--   select vault.create_secret('https://<your-project-ref>.supabase.co', 'project_url');
--   select vault.create_secret('<your-service-role-key>', 'service_role_key');

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'lyric-scheduled-posting') then
    perform cron.unschedule('lyric-scheduled-posting');
  end if;
end $$;

select cron.schedule(
  'lyric-scheduled-posting',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url' limit 1) || '/functions/v1/scheduled-posting',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key' limit 1)
    ),
    body := jsonb_build_object('time', now())
  ) as request_id;
  $$
);
