-- Migration: Add Ship Ticket fields to existing sales table
-- Run this in your Supabase SQL editor or psql against the target database.
-- This script is idempotent: safe to run multiple times.

BEGIN;

-- 1) Add new columns if they don't exist
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS ship_selections jsonb;

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS commission_percent numeric(5,2) DEFAULT 10.00;

-- Ensure existing NULL commission_percent rows get default 10.00
UPDATE public.sales
SET commission_percent = 10.00
WHERE commission_percent IS NULL;

-- 2) Replace product_type check constraint to include 'Ship Ticket'
-- Find and drop any existing check constraint that mentions product_type, then add the new constraint.
DO $$
DECLARE
  cname text;
BEGIN
  -- Try to find an existing CHECK constraint that references product_type on public.sales
  SELECT conname INTO cname
  FROM pg_constraint
  WHERE conrelid = 'public.sales'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%product_type%';

  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS %I', cname);
  END IF;

  -- Create new check constraint (safe: name chosen and will error if already exists)
  -- We wrap in BEGIN/EXCEPTION to ignore if it already exists by another process.
  BEGIN
    EXECUTE 'ALTER TABLE public.sales ADD CONSTRAINT sales_product_type_check CHECK (product_type IN (''Air Ticket'', ''Hotel'', ''Tour Package'', ''Visa'', ''Ship Ticket''))';
  EXCEPTION WHEN duplicate_object THEN
    -- constraint already exists, do nothing
    NULL;
  END;
END$$;

-- 3) Optionally: verify view (sales_with_profiles) will surface new columns automatically because it selects s.*
-- If you have a materialized view or other dependent objects, refresh/recreate them as needed.

COMMIT;

-- Usage notes:
-- - Run this in Supabase SQL editor (Query editor) or via psql connected to your database.
-- - After running, your application can INSERT the `ship_selections` JSON and `commission_percent` value when creating sales.
-- - Example ship_selections JSON value:
--   [{"ship_type":"MV KARNAFULY EXPRESS","seat_category":"Lavender","unit_price":1800,"quantity":2}, {...}]
-- - If you need me to also add a migration to add indexes or adjust RLS policies, tell me and I will prepare it.
