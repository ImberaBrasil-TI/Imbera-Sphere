create table if not exists public.ticket_closure_logs (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null,
  descricao text,
  resolucao text,
  closed_by text,
  status text not null default 'Sucesso',
  source text not null default 'imbera-sphere',
  closed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists ticket_closure_logs_closed_at_idx
  on public.ticket_closure_logs (closed_at desc);

alter table public.ticket_closure_logs enable row level security;

create policy "Authenticated users can read ticket closure logs"
  on public.ticket_closure_logs
  for select
  to authenticated
  using (true);

create policy "Service role can manage ticket closure logs"
  on public.ticket_closure_logs
  for all
  to service_role
  using (true)
  with check (true);
