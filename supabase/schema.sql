-- Tool2Day schema (safe to re-run)
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

drop policy if exists "Allow anon insert jobs" on public.tool_jobs;
create policy "Allow anon insert jobs"
  on public.tool_jobs
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Allow anon read jobs" on public.tool_jobs;
create policy "Allow anon read jobs"
  on public.tool_jobs
  for select
  to anon, authenticated
  using (true);

-- Ratings (site + per-tool)
create table if not exists public.tool_ratings (
  id uuid primary key default gen_random_uuid(),
  target text not null,
  stars int not null check (stars between 1 and 5),
  visitor_key text not null,
  created_at timestamptz not null default now(),
  unique (target, visitor_key)
);

create index if not exists tool_ratings_target_idx on public.tool_ratings (target);

alter table public.tool_ratings enable row level security;

drop policy if exists "Allow anon read ratings" on public.tool_ratings;
create policy "Allow anon read ratings"
  on public.tool_ratings
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Allow anon insert ratings" on public.tool_ratings;
create policy "Allow anon insert ratings"
  on public.tool_ratings
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Allow anon update own ratings" on public.tool_ratings;
create policy "Allow anon update own ratings"
  on public.tool_ratings
  for update
  to anon, authenticated
  using (true)
  with check (true);
