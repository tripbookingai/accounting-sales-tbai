-- Create expenses table
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  category_id uuid references public.expense_categories(id),
  amount decimal(12,2) not null check (amount > 0),
  currency text not null default 'BDT',
  paid_through text not null check (paid_through in ('Company', 'Employee', 'Bank', 'Credit Card', 'Cash', 'Mobile Wallet')),
  tax_amount decimal(12,2) default 0,
  tax_percentage decimal(5,2) default 0,
  vendor text,
  reference_number text,
  notes text,
  customer_name text,
  attachment_urls text[],
  -- attachment_url text, -- deprecated
  approval_status text not null default 'Pending' check (approval_status in ('Pending', 'Approved', 'Paid')),
  tags text[], -- Array of tags
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.expenses enable row level security;

-- Create policies
create policy "expenses_select_own"
  on public.expenses for select
  using (auth.uid() = user_id);

create policy "expenses_insert_own"
  on public.expenses for insert
  with check (auth.uid() = user_id);

create policy "expenses_update_own"
  on public.expenses for update
  using (auth.uid() = user_id);

create policy "expenses_delete_own"
  on public.expenses for delete
  using (auth.uid() = user_id);

-- Create indexes for better performance
create index if not exists expenses_user_id_idx on public.expenses(user_id);
create index if not exists expenses_date_idx on public.expenses(date);
create index if not exists expenses_category_id_idx on public.expenses(category_id);
create index if not exists expenses_approval_status_idx on public.expenses(approval_status);
