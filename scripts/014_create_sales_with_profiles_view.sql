-- Create a view that joins sales with profiles to surface creator info
-- This avoids relying on a foreign-key relationship name in Supabase's schema cache

create or replace view public.sales_with_profiles as
select
  s.*, 
  p.email as profile_email,
  p.full_name as profile_full_name
from public.sales s
left join public.profiles p on s.user_id = p.id;

-- Enable RLS on the view (views inherit RLS from underlying tables by default,
-- but we can add explicit policies if needed)
alter view public.sales_with_profiles set (security_invoker = true);

-- Note: Since the view is built on top of sales and profiles tables,
-- it will respect the RLS policies we already set on those tables.
-- Users will see sales based on the sales table RLS policy (all authenticated users see all sales)
-- and profiles based on profiles RLS policy (all authenticated users see all profiles).
