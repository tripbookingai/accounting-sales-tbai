-- Update RLS policies for profiles table to allow all users to see all profiles
-- This is needed so users can see who created each sale

-- Drop existing select policy
drop policy if exists "profiles_select_own" on public.profiles;

-- Allow all authenticated users to view all profiles (read-only for others)
create policy "profiles_select_all" 
  on public.profiles 
  for select 
  using (auth.role() = 'authenticated');

-- Keep insert/update/delete restricted to own profile
-- (these should already exist, but we'll recreate them to be sure)
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles 
  for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles 
  for update
  using (auth.uid() = id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own"
  on public.profiles 
  for delete
  using (auth.uid() = id);
