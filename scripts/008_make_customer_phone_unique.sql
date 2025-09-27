-- Make customer phone numbers unique per user
-- First, check if there are any duplicate phone numbers and handle them

-- Add unique constraint for phone numbers (only for non-null phone numbers within same user)
alter table public.customers 
add constraint customers_phone_unique_per_user 
unique (user_id, phone);

-- Create index for better performance on phone number lookups
create index if not exists customers_phone_idx on public.customers(phone) where phone is not null;

-- Update customers table to ensure phone is not null for new entries
-- (We'll handle this in the application logic to require phone numbers)