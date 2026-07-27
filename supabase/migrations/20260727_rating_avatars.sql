-- Avatar URL for public testimonials
alter table public.tool_ratings
  add column if not exists avatar_url text;
