-- ====================================================================
-- URMART / SHOPSPHERE — SUPABASE DATABASE SCHEMA & RLS POLICIES
-- ====================================================================
-- Run this script in your Supabase Project:
-- Supabase Dashboard -> SQL Editor -> New Query -> Paste & Click Run.
-- ====================================================================

-- 1. Enable required extensions
create extension if not exists "uuid-ossp";

-- 2. Create PROFILES table (Linked directly to auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  name text,
  phone text default '',
  avatar text default '',
  addresses jsonb default '[]'::jsonb,
  wishlist jsonb default '[]'::jsonb,
  cart jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create ORDERS table
create table if not exists public.orders (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric not null default 0,
  discount numeric not null default 0,
  shipping numeric not null default 0,
  total numeric not null default 0,
  coupon_code text,
  shipping_address jsonb not null default '{}'::jsonb,
  payment_method text not null default 'UPI',
  status text not null default 'Processing',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for speedy queries on user orders
create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

-- 4. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.orders enable row level security;

-- 5. RLS Policies for PROFILES
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 6. RLS Policies for ORDERS
drop policy if exists "Users can view own orders" on public.orders;
create policy "Users can view own orders"
  on public.orders for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own orders" on public.orders;
create policy "Users can insert own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

-- 7. Trigger to automatically create a profile row upon signup in auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'phone', '')
  )
  on conflict (id) do update
  set
    email = excluded.email,
    name = coalesce(excluded.name, profiles.name),
    updated_at = now();
  return new;
end;
$$;

-- Drop trigger if it already exists, then create it
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 8. Least-Privilege SQL Grants
grant usage on schema public to anon, authenticated;

-- Revoke all blanket permissions from anon and authenticated roles
revoke all on table public.profiles from anon;
revoke all on table public.orders from anon;
revoke all on table public.profiles from authenticated;
revoke all on table public.orders from authenticated;

-- Grant only required table privileges to authenticated users
grant select, insert, update on table public.profiles to authenticated;
grant select, insert on table public.orders to authenticated;

-- Keep administrative full control for service_role backend operations only
grant all on table public.profiles to service_role;
grant all on table public.orders to service_role;

-- ====================================================================
-- SUCCESS: Profiles & Orders tables with RLS and trigger are configured!
-- ====================================================================

