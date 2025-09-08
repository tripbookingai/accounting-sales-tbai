-- Updated subcategory inserts to remove user_id references
-- Insert subcategories for Administrative & Office
insert into public.expense_categories (name, parent_id)
select 'Office Rent', id
from public.expense_categories where name = 'Administrative & Office' and parent_id is null
union all
select 'Utilities (Electricity, Water, Gas, Internet)', id
from public.expense_categories where name = 'Administrative & Office' and parent_id is null
union all
select 'Office Stationery & Supplies', id
from public.expense_categories where name = 'Administrative & Office' and parent_id is null
union all
select 'Furniture & Equipment', id
from public.expense_categories where name = 'Administrative & Office' and parent_id is null
union all
select 'Mobile Bills', id
from public.expense_categories where name = 'Administrative & Office' and parent_id is null
union all
select 'Repairs & Maintenance', id
from public.expense_categories where name = 'Administrative & Office' and parent_id is null
union all
select 'Insurance (Office, Equipment, Liability)', id
from public.expense_categories where name = 'Administrative & Office' and parent_id is null
union all
select 'Licenses, Permits & Govt. Fees', id
from public.expense_categories where name = 'Administrative & Office' and parent_id is null;

-- Insert subcategories for IT & Infrastructure
insert into public.expense_categories (name, parent_id)
select 'IT Equipment (Computers, Printers, Servers)', id
from public.expense_categories where name = 'IT & Infrastructure' and parent_id is null
union all
select 'Software Subscriptions (SaaS, CRM, Email, Cloud)', id
from public.expense_categories where name = 'IT & Infrastructure' and parent_id is null
union all
select 'Internet & Hosting (Web, Cloud, Domains)', id
from public.expense_categories where name = 'IT & Infrastructure' and parent_id is null;

-- Insert subcategories for HR & Payroll
insert into public.expense_categories (name, parent_id)
select 'Staff Salaries', id
from public.expense_categories where name = 'HR & Payroll' and parent_id is null
union all
select 'Employee Benefits (PF, Insurance, Bonuses)', id
from public.expense_categories where name = 'HR & Payroll' and parent_id is null
union all
select 'Employee Reimbursements', id
from public.expense_categories where name = 'HR & Payroll' and parent_id is null
union all
select 'Training & Development', id
from public.expense_categories where name = 'HR & Payroll' and parent_id is null
union all
select 'Hiring Costs', id
from public.expense_categories where name = 'HR & Payroll' and parent_id is null;

-- Insert subcategories for Marketing & Advertising
insert into public.expense_categories (name, parent_id)
select 'Meta Ads (Facebook/Instagram)', id
from public.expense_categories where name = 'Marketing & Advertising' and parent_id is null
union all
select 'Google Ads (Search/Display/YouTube)', id
from public.expense_categories where name = 'Marketing & Advertising' and parent_id is null
union all
select 'SEO & Content Marketing', id
from public.expense_categories where name = 'Marketing & Advertising' and parent_id is null
union all
select 'Influencer Marketing', id
from public.expense_categories where name = 'Marketing & Advertising' and parent_id is null
union all
select 'Email Marketing Tools (Mailchimp, Klaviyo, etc.)', id
from public.expense_categories where name = 'Marketing & Advertising' and parent_id is null
union all
select 'Sponsorships', id
from public.expense_categories where name = 'Marketing & Advertising' and parent_id is null
union all
select 'Events', id
from public.expense_categories where name = 'Marketing & Advertising' and parent_id is null
union all
select 'Public Relations (PR)', id
from public.expense_categories where name = 'Marketing & Advertising' and parent_id is null;

-- Insert subcategories for Travel & Entertainment
insert into public.expense_categories (name, parent_id)
select 'Business Travel (Flights, Hotels, Transport)', id
from public.expense_categories where name = 'Travel & Entertainment' and parent_id is null
union all
select 'Client Visit Travel (Local/Intercity for client meetings)', id
from public.expense_categories where name = 'Travel & Entertainment' and parent_id is null
union all
select 'Client Entertainment (Meals, Coffee, Hospitality)', id
from public.expense_categories where name = 'Travel & Entertainment' and parent_id is null
union all
select 'Team Meals & Entertainment', id
from public.expense_categories where name = 'Travel & Entertainment' and parent_id is null
union all
select 'Conferences & Seminars', id
from public.expense_categories where name = 'Travel & Entertainment' and parent_id is null;

-- Insert subcategories for Financial & Banking
insert into public.expense_categories (name, parent_id)
select 'Bank Fees & Charges', id
from public.expense_categories where name = 'Financial & Banking' and parent_id is null
union all
select 'Payment Gateway Fees', id
from public.expense_categories where name = 'Financial & Banking' and parent_id is null;

-- Insert subcategories for Professional & Outsourcing
insert into public.expense_categories (name, parent_id)
select 'Consultant / Contractor Expenses', id
from public.expense_categories where name = 'Professional & Outsourcing' and parent_id is null
union all
select 'Legal & Compliance Fees', id
from public.expense_categories where name = 'Professional & Outsourcing' and parent_id is null
union all
select 'Accounting & Audit Fees', id
from public.expense_categories where name = 'Professional & Outsourcing' and parent_id is null
union all
select 'Outsourcing Services (Freelancers, Agencies)', id
from public.expense_categories where name = 'Professional & Outsourcing' and parent_id is null;
