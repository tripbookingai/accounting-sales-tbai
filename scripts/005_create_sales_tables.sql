-- Create customers table
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for customers
alter table public.customers enable row level security;

create policy "customers_select_own" on public.customers for select using (auth.uid() = user_id);
create policy "customers_insert_own" on public.customers for insert with check (auth.uid() = user_id);
create policy "customers_update_own" on public.customers for update using (auth.uid() = user_id);
create policy "customers_delete_own" on public.customers for delete using (auth.uid() = user_id);

-- Create sales table
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  transaction_date date not null default current_date,
  product_type text not null check (product_type in ('Air Ticket', 'Hotel', 'Tour Package', 'Visa', 'Ship Ticket')),
  customer_id uuid references public.customers(id),
  customer_name text not null,
  customer_phone text,
  customer_email text,
  salesperson text,
  sale_amount decimal(12,2) not null check (sale_amount > 0),
  cogs decimal(12,2) not null default 0 check (cogs >= 0), -- Cost of Goods Sold
  profit_loss decimal(12,2) generated always as (sale_amount - cogs) stored,
  profit_margin decimal(5,2) generated always as (
    case 
      when sale_amount > 0 then ((sale_amount - cogs) / sale_amount * 100)
      else 0
    end
  ) stored,
  payment_method text,
  payment_received decimal(12,2) not null default 0 check (payment_received >= 0),
  outstanding_balance decimal(12,2) generated always as (sale_amount - payment_received) stored,
  payment_status text not null default 'Pending' check (payment_status in ('Paid', 'Partial', 'Pending')),
  notes text,
  attachment_urls text[],
  tags text[], -- Array of reporting tags
  
  -- Product-specific fields
  vendor text,
  booking_id text,

  -- Ship Ticket specific
  ship_selections jsonb, -- array of { ship_type, seat_category, unit_price, quantity }
  commission_percent numeric(5,2) default 10.00,
  
  -- Air Ticket specific
  flight_route text, -- From → To
  number_of_passengers integer,
  travel_date date,
  
  -- Hotel specific
  location text,
  checkin_date date,
  checkout_date date,
  nights integer generated always as (
    case 
      when checkin_date is not null and checkout_date is not null 
      then checkout_date - checkin_date
      else null
    end
  ) stored,
  booking_confirmation text,
  
  -- Tour Package specific
  package_name text,
  destinations text,
  duration_days integer,
  start_date date,
  end_date date,
  number_of_travelers integer,
  package_reference text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for sales
alter table public.sales enable row level security;

create policy "sales_select_own" on public.sales for select using (auth.uid() = user_id);
create policy "sales_insert_own" on public.sales for insert with check (auth.uid() = user_id);
create policy "sales_update_own" on public.sales for update using (auth.uid() = user_id);
create policy "sales_delete_own" on public.sales for delete using (auth.uid() = user_id);

-- Create indexes for better performance
create index if not exists sales_user_id_idx on public.sales(user_id);
create index if not exists sales_transaction_date_idx on public.sales(transaction_date);
create index if not exists sales_product_type_idx on public.sales(product_type);
create index if not exists sales_customer_id_idx on public.sales(customer_id);
create index if not exists sales_payment_status_idx on public.sales(payment_status);
create index if not exists customers_user_id_idx on public.customers(user_id);
