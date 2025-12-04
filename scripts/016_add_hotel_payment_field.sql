-- Migration: Add hotel_paid boolean column to sales table

-- 1) Add the column with default false for existing records
ALTER TABLE public.sales
ADD COLUMN IF NOT EXISTS hotel_paid boolean DEFAULT FALSE;

-- 2) If you rely on a view using s.*, the view will automatically include the new column.
-- If your environment requires explicit view updates, recreate the view after running this migration.

-- 3) Optional: backfill logic if you know which records have been paid to hotel already.
-- UPDATE public.sales SET hotel_paid = TRUE WHERE ...;
