alter table public.tool_ratings
  add column if not exists display_name text,
  add column if not exists comment text,
  add column if not exists avatar_url text;

create index if not exists tool_ratings_comment_idx
  on public.tool_ratings (created_at desc)
  where comment is not null and length(trim(comment)) > 0;
