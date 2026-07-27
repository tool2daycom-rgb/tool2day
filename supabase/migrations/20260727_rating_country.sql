-- Country flag for public testimonials
alter table public.tool_ratings
  add column if not exists country_code text,
  add column if not exists country_flag text;
