-- Create vendors table for tracking expense vendors
create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  contact_person text,
  phone text,
  email text,
  address text,
  vendor_type text, -- For categorizing vendors
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for vendors
alter table public.vendors enable row level security;

create policy "vendors_select_own" on public.vendors for select using (auth.uid() = user_id);
create policy "vendors_insert_own" on public.vendors for insert with check (auth.uid() = user_id);
create policy "vendors_update_own" on public.vendors for update using (auth.uid() = user_id);
create policy "vendors_delete_own" on public.vendors for delete using (auth.uid() = user_id);

-- Create index
create index if not exists vendors_user_id_idx on public.vendors(user_id);

-- Removed default vendor inserts to avoid foreign key constraint errors
-- Users can add their own vendors through the UI
