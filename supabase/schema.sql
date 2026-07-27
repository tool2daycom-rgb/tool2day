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

alter table public.tool_ratings
  add column if not exists display_name text,
  add column if not exists comment text;

create index if not exists tool_ratings_target_idx on public.tool_ratings (target);
create index if not exists tool_ratings_comment_idx
  on public.tool_ratings (created_at desc)
  where comment is not null and length(trim(comment)) > 0;


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

-- PNG library (community uploads + metadata for search)
create table if not exists public.png_library_assets (
  id uuid primary key default gen_random_uuid(),
  caption text not null,
  keywords text[] not null default '{}',
  storage_path text not null unique,
  public_url text not null,
  width int not null check (width >= 128),
  height int not null check (height >= 128),
  file_size int not null check (file_size > 0),
  status text not null default 'approved'
    check (status in ('pending', 'approved', 'rejected')),
  visitor_key text,
  created_at timestamptz not null default now()
);

create index if not exists png_library_assets_status_idx
  on public.png_library_assets (status);
create index if not exists png_library_assets_created_at_idx
  on public.png_library_assets (created_at desc);
create index if not exists png_library_assets_keywords_idx
  on public.png_library_assets using gin (keywords);

alter table public.png_library_assets enable row level security;

drop policy if exists "Allow anon read approved png assets" on public.png_library_assets;
create policy "Allow anon read approved png assets"
  on public.png_library_assets
  for select
  to anon, authenticated
  using (status = 'approved');

-- Inserts go through service role API only (no public insert policy)

-- Storage bucket `png-library` is created by the API on first upload if missing.
-- Make the bucket public in Supabase Dashboard → Storage if auto-create fails.
