-- Kingdom Reborn: device sync storage.
-- Each kingdom is stored under the SHA-256 hash of its private sync code.
-- The table is closed to the public API; the app can only call the two functions below.
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.kr_sync (
  id         text primary key,            -- sha256(sync code), hex
  data       jsonb not null,              -- {v, t: last edit time (ms), s: app state}
  rev        bigint not null default 1,   -- bumps on every write
  device     text,
  updated_at timestamptz not null default now()
);
alter table public.kr_sync enable row level security;
revoke all on table public.kr_sync from anon, authenticated;

create or replace function public.kr_pull(p_code text)
returns table (rev bigint, updated_at timestamptz, data jsonb)
language sql stable security definer set search_path = '' as $$
  select s.rev, s.updated_at, s.data
  from public.kr_sync s
  where length(p_code) >= 20
    and s.id = encode(extensions.digest(p_code, 'sha256'), 'hex');
$$;

create or replace function public.kr_push(p_code text, p_base bigint, p_data jsonb, p_device text default null)
returns table (ok boolean, rev bigint, updated_at timestamptz)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  h   text;
  cur bigint;
  cur_t timestamptz;
begin
  if p_code is null or length(p_code) < 20 then raise exception 'invalid sync code'; end if;
  if octet_length(p_data::text) > 5000000 then raise exception 'kingdom too large to sync'; end if;
  h := encode(extensions.digest(p_code, 'sha256'), 'hex');
  select s.rev, s.updated_at into cur, cur_t from public.kr_sync s where s.id = h for update;
  if cur is null then
    insert into public.kr_sync (id, data, rev, device) values (h, p_data, 1, left(p_device, 20));
    return query select true, 1::bigint, now();
  elsif cur <> p_base then
    return query select false, cur, cur_t;          -- someone else wrote first: pull, then retry
  else
    update public.kr_sync s set data = p_data, rev = cur + 1, device = left(p_device, 20), updated_at = now() where s.id = h;
    return query select true, cur + 1, now();
  end if;
end $$;

revoke all on function public.kr_pull(text) from public;
revoke all on function public.kr_push(text, bigint, jsonb, text) from public;
grant execute on function public.kr_pull(text) to anon;
grant execute on function public.kr_push(text, bigint, jsonb, text) to anon;
