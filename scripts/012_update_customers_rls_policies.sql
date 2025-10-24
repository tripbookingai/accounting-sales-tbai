-- Update RLS policies for customers table to allow all users to see all customers
-- This allows managers to see customers created by any user

-- Drop existing policies
drop policy if exists "customers_select_own" on public.customers;
drop policy if exists "customers_insert_own" on public.customers;
drop policy if exists "customers_update_own" on public.customers;
drop policy if exists "customers_delete_own" on public.customers;

-- Allow all authenticated users to view all customers
create policy "customers_select_all" 
  on public.customers 
  for select 
  using (auth.role() = 'authenticated');

-- Allow all authenticated users to insert customers (tied to their user_id)
create policy "customers_insert_authenticated" 
  on public.customers 
  for insert 
  with check (auth.uid() = user_id);

-- Allow all authenticated users to update any customer
create policy "customers_update_all" 
  on public.customers 
  for update 
  using (auth.role() = 'authenticated');

-- Allow all authenticated users to delete any customer
create policy "customers_delete_all" 
  on public.customers 
  for delete 
  using (auth.role() = 'authenticated');
