-- ============================================================================
-- Migration 017 – Add updated_by tracking to sales
--
-- Adds:
--   updated_by        uuid  – FK to auth.users (who last updated the record)
--   updated_by_name   text  – Denormalized full name snapshot for fast display
--
-- Also recreates the sales_with_profiles view to expose:
--   creator_full_name / creator_email
--   updater_full_name / updater_email
-- ============================================================================

-- 1. Add columns (nullable so existing rows keep working)
alter table public.sales
  add column if not exists updated_by uuid references auth.users(id) on delete set null,
  add column if not exists updated_by_name text;

-- 2. DROP the old view first so Postgres lets us redefine the column list
--    (CREATE OR REPLACE VIEW cannot rename or reorder existing columns)
drop view if exists public.sales_with_profiles;

-- 3. Recreate the view to join BOTH creator and updater profiles
create view public.sales_with_profiles as
select
  s.*,

  -- Creator info (user_id)
  creator.email       as profile_email,
  creator.full_name   as profile_full_name,

  -- Updater info (updated_by)
  updater.email       as updater_profile_email,
  updater.full_name   as updater_profile_full_name

from public.sales s
left join public.profiles creator on s.user_id    = creator.id
left join public.profiles updater on s.updated_by = updater.id;

-- 4. Keep security_invoker so RLS on the underlying tables is respected
alter view public.sales_with_profiles set (security_invoker = true);
