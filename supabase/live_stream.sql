-- Live stream override for mediaspillnetwork.com
--
-- Holds a single row. When `url` is non-null the site swaps itself for a
-- full-screen player for every visitor; when it is null the normal site shows.
-- Run this in the Supabase SQL editor.

create table if not exists public.live_stream (
  id         boolean primary key default true,
  url        text,
  updated_at timestamptz not null default now(),
  -- Forces a single row: `id` can only ever be true, and it is the primary key.
  constraint live_stream_singleton check (id is true)
);

-- The one row the site reads and updates.
insert into public.live_stream (id, url)
values (true, null)
on conflict (id) do nothing;

alter table public.live_stream enable row level security;

-- Which stream is live is public information, so anyone may read it.
drop policy if exists live_stream_public_read on public.live_stream;
create policy live_stream_public_read
  on public.live_stream
  for select
  to anon, authenticated
  using (true);

-- Deliberately no insert/update/delete policy. The service role bypasses RLS,
-- so the Netlify function holding SUPABASE_SERVICE_ROLE_KEY is the only writer.
-- Never expose that key to the browser.

-- Keep updated_at accurate so you can tell when a stream was last changed.
create or replace function public.touch_live_stream()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists live_stream_touch on public.live_stream;
create trigger live_stream_touch
  before update on public.live_stream
  for each row
  execute function public.touch_live_stream();
