-- Weave365 Supabase repair/setup script.
-- Safe to run more than once in the Supabase SQL editor.
-- Products and private prices can stay in Google Sheets; Supabase stores auth, buyer CRM, cart, favourites, and inquiry data.

create extension if not exists pgcrypto;

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

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists whatsapp text;
alter table public.profiles add column if not exists whatsapp_country_code text;
alter table public.profiles add column if not exists whatsapp_number text;
alter table public.profiles add column if not exists business_name text;
alter table public.profiles add column if not exists buyer_type text default 'wholesale';
alter table public.profiles add column if not exists buying_behavior text default 'instant';
alter table public.profiles add column if not exists pincode text;
alter table public.profiles add column if not exists interested_categories jsonb default '[]'::jsonb;
alter table public.profiles add column if not exists price_group text default 'pending';
alter table public.profiles add column if not exists approval_status text default 'pending';
alter table public.profiles add column if not exists role text default 'customer';
alter table public.profiles add column if not exists created_at timestamptz default now();
alter table public.profiles add column if not exists updated_at timestamptz default now();

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

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  inquiry_type text not null default 'product',
  product_group_key text,
  variant_code text,
  items jsonb default '[]'::jsonb,
  message text,
  buyer_name text,
  business_name text,
  phone text,
  email text,
  pincode text,
  status text default 'new',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.saved_customer_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_name text,
  customer_phone text,
  customer_city text,
  notes text,
  items jsonb default '[]'::jsonb,
  status text default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid references public.profiles(id) on delete cascade,
  assigned_to uuid references auth.users(id) on delete set null,
  title text not null,
  notes text,
  due_at timestamptz,
  status text default 'open',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.admin_notes (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid references public.profiles(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  note text not null,
  created_at timestamptz default now()
);

update public.profiles
set buyer_type = 'wholesale'
where buyer_type is null or buyer_type not in ('wholesale', 'reseller');

update public.profiles
set approval_status = 'pending'
where approval_status is null or approval_status not in ('pending', 'approved', 'rejected', 'suspended');

update public.profiles
set price_group = 'pending'
where price_group is null or price_group not in ('pending', 'wholesale', 'reseller');

update public.profiles
set role = 'customer'
where role is null or role not in ('customer', 'admin');

create or replace function public.is_varanasi_pincode(pin text)
returns boolean
language sql
immutable
as $$
  select coalesce(regexp_replace(pin, '\D', '', 'g'), '') like '221%';
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.apply_profile_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  new.buyer_type = case when new.buyer_type = 'reseller' then 'reseller' else 'wholesale' end;
  new.role = coalesce(new.role, 'customer');

  if tg_op = 'INSERT' and not public.is_admin() then
    new.role = 'customer';

    if public.is_varanasi_pincode(new.pincode) then
      new.approval_status = 'pending';
      new.price_group = 'pending';
    else
      new.approval_status = 'approved';
      new.price_group = new.buyer_type;
    end if;
  end if;

  if tg_op = 'UPDATE' and not public.is_admin() then
    new.role = old.role;
    new.approval_status = old.approval_status;
    new.price_group = old.price_group;
  end if;

  return new;
end;
$$;

drop trigger if exists apply_profile_defaults_trigger on public.profiles;
create trigger apply_profile_defaults_trigger
before insert or update on public.profiles
for each row
execute function public.apply_profile_defaults();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_cart_items_updated_at on public.cart_items;
create trigger touch_cart_items_updated_at
before update on public.cart_items
for each row
execute function public.touch_updated_at();

drop trigger if exists touch_inquiries_updated_at on public.inquiries;
create trigger touch_inquiries_updated_at
before update on public.inquiries
for each row
execute function public.touch_updated_at();

drop trigger if exists touch_saved_customer_orders_updated_at on public.saved_customer_orders;
create trigger touch_saved_customer_orders_updated_at
before update on public.saved_customer_orders
for each row
execute function public.touch_updated_at();

drop trigger if exists touch_follow_ups_updated_at on public.follow_ups;
create trigger touch_follow_ups_updated_at
before update on public.follow_ups
for each row
execute function public.touch_updated_at();

create index if not exists profiles_email_idx on public.profiles (lower(email));
create index if not exists profiles_approval_status_idx on public.profiles (approval_status);
create index if not exists profiles_price_group_idx on public.profiles (price_group);
create index if not exists cart_items_user_id_idx on public.cart_items (user_id);
create index if not exists favorites_user_id_idx on public.favorites (user_id);
create index if not exists inquiries_user_id_idx on public.inquiries (user_id);
create index if not exists inquiries_status_idx on public.inquiries (status);
create index if not exists saved_customer_orders_user_id_idx on public.saved_customer_orders (user_id);
create index if not exists follow_ups_buyer_id_idx on public.follow_ups (buyer_id);
create index if not exists admin_notes_buyer_id_idx on public.admin_notes (buyer_id);

alter table public.profiles enable row level security;
alter table public.cart_items enable row level security;
alter table public.favorites enable row level security;
alter table public.inquiries enable row level security;
alter table public.saved_customer_orders enable row level security;
alter table public.follow_ups enable row level security;
alter table public.admin_notes enable row level security;

drop policy if exists "profiles access policy" on public.profiles;
drop policy if exists "profiles select own or admin" on public.profiles;
drop policy if exists "profiles insert own or admin" on public.profiles;
drop policy if exists "profiles update own or admin" on public.profiles;
drop policy if exists "profiles delete admin" on public.profiles;

create policy "profiles select own or admin"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id or public.is_admin());

