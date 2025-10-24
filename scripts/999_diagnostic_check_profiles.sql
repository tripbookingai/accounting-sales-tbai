-- Diagnostic query to check if profiles exist for users who created sales

-- 1. Check all profiles
SELECT 'All Profiles' as check_type, id, email, full_name FROM public.profiles;

-- 2. Check all sales with user_id
SELECT 'Sales with user_id' as check_type, id, user_id, customer_name, transaction_date FROM public.sales LIMIT 5;

-- 3. Check if profiles exist for sales creators
SELECT 
  'Sales vs Profiles' as check_type,
  s.id as sale_id, 
  s.user_id, 
  s.customer_name,
  p.email as profile_email,
  p.full_name as profile_full_name,
  CASE WHEN p.id IS NULL THEN 'MISSING PROFILE' ELSE 'HAS PROFILE' END as status
FROM public.sales s
LEFT JOIN public.profiles p ON s.user_id = p.id
LIMIT 10;

-- 4. Test the view directly
SELECT 'View Test' as check_type, id, customer_name, profile_email, profile_full_name 
FROM public.sales_with_profiles 
LIMIT 5;
