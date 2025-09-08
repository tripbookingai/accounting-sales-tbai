-- Create expense categories table
create table if not exists public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  parent_id uuid references public.expense_categories(id),
  -- Removed user_id to make categories shared across all users
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.expense_categories enable row level security;

-- Updated policies to allow all authenticated users to read categories
create policy "expense_categories_select_all"
  on public.expense_categories for select
  using (auth.role() = 'authenticated');

create policy "expense_categories_insert_admin"
  on public.expense_categories for insert
  with check (auth.role() = 'authenticated');

create policy "expense_categories_update_admin"
  on public.expense_categories for update
  using (auth.role() = 'authenticated');

create policy "expense_categories_delete_admin"
  on public.expense_categories for delete
  using (auth.role() = 'authenticated');

-- Insert default expense categories without user_id
insert into public.expense_categories (name, parent_id) values
-- Main categories (parent_id is null)
('Administrative & Office', null),
('IT & Infrastructure', null),
('HR & Payroll', null),
('Marketing & Advertising', null),
('Travel & Entertainment', null),
('Financial & Banking', null),
('Professional & Outsourcing', null),
('Miscellaneous & Other', null)
on conflict do nothing;
