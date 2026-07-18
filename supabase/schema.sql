-- Tool2Day: jobs for file conversion / video editing
create extension if not exists "pgcrypto";

create table if not exists public.tool_jobs (
  id uuid primary key default gen_random_uuid(),
  tool_slug text not null,
  status text not null default 'queued'
    check (status in ('queued', 'processing', 'done', 'failed')),
  input_path text,
  output_path text,
  error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tool_jobs_status_idx on public.tool_jobs (status);
create index if not exists tool_jobs_created_at_idx on public.tool_jobs (created_at desc);

alter table public.tool_jobs enable row level security;

-- Public read of own jobs can be tightened later with auth.uid()
create policy "Allow anon insert jobs"
  on public.tool_jobs
  for insert
  to anon, authenticated
  with check (true);

create policy "Allow anon read jobs"
  on public.tool_jobs
  for select
  to anon, authenticated
  using (true);
