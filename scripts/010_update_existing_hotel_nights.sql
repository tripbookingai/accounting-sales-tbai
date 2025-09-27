-- Update existing hotel sales to have correct nights calculation
-- This script will update existing hotel sales that don't have number_of_rooms set

-- Set number_of_rooms to 1 for existing hotel sales where it's null
UPDATE public.sales 
SET number_of_rooms = 1 
WHERE product_type = 'Hotel' 
  AND number_of_rooms IS NULL;

-- Update nights calculation for existing hotel sales
-- This will recalculate nights as (checkout_date - checkin_date) × number_of_rooms
UPDATE public.sales 
SET nights = (
  CASE 
    WHEN checkin_date IS NOT NULL AND checkout_date IS NOT NULL AND number_of_rooms IS NOT NULL
    THEN (checkout_date - checkin_date) * number_of_rooms
    ELSE nights
  END
)
WHERE product_type = 'Hotel' 
  AND checkin_date IS NOT NULL 
  AND checkout_date IS NOT NULL;

-- Add a comment to document the change
COMMENT ON TABLE public.sales IS 'Sales table with updated hotel nights calculation (rooms × nights)';