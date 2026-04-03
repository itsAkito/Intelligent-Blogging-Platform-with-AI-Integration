-- Support tickets table for admin support panel
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id text references public.profiles(id) on delete set null,
  user_email text,
  subject text not null,
  message text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  admin_reply text,
  category text default 'general',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_support_tickets_status on public.support_tickets(status);
create index if not exists idx_support_tickets_user_id on public.support_tickets(user_id);
create index if not exists idx_support_tickets_created_at on public.support_tickets(created_at desc);

alter table public.support_tickets enable row level security;

-- Authenticated users can create tickets and view their own
create policy "Users can create support tickets"
  on public.support_tickets for insert
  to authenticated
  with check (true);

create policy "Users can view own tickets"
  on public.support_tickets for select
  to authenticated
  using (user_id = auth.uid()::text);

-- Service role (admin API) has full access via supabase service role key
