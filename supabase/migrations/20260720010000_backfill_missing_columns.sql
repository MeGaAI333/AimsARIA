-- Same issue as the organizations FK backfill: every table below already
-- existed with its own real column set, so CREATE TABLE IF NOT EXISTS in
-- 20260701000000_base_schema.sql skipped them entirely and none of the
-- columns the app code actually needs (discovered live: campaigns.channel)
-- ever got added. ADD COLUMN IF NOT EXISTS is safe to run against a table
-- that already has some of these — it only adds what's missing.

alter table contacts
  add column if not exists org_id text references organizations(id),
  add column if not exists name text,
  add column if not exists company text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists industry text,
  add column if not exists stage text default 'cold',
  add column if not exists value numeric default 0,
  add column if not exists score int default 50,
  add column if not exists source text,
  add column if not exists assigned_to text,
  add column if not exists tags text[] default '{}',
  add column if not exists last_contact timestamptz,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table tasks
  add column if not exists org_id text references organizations(id),
  add column if not exists title text,
  add column if not exists due text,
  add column if not exists priority text default 'medium',
  add column if not exists contact_name text,
  add column if not exists assignee text,
  add column if not exists done boolean default false,
  add column if not exists status text,
  add column if not exists created_at timestamptz default now();

alter table notes
  add column if not exists org_id text references organizations(id),
  add column if not exists contact_name text,
  add column if not exists content text,
  add column if not exists author text,
  add column if not exists role text,
  add column if not exists created_at timestamptz default now();

alter table events
  add column if not exists org_id text references organizations(id),
  add column if not exists title text,
  add column if not exists date date,
  add column if not exists time text,
  add column if not exists duration text default '30 min',
  add column if not exists type text default 'call',
  add column if not exists contact_name text,
  add column if not exists agent text,
  add column if not exists created_at timestamptz default now();

alter table conversations
  add column if not exists org_id text references organizations(id),
  add column if not exists contact_id uuid references contacts(id) on delete set null,
  add column if not exists contact_name text,
  add column if not exists contact_company text,
  add column if not exists contact_phone text,
  add column if not exists agent_id text,
  add column if not exists status text default 'active',
  add column if not exists channel text,
  add column if not exists messages jsonb default '[]',
  add column if not exists assigned_to_human text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table communication_logs
  add column if not exists org_id text references organizations(id),
  add column if not exists contact_id uuid references contacts(id) on delete set null,
  add column if not exists contact_name text,
  add column if not exists contact_phone text,
  add column if not exists contact_email text,
  add column if not exists agent_id text,
  add column if not exists channel text,
  add column if not exists message text,
  add column if not exists status text,
  add column if not exists external_id text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table campaigns
  add column if not exists org_id text references organizations(id),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists name text,
  add column if not exists description text,
  add column if not exists agent_id text,
  add column if not exists campaign_type text,
  add column if not exists channel text default 'call',
  add column if not exists target_audience text,
  add column if not exists goal text,
  add column if not exists start_date date,
  add column if not exists status text default 'draft',
  add column if not exists launched_at timestamptz,
  add column if not exists created_at timestamptz default now();

alter table org_settings
  add column if not exists buffer_api_token text,
  add column if not exists buffer_token text,
  add column if not exists buffer_connected_at timestamptz,
  add column if not exists notification_preferences jsonb default '{
    "lead_stage_changed": true,
    "post_published": true,
    "task_assigned": true,
    "communication_failed": true,
    "agent_escalation": true
  }'::jsonb,
  add column if not exists updated_at timestamptz default now();

alter table client_profiles
  add column if not exists business_name text,
  add column if not exists industry text,
  add column if not exists website text,
  add column if not exists service_area text,
  add column if not exists target_audience text,
  add column if not exists demographics text,
  add column if not exists pain_points text,
  add column if not exists platforms text[] default '{}',
  add column if not exists posting_frequency jsonb default '{}',
  add column if not exists content_pillars text,
  add column if not exists brand_tone text[] default '{}',
  add column if not exists competitors text,
  add column if not exists restrictions text,
  add column if not exists hashtags text,
  add column if not exists approval_contact text,
  add column if not exists buffer_setup boolean default false,
  add column if not exists notes text,
  add column if not exists updated_at timestamptz default now();

alter table onboarding_data
  add column if not exists business_name text, add column if not exists industry text,
  add column if not exists years_in_business text, add column if not exists website text,
  add column if not exists phone text, add column if not exists service_area text,
  add column if not exists staff_size text, add column if not exists revenue_range text,
  add column if not exists primary_pain text, add column if not exists monthly_lead_volume text,
  add column if not exists ad_spend text, add column if not exists current_response_time text,
  add column if not exists current_crm text, add column if not exists crm_other text,
  add column if not exists situation_notes text,
  add column if not exists services_selected text[] default '{}', add column if not exists plan_tier text,
  add column if not exists lead_sources text[] default '{}', add column if not exists has_cold_list boolean default false,
  add column if not exists cold_list_size text, add column if not exists lead_source_notes text,
  add column if not exists agent_name text, add column if not exists brand_tone text[] default '{}',
  add column if not exists emoji_use boolean default false,
  add column if not exists certifications text, add column if not exists phrases_to_avoid text,
  add column if not exists top_objections text,
  add column if not exists google_rating text, add column if not exists google_review_count text,
  add column if not exists social_platforms text[] default '{}',
  add column if not exists last_post_date date, add column if not exists has_email_list boolean default false,
  add column if not exists email_list_size text, add column if not exists has_job_photos boolean default false,
  add column if not exists crm_integration text, add column if not exists calendar_system text,
  add column if not exists booking_link text,
  add column if not exists approval_contact text, add column if not exists leads_notification_contact text,
  add column if not exists integration_notes text,
  add column if not exists target_start_date date, add column if not exists kickoff_scheduled boolean default false,
  add column if not exists kickoff_date date, add column if not exists notes text,
  add column if not exists status text default 'Not Started',
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table call_recordings
  add column if not exists agent_id text,
  add column if not exists campaign_id uuid references campaigns(id),
  add column if not exists duration_seconds int default 0,
  add column if not exists transcript text,
  add column if not exists recording_url text,
  add column if not exists status text default 'in_progress',
  add column if not exists completed_at timestamp,
  add column if not exists created_at timestamp default now();

alter table voice_call_contexts
  add column if not exists agent_id text,
  add column if not exists campaign_id uuid references campaigns(id),
  add column if not exists contact_id uuid references contacts(id),
  add column if not exists contact_name text,
  add column if not exists contact_phone text,
  add column if not exists opening_message text,
  add column if not exists direction text default 'outbound',
  add column if not exists created_at timestamp default now();

alter table agent_voice_configs
  add column if not exists agent_id text,
  add column if not exists settings jsonb,
  add column if not exists updated_at timestamp default now();
