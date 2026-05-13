-- Run this in the Supabase SQL editor after creating your project.
-- Products stay in Google Sheets; Supabase stores user-owned saved state only.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  whatsapp text,
  whatsapp_country_code text,
  whatsapp_number text,
  business_name text,
  buyer_type text default 'wholesale',
  buying_behavior text default 'instant',
  pincode text,
  interested_categories jsonb default '[]'::jsonb,
  price_group text default 'pending',
  approval_status text default 'pending',
  role text default 'customer',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
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

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.cart_items enable row level security;
alter table public.favorites enable row level security;

-- Admin helper function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT (role = 'admin')
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for profiles
create policy "profiles access policy"
  on public.profiles for all
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- Policies for cart_items
create policy "cart items access policy"
  on public.cart_items for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- Policies for favorites
create policy "favorites access policy"
  on public.favorites for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());
