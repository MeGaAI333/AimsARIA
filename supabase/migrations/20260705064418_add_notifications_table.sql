-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL REFERENCES organizations(id),
  user_email TEXT NOT NULL,
  event_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  data JSONB,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  status TEXT DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for quick querying
CREATE INDEX IF NOT EXISTS idx_notifications_org_user ON notifications(org_id, user_email);
CREATE INDEX IF NOT EXISTS idx_notifications_event_type ON notifications(event_type);
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON notifications(sent_at DESC);

-- Add notification_preferences to org_settings if not exists
ALTER TABLE org_settings
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "lead_stage_changed": true,
  "post_published": true,
  "task_assigned": true,
  "communication_failed": true,
  "agent_escalation": true
}'::jsonb;

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for notifications
CREATE POLICY "Users can view org notifications"
ON notifications
FOR SELECT
USING (org_id = (SELECT raw_user_meta_data->>'org_id' FROM auth.users WHERE id = auth.uid()));
