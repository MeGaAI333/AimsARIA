-- campaigns.created_by, onboarding_progress.user_id, and
-- onboarding_wizard_data.user_id all reference auth.users(id) directly — a
-- well-known Supabase trap. Validating that FK on every insert needs the
-- same kind of access to auth.users that the authenticated role doesn't
-- have, so it throws "permission denied for table users" regardless of
-- what the RLS policies on the app table itself say (confirmed live on
-- campaigns: this persisted even after 20260720020000 fixed every RLS
-- policy). Supabase's own guidance is to never FK directly against
-- auth.users from an app table — just keep the uuid with no constraint.
alter table campaigns drop constraint if exists campaigns_created_by_fkey;
alter table onboarding_progress drop constraint if exists onboarding_progress_user_id_fkey;
alter table onboarding_wizard_data drop constraint if exists onboarding_wizard_data_user_id_fkey;
