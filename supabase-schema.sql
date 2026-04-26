-- Run this in the Supabase SQL editor after creating your project.
-- Products stay in Google Sheets; Supabase stores user-owned saved state only.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz default now()
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_group_key text not null,
  variant_code text not null,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, variant_code)
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_group_key text not null,
  variant_code text,
  created_at timestamptz default now(),
  unique (user_id, product_group_key)
);

alter table public.profiles enable row level security;
alter table public.cart_items enable row level security;
alter table public.favorites enable row level security;

create policy "profiles are owned by users"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "users manage own cart"
  on public.cart_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users manage own favorites"
  on public.favorites for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
