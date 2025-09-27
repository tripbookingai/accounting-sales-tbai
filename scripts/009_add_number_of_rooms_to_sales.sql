-- Add number_of_rooms field to sales table for hotel bookings (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sales' AND column_name = 'number_of_rooms') THEN
        ALTER TABLE public.sales ADD COLUMN number_of_rooms integer;
    END IF;
END $$;

-- Convert nights from generated column to regular column to allow application-controlled calculation
-- Check if nights column is generated and drop the expression if it exists
DO $$
BEGIN
    -- Check if the column is generated and alter it to remove the expression
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'sales' 
               AND column_name = 'nights' 
               AND is_generated = 'ALWAYS') THEN
        ALTER TABLE public.sales ALTER COLUMN nights DROP EXPRESSION;
    END IF;
END $$;

-- Now nights can be set by the application (rooms × nights calculation)
COMMENT ON COLUMN public.sales.nights IS 'Total room nights (number_of_rooms × nights_stayed) - calculated by application';
COMMENT ON COLUMN public.sales.number_of_rooms IS 'Number of rooms booked (Hotel specific)';