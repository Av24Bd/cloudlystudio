-- 1. Create a table to store visitor analytics
create table public.visitors (
  id uuid default gen_random_uuid() primary key,
  ip_address text,
  city text,
  region text,
  country text,
  org text,
  path text,
  referrer text,
  user_agent text,
  timestamp  timestamptz default now()
);

-- 2. Enable Row Level Security (RLS)
alter table public.visitors enable row level security;

-- 3. Policy: Allow anyone to INSERT (log their visit)
create policy "Allow anonymous inserts"
on public.visitors for insert
to anon
with check (true);

-- 4. Policy: Allow only authenticated admins to SELECT (view stats)
create policy "Allow admins to view"
on public.visitors for select
to authenticated
using (true);
