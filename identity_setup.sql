-- Create a table to store known IP identities
create table public.known_identities (
  ip_address text primary key,
  label text not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.known_identities enable row level security;

-- Allow admins to view and edit identities
create policy "Allow admins to all"
on public.known_identities for all
to authenticated
using (true)
with check (true);