create policy "profiles insert own or admin"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id or public.is_admin());

create policy "profiles update own or admin"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id or public.is_admin())
  with check ((select auth.uid()) = id or public.is_admin());

create policy "profiles delete admin"
  on public.profiles for delete
  to authenticated
  using (public.is_admin());

drop policy if exists "cart items access policy" on public.cart_items;
drop policy if exists "cart items own or admin" on public.cart_items;
create policy "cart items own or admin"
  on public.cart_items for all
  to authenticated
  using ((select auth.uid()) = user_id or public.is_admin())
  with check ((select auth.uid()) = user_id or public.is_admin());

drop policy if exists "favorites access policy" on public.favorites;
drop policy if exists "favorites own or admin" on public.favorites;
create policy "favorites own or admin"
  on public.favorites for all
  to authenticated
  using ((select auth.uid()) = user_id or public.is_admin())
  with check ((select auth.uid()) = user_id or public.is_admin());

drop policy if exists "inquiries own select or admin" on public.inquiries;
drop policy if exists "inquiries own insert or admin" on public.inquiries;
drop policy if exists "inquiries admin update" on public.inquiries;
drop policy if exists "inquiries admin delete" on public.inquiries;

create policy "inquiries own select or admin"
  on public.inquiries for select
  to authenticated
  using ((select auth.uid()) = user_id or public.is_admin());

create policy "inquiries own insert or admin"
  on public.inquiries for insert
  to authenticated
  with check ((select auth.uid()) = user_id or public.is_admin());

create policy "inquiries admin update"
  on public.inquiries for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "inquiries admin delete"
  on public.inquiries for delete
  to authenticated
  using (public.is_admin());

drop policy if exists "saved customer orders own or admin" on public.saved_customer_orders;
create policy "saved customer orders own or admin"
  on public.saved_customer_orders for all
  to authenticated
  using ((select auth.uid()) = user_id or public.is_admin())
  with check ((select auth.uid()) = user_id or public.is_admin());

drop policy if exists "follow ups admin only" on public.follow_ups;
create policy "follow ups admin only"
  on public.follow_ups for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admin notes admin only" on public.admin_notes;
create policy "admin notes admin only"
  on public.admin_notes for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- After your admin account has registered once, run this one line separately with your real email:
-- update public.profiles set role = 'admin', approval_status = 'approved', price_group = 'wholesale' where lower(email) = lower('you@example.com');
