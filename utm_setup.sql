-- Create a table to store UTM generated links
create table public.utm_links (
  id uuid default gen_random_uuid() primary key,
  label text not null,
  original_url text not null,
  utm_campaign text not null,
  utm_source text not null,
  utm_medium text not null,
  full_url text not null,
  short_url text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.utm_links enable row level security;

-- Allow admins to manage their links
create policy "Admins can manage utm_links"
on public.utm_links for all
to authenticated
using (true)
with check (true);
