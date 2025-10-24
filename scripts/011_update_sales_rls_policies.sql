-- Update RLS policies for sales table to allow all users to see all sales
-- but only allow creating their own sales and only admin can update/delete

-- Drop existing policies
drop policy if exists "sales_select_own" on public.sales;
drop policy if exists "sales_insert_own" on public.sales;
drop policy if exists "sales_update_own" on public.sales;
drop policy if exists "sales_delete_own" on public.sales;

-- Allow all authenticated users to view all sales
create policy "sales_select_all" 
  on public.sales 
  for select 
  using (auth.role() = 'authenticated');

-- Allow all authenticated users to insert sales (tied to their user_id)
create policy "sales_insert_authenticated" 
  on public.sales 
  for insert 
  with check (auth.uid() = user_id);

-- Allow all authenticated users to update sales
-- Note: We'll enforce admin-only updates at the application layer
create policy "sales_update_authenticated" 
  on public.sales 
  for update 
  using (auth.role() = 'authenticated');

-- Allow all authenticated users to delete sales
-- Note: We'll enforce admin-only deletes at the application layer
create policy "sales_delete_authenticated" 
  on public.sales 
  for delete 
  using (auth.role() = 'authenticated');
