-- ============================================================================
-- Migration 018 – Sale edit audit log table
--
-- Stores a full diff each time a sale is edited:
--   changes  jsonb  –  { "field_name": { "from": <old>, "to": <new> }, ... }
-- ============================================================================

create table if not exists public.sale_edit_logs (
  id           uuid primary key default gen_random_uuid(),
  sale_id      uuid not null references public.sales(id) on delete cascade,
  edited_by    uuid references auth.users(id) on delete set null,
  edited_by_name text,           -- snapshot of full_name at edit time
  changes      jsonb not null,   -- { "field": { "from": <old>, "to": <new> } }
  edited_at    timestamptz not null default now()
);

-- Index for fast per-sale lookups
create index if not exists idx_sale_edit_logs_sale_id
  on public.sale_edit_logs(sale_id);

create index if not exists idx_sale_edit_logs_edited_at
  on public.sale_edit_logs(edited_at desc);

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.sale_edit_logs enable row level security;

-- Authenticated users can read all logs (same visibility as sales)
create policy "Allow authenticated read on sale_edit_logs"
  on public.sale_edit_logs
  for select
  to authenticated
  using (true);

-- Only the inserting user's own rows (enforced via edited_by = auth.uid())
create policy "Allow authenticated insert on sale_edit_logs"
  on public.sale_edit_logs
  for insert
  to authenticated
  with check (edited_by = auth.uid());

-- No updates or deletes – logs are immutable
