-- Stores Profit Leak Analysis form submissions. This is filled out by
-- prospects who are not logged in (they get a link via text/email from
-- Allegra), so inserts have to come from the anon role, not authenticated —
-- unlike every other table in this app. Reads stay org-scoped as usual.
create table if not exists profit_leak_analyses (
  id uuid default gen_random_uuid() primary key,
  org_id text references organizations(id),
  contact_id uuid references contacts(id) on delete set null,
  business_name text,
  contact_name text,
  email text,
  phone text,
  lead_sources text,           -- How do most new customers reach you?
  missed_calls text,           -- Do you know how many calls are missed during the week or after hours?
  form_response_time text,     -- When someone fills out a form, how quickly do they get a response?
  estimate_followup text,      -- What happens to people who request an estimate but don't buy right away?
  old_lead_followup text,      -- Do you follow up with old leads or past customers automatically?
  reminders_rebooking text,    -- Do you have appointment reminders, no-show rebooking, and review requests?
  crm_usage text,              -- Are you using a CRM, or is follow-up mostly manual?
  submitted_at timestamptz default now()
);

alter table profit_leak_analyses enable row level security;

drop policy if exists "anyone can submit a profit leak analysis" on profit_leak_analyses;
create policy "anyone can submit a profit leak analysis" on profit_leak_analyses
  for insert to anon, authenticated
  with check (true);

drop policy if exists "org members can view their profit leak analyses" on profit_leak_analyses;
create policy "org members can view their profit leak analyses" on profit_leak_analyses
  for select using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    or org_id = (auth.jwt() -> 'user_metadata' ->> 'org_id')
  );
