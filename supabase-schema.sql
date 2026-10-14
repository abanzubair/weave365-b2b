-- Weave365 Supabase repair/setup script.
-- Safe to run more than once in the Supabase SQL editor.
-- Products and private prices can stay in Google Sheets, Supabase stores auth, buyer CRM, cart, favourites, and inquiry data.

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
  buyer_subtype text,
  buying_behavior text default 'instant',
  pincode text,
  interested_categories jsonb default '[]'::jsonb,
  price_group text default 'pending',
  approval_status text default 'pending',
  role text default 'customer',
  city text,
  state text,
  website text,
  social_handle text,
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
alter table public.profiles add column if not exists buyer_subtype text;
alter table public.profiles add column if not exists buying_behavior text default 'instant';
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists state text;
alter table public.profiles add column if not exists pincode text;
alter table public.profiles add column if not exists website text;
alter table public.profiles add column if not exists social_handle text;
alter table public.profiles add column if not exists interested_categories jsonb default '[]'::jsonb;
alter table public.profiles add column if not exists price_group text default 'pending';
alter table public.profiles add column if not exists approval_status text default 'pending';
alter table public.profiles add column if not exists role text default 'customer';
alter table public.profiles add column if not exists vendor_code text;
alter table public.profiles add column if not exists partner_name text;
alter table public.profiles add column if not exists acquisition jsonb default '{}'::jsonb;
alter table public.profiles add column if not exists user_type text default 'customer';
alter table public.profiles add column if not exists qualification jsonb default '{}'::jsonb;
alter table public.profiles add column if not exists country text default 'India';
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

create table if not exists public.page_seo_settings (
  id uuid primary key default gen_random_uuid(),
  path text not null unique,
  meta_title text not null,
  meta_description text not null,
  og_title text,
  og_description text,
  image_url text,
  canonical_path text,
  robots_index boolean default true,
  robots_follow boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

update public.profiles
set buyer_type = case
  when buyer_subtype ilike '%vendor%' or buyer_subtype ilike '%weaver%' then 'vendor'
  else 'customer'
end
where buyer_type is null or buyer_type not in ('vendor', 'wholesale', 'reseller', 'customer', 'user');

update public.profiles
set approval_status = 'pending'
where approval_status is null or approval_status not in ('pending', 'approved', 'rejected', 'suspended', 'flagged');

update public.profiles
set price_group = 'approved'
where price_group is null or price_group not in ('vendor', 'approved', 'pending', 'wholesale', 'reseller', 'guest');

update public.profiles
set role = case
  when buyer_subtype ilike '%vendor%' or buyer_subtype ilike '%weaver%' or buyer_type = 'vendor' then 'vendor'
  else 'customer'
end
where role is null or role not in ('vendor', 'customer', 'admin');

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
  select (
    coalesce(auth.jwt()->>'email', '') in (
      'abanzubair@gmail.com',
      'weave365@gmail.com'
    )
    or
    coalesce(auth.jwt()->'app_metadata'->>'role', '') = 'admin'
    or
    coalesce(auth.jwt()->'user_metadata'->>'role', '') = 'admin'
    or
    exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and role = 'admin'
    )
  );
$$;

create or replace function public.apply_profile_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_vendor boolean;
  is_business boolean;
begin
  new.updated_at = now();

  -- Enforce Role and Status Immutability for non-admins on UPDATE
  if tg_op = 'UPDATE' and not public.is_admin() then
    if new.role is distinct from old.role then
      raise exception 'Unauthorized: Non-admin users cannot change account role';
    end if;
    if new.approval_status is distinct from old.approval_status then
      raise exception 'Unauthorized: Non-admin users cannot alter approval status';
    end if;
    if new.price_group is distinct from old.price_group then
      raise exception 'Unauthorized: Non-admin users cannot alter price group';
    end if;
    new.role := old.role;
    new.approval_status := old.approval_status;
    new.price_group := old.price_group;

    -- Ensure existing business/reseller accounts are never overwritten with supplier roles
    if old.user_type = 'business' or old.buyer_type in ('business', 'reseller', 'wholesale') or old.role in ('reseller', 'business') then
      new.user_type := 'business';
      new.buyer_type := 'business';
    end if;
  end if;

  if tg_op = 'INSERT' and not public.is_admin() then
    if new.role = 'admin' then
      new.role := 'customer';
    end if;
  end if;

  -- Exact vendor classification mirroring isVendorProfile from buyerAccess.js
  is_vendor := (
    (new.buyer_subtype is not null and (
      new.buyer_subtype ilike '%vendor%' or
      new.buyer_subtype ilike '%weaver%' or
      new.buyer_subtype ilike '%supplier%'
    ) and not (
      new.buyer_subtype ilike '%reseller%' or
      new.buyer_subtype ilike '%wholeseller%' or
      new.buyer_subtype ilike '%wholesale%'
    ))
    or new.user_type in ('supplier', 'vendor')
    or new.buyer_type = 'vendor'
    or new.role = 'vendor'
    or (new.vendor_code is not null and trim(new.vendor_code) <> '')
  ) and not (
    new.role in ('reseller', 'business')
    or new.user_type = 'business'
    or new.buyer_type in ('business', 'reseller', 'wholesale')
  );

  is_business := not is_vendor and (
    new.user_type = 'business' or
    new.buyer_type in ('business', 'reseller', 'wholesale') or
    new.role in ('reseller', 'business') or
    (new.buyer_subtype is not null and trim(new.buyer_subtype) not in ('Customer', 'customer', 'User', 'user', '')) or
    (new.business_name is not null and trim(new.business_name) <> '')
  );

  if is_vendor then
    new.buyer_type := 'vendor';
    new.user_type := 'supplier';
    if tg_op = 'INSERT' or public.is_admin() then
      new.role := case when new.role = 'admin' then 'admin' else 'vendor' end;
    end if;
  elsif is_business then
    new.buyer_type := 'business';
    new.user_type := 'business';
    if tg_op = 'INSERT' or public.is_admin() then
      new.role := case when new.role = 'admin' then 'admin' else 'reseller' end;
    end if;
    if new.buyer_subtype is null or trim(new.buyer_subtype) in ('', 'Customer', 'customer') then
      new.buyer_subtype := 'Reseller';
    end if;
  else
    new.buyer_type := 'customer';
    new.user_type := 'customer';
    if tg_op = 'INSERT' or public.is_admin() then
      new.role := case when new.role = 'admin' then 'admin' else 'customer' end;
    end if;
    if new.buyer_subtype is null or trim(new.buyer_subtype) = '' then
      new.buyer_subtype := 'Customer';
    end if;
  end if;

  -- Ensure role is always preserved for non-admins on UPDATE
  if tg_op = 'UPDATE' and not public.is_admin() then
    new.role := old.role;
  end if;

  if tg_op = 'INSERT' and not public.is_admin() then
    if public.is_varanasi_pincode(new.pincode) then
      new.approval_status = 'pending';
      new.price_group = 'pending';
    else
      new.approval_status = 'approved';
      new.price_group = case when new.buyer_type = 'user' then 'guest' else new.buyer_type end;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists apply_profile_defaults_trigger on public.profiles;
create trigger apply_profile_defaults_trigger
before insert or update on public.profiles
for each row
execute function public.apply_profile_defaults();

-- Automatically create or sync a profile row when a new user signs up or logs into Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  bp jsonb;
  v_whatsapp text;
begin
  bp := coalesce(new.raw_user_meta_data->'buyer_profile', '{}'::jsonb);
  v_whatsapp := coalesce(bp->>'whatsapp', new.raw_user_meta_data->>'whatsapp', '');

  -- Do not create a profile row if WhatsApp number is missing (e.g. initial Google OAuth login).
  -- The profile will be created once the user fills and submits their complete registration form.
  if trim(v_whatsapp) = '' then
    return new;
  end if;

  insert into public.profiles (
    id,
    email,
    full_name,
    whatsapp,
    whatsapp_number,
    whatsapp_country_code,
    business_name,
    buyer_type,
    buyer_subtype,
    city,
    state,
    pincode,
    country,
    website,
    social_handle,
    interested_categories,
    buying_behavior,
    role,
    user_type,
    qualification,
    approval_status,
    price_group,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.email,
    coalesce(bp->>'full_name', new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(bp->>'whatsapp', new.raw_user_meta_data->>'whatsapp', ''),
    coalesce(bp->>'whatsapp_number', bp->>'whatsapp', new.raw_user_meta_data->>'whatsapp_number', ''),
    coalesce(bp->>'whatsapp_country_code', '+91'),
    coalesce(bp->>'business_name', new.raw_user_meta_data->>'business_name', ''),
    coalesce(bp->>'buyer_type', new.raw_user_meta_data->>'buyer_type', case when coalesce(bp->>'user_type', new.raw_user_meta_data->>'user_type') = 'business' or (bp->>'business_name' is not null and trim(bp->>'business_name') <> '') then 'business' else 'customer' end),
    coalesce(bp->>'buyer_subtype', new.raw_user_meta_data->>'buyer_subtype', case when coalesce(bp->>'user_type', new.raw_user_meta_data->>'user_type') = 'business' or (bp->>'business_name' is not null and trim(bp->>'business_name') <> '') then 'Reseller' else 'Customer' end),
    coalesce(bp->>'city', ''),
    coalesce(bp->>'state', ''),
    coalesce(bp->>'pincode', ''),
    coalesce(bp->>'country', new.raw_user_meta_data->>'country', 'India'),
    coalesce(bp->>'website', new.raw_user_meta_data->>'website', ''),
    coalesce(bp->>'social_handle', bp->>'socialHandle', new.raw_user_meta_data->>'social_handle', new.raw_user_meta_data->>'socialHandle', ''),
    coalesce(bp->'interested_categories', '[]'::jsonb),
    coalesce(bp->>'buying_behavior', 'instant'),
    coalesce(new.raw_user_meta_data->>'role', bp->>'role', case when coalesce(bp->>'user_type', new.raw_user_meta_data->>'user_type') = 'business' or (bp->>'business_name' is not null and trim(bp->>'business_name') <> '') then 'reseller' else 'customer' end),
    coalesce(bp->>'user_type', new.raw_user_meta_data->>'user_type', case when (bp->>'business_name' is not null and trim(bp->>'business_name') <> '') then 'business' else 'customer' end),
    coalesce(bp->'qualification', new.raw_user_meta_data->'qualification', '{}'::jsonb),
    'approved',
    'approved',
    coalesce(new.created_at, now()),
    now()
  )
  on conflict (id) do update set
    email = coalesce(excluded.email, public.profiles.email),
    full_name = case when public.profiles.full_name is null or public.profiles.full_name = '' then excluded.full_name else public.profiles.full_name end,
    whatsapp = case when public.profiles.whatsapp is null or public.profiles.whatsapp = '' then excluded.whatsapp else public.profiles.whatsapp end,
    whatsapp_number = case when public.profiles.whatsapp_number is null or public.profiles.whatsapp_number = '' then excluded.whatsapp_number else public.profiles.whatsapp_number end,
    business_name = case when public.profiles.business_name is null or public.profiles.business_name = '' then excluded.business_name else public.profiles.business_name end,
    city = case when public.profiles.city is null or public.profiles.city = '' then excluded.city else public.profiles.city end,
    state = case when public.profiles.state is null or public.profiles.state = '' then excluded.state else public.profiles.state end,
    pincode = case when public.profiles.pincode is null or public.profiles.pincode = '' then excluded.pincode else public.profiles.pincode end,
    country = coalesce(excluded.country, public.profiles.country, 'India'),
    website = case when public.profiles.website is null or public.profiles.website = '' then excluded.website else public.profiles.website end,
    social_handle = case when public.profiles.social_handle is null or public.profiles.social_handle = '' then excluded.social_handle else public.profiles.social_handle end,
    interested_categories = case when public.profiles.interested_categories is null or public.profiles.interested_categories = '[]'::jsonb then excluded.interested_categories else public.profiles.interested_categories end,
    user_type = coalesce(excluded.user_type, public.profiles.user_type),
    qualification = case when public.profiles.qualification is null or public.profiles.qualification = '{}'::jsonb then excluded.qualification else public.profiles.qualification end,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

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

drop trigger if exists touch_page_seo_settings_updated_at on public.page_seo_settings;
create trigger touch_page_seo_settings_updated_at
before update on public.page_seo_settings
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
create index if not exists page_seo_settings_path_idx on public.page_seo_settings (path);

alter table public.profiles enable row level security;
alter table public.cart_items enable row level security;
alter table public.favorites enable row level security;
alter table public.inquiries enable row level security;
alter table public.saved_customer_orders enable row level security;
alter table public.follow_ups enable row level security;
alter table public.admin_notes enable row level security;
alter table public.page_seo_settings enable row level security;

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

drop policy if exists "page seo public read" on public.page_seo_settings;
create policy "page seo public read"
  on public.page_seo_settings for select
  to anon, authenticated
  using (true);

drop policy if exists "page seo admin only" on public.page_seo_settings;
create policy "page seo admin only"
  on public.page_seo_settings for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- After your admin account has registered once, run this one line separately with your real email:
-- update public.profiles set role = 'admin', approval_status = 'approved', price_group = 'wholesale' where lower(email) = lower('you@example.com');

-------------------------------------------------------------------------------
-- RESELLER WHITE-LABEL FEATURE
-------------------------------------------------------------------------------

-- 1. Reseller Storefronts (MIGRATED EXCLUSIVELY TO DEDICATED SECONDARY DATABASE)
-- NOTE: Tenant data (branding, settings, catalogs, products) is stored ONLY in the isolated
-- secondary database (table: public.boutique_tenants, public.boutique_products).
-- Run this statement in the main Supabase SQL editor to drop the legacy table:
-- DROP TABLE IF EXISTS public.reseller_storefronts CASCADE;

-- 2. Reseller Shares (Links)
create table if not exists public.reseller_shares (
  id uuid primary key default gen_random_uuid(),
  reseller_id uuid not null references public.profiles(id) on delete cascade,
  public_token text not null unique,
  title text,
  default_markup_type text default 'percentage' check (default_markup_type in ('percentage', 'fixed_amount', 'exact_price')),
  default_markup_value numeric default 0,
  expires_at timestamptz,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Reseller Share Items (Products in a Link)
create table if not exists public.reseller_share_items (
  id uuid primary key default gen_random_uuid(),
  share_id uuid not null references public.reseller_shares(id) on delete cascade,
  product_group_key text not null,
  variant_code text,
  base_price_snapshot numeric,
  markup_type text check (markup_type in ('percentage', 'fixed_amount', 'exact_price')),
  markup_value numeric,
  customer_price numeric not null,
  custom_title text,
  custom_description text,
  created_at timestamptz default now()
);

-- 4. Reseller Customer Inquiries (Leads)
create table if not exists public.reseller_customer_inquiries (
  id uuid primary key default gen_random_uuid(),
  reseller_id uuid not null references public.profiles(id) on delete cascade,
  share_id uuid references public.reseller_shares(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  items jsonb default '[]'::jsonb,
  customer_total numeric,
  reseller_base_total numeric,
  margin_total numeric,
  status text default 'new',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indices
create index if not exists reseller_shares_public_token_idx on public.reseller_shares (public_token);
create index if not exists reseller_share_items_share_id_idx on public.reseller_share_items (share_id);
create index if not exists reseller_customer_inquiries_reseller_id_idx on public.reseller_customer_inquiries (reseller_id);

-- RLS
alter table public.reseller_shares enable row level security;
alter table public.reseller_share_items enable row level security;
alter table public.reseller_customer_inquiries enable row level security;

-- Policies: Reseller Shares
create policy "Public can view active shares by token"
  on public.reseller_shares for select
  using (is_active = true);

create policy "Resellers can manage own shares"
  on public.reseller_shares for all
  to authenticated
  using (auth.uid() = reseller_id)
  with check (auth.uid() = reseller_id);

-- Policies: Reseller Share Items
create policy "Public can view items of active shares"
  on public.reseller_share_items for select
  using (exists (
    select 1 from public.reseller_shares
    where id = reseller_share_items.share_id
    and is_active = true
  ));

create policy "Resellers can manage own share items"
  on public.reseller_share_items for all
  to authenticated
  using (exists (
    select 1 from public.reseller_shares
    where id = reseller_share_items.share_id
    and reseller_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.reseller_shares
    where id = reseller_share_items.share_id
    and reseller_id = auth.uid()
  ));

-- Policies: Reseller Customer Inquiries
create policy "Public can insert inquiries"
  on public.reseller_customer_inquiries for insert
  with check (true);

create policy "Resellers can view own inquiries"
  on public.reseller_customer_inquiries for select
  to authenticated
  using (auth.uid() = reseller_id);

-- Updated At Triggers

drop trigger if exists touch_reseller_shares_updated_at on public.reseller_shares;
create trigger touch_reseller_shares_updated_at
before update on public.reseller_shares
for each row execute function public.touch_updated_at();

drop trigger if exists touch_reseller_customer_inquiries_updated_at on public.reseller_customer_inquiries;
create trigger touch_reseller_customer_inquiries_updated_at
before update on public.reseller_customer_inquiries
for each row execute function public.touch_updated_at();
alter table public.profiles add column if not exists reseller_dashboard_enabled boolean default false;

-------------------------------------------------------------------------------
-- B2B VENDOR PARTNER ONBOARDING PIPELINE TABLES
-------------------------------------------------------------------------------

-- 1. STEP 1: Product Review Applications
create table if not exists public.vendor_reviews (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  whatsapp_number text unique not null,
  city text not null,
  pincode varchar(6) not null,
  categories text not null, -- Comma-separated list of selected categories
  price_range text not null,
  image1 text, -- Base64 encoded or URL
  image2 text,
  image3 text,
  image4 text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS and policy for vendor_reviews
alter table public.vendor_reviews enable row level security;

drop policy if exists "Allow public reviews inserts" on public.vendor_reviews;
create policy "Allow public reviews inserts" 
  on public.vendor_reviews for insert 
  with check (true);

drop policy if exists "Allow select reviews by phone or admin" on public.vendor_reviews;
create policy "Allow select reviews by phone or admin" 
  on public.vendor_reviews for select 
  using (true); -- Public can query to lookup their phone unlock status

drop policy if exists "Allow all actions on reviews for admin" on public.vendor_reviews;
create policy "Allow all actions on reviews for admin" 
  on public.vendor_reviews for all 
  using (public.is_admin());

-- 2. STEP 2: Signed Payment Terms Agreements
create table if not exists public.vendor_agreements (
  id uuid default gen_random_uuid() primary key,
  whatsapp_number text unique not null,
  vendor_signed_name text not null,
  agreed_terms jsonb default '{}'::jsonb,
  signed_date text not null,
  document_url text, -- Public storage pointer to signed agreement HTML copy
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS and policy for vendor_agreements
alter table public.vendor_agreements enable row level security;

drop policy if exists "Allow insert agreements" on public.vendor_agreements;
create policy "Allow insert agreements" 
  on public.vendor_agreements for insert 
  with check (true);

drop policy if exists "Allow select agreements" on public.vendor_agreements;
create policy "Allow select agreements" 
  on public.vendor_agreements for select 
  using (true);

drop policy if exists "Allow admin all agreements" on public.vendor_agreements;
create policy "Allow admin all agreements" 
  on public.vendor_agreements for all 
  using (public.is_admin());

-- 3. STEP 3: Full Onboarding Profiles & Bank Details
create table if not exists public.vendor_profiles (
  id uuid default gen_random_uuid() primary key,
  whatsapp_number text unique not null,
  full_name text not null,
  alternate_contact text,
  email text unique not null,
  business_name text not null,
  business_type text not null,
  business_address text not null,
  city text not null,
  pincode varchar(6) not null,
  gst_number text,
  pan_number text,
  years_in_business text not null,
  fabric_specialisation text,
  monthly_capacity text not null,
  dispatch_timeline text not null,
  preferred_courier text not null,
  dispatch_address_same text default 'same',
  dispatch_address_different text,
  
  -- Bank Details
  bank_account_holder text not null,
  bank_name text not null,
  bank_account_number text not null,
  bank_ifsc text not null,
  upi_id text,
  
  -- Documents
  id_proof_url text, -- Aadhaar Base64 or URL pointer
  cancelled_cheque_url text, -- Cheque Base64 or URL pointer
  drive_folder_url text,
  
  status text default 'submitted' check (status in ('submitted', 'approved', 'flagged', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.vendor_profiles add column if not exists user_id uuid references auth.users(id) on delete set null;

-- Enable RLS and policy for vendor_profiles
alter table public.vendor_profiles enable row level security;

drop policy if exists "Allow public onboarding inserts" on public.vendor_profiles;
drop policy if exists "vendor_profiles insert onboarding" on public.vendor_profiles;
create policy "vendor_profiles insert onboarding" 
  on public.vendor_profiles for insert 
  with check (true);

drop policy if exists "Allow select onboarding profiles" on public.vendor_profiles;
drop policy if exists "vendor_profiles select owner or admin" on public.vendor_profiles;
create policy "vendor_profiles select owner or admin" 
  on public.vendor_profiles for select 
  to authenticated
  using (
    public.is_admin()
    or (user_id is not null and user_id = auth.uid())
    or email = (select email from auth.users where id = auth.uid())
  );

drop policy if exists "Allow admin all onboarding profiles" on public.vendor_profiles;
drop policy if exists "vendor_profiles update owner or admin" on public.vendor_profiles;
create policy "vendor_profiles update owner or admin" 
  on public.vendor_profiles for update 
  to authenticated
  using (
    public.is_admin()
    or (user_id is not null and user_id = auth.uid())
    or email = (select email from auth.users where id = auth.uid())
  )
  with check (
    public.is_admin()
    or (user_id is not null and user_id = auth.uid())
    or email = (select email from auth.users where id = auth.uid())
  );

drop policy if exists "vendor_profiles delete admin" on public.vendor_profiles;
create policy "vendor_profiles delete admin" 
  on public.vendor_profiles for delete 
  to authenticated
  using (public.is_admin());

-------------------------------------------------------------------------------
-- B2B CATALOG DOWNLOAD RATELIMITING / TRACKING TABLES
-------------------------------------------------------------------------------

create table if not exists public.download_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null,
  downloaded_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Migration: Add created_at and downloaded_at to existing download_logs if missing
alter table public.download_logs add column if not exists created_at timestamptz default now();
alter table public.download_logs add column if not exists downloaded_at timestamptz default now();

-- Enable RLS for data protection
alter table public.download_logs enable row level security;

-- Policies: Only access own download logs unless admin
drop policy if exists "Allow users to view own download logs" on public.download_logs;
create policy "Allow users to view own download logs"
  on public.download_logs for select
  to authenticated
  using ((select auth.uid()) = user_id or public.is_admin());

drop policy if exists "Allow users to insert own download logs" on public.download_logs;
create policy "Allow users to insert own download logs"
  on public.download_logs for insert
  to authenticated
  with check ((select auth.uid()) = user_id or public.is_admin());

-- Index for high-performance daily lookup queries
create index if not exists download_logs_user_product_date_idx 
  on public.download_logs (user_id, product_id, downloaded_at);

-- Migration: Add drive_folder_url to vendor_profiles if it doesn't exist
alter table public.vendor_profiles add column if not exists drive_folder_url text;

-------------------------------------------------------------------------------
-- B2B SERVICE & PRODUCT REVIEWS TABLE
-------------------------------------------------------------------------------

create table if not exists public.service_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  reviewer_name text not null,
  business_name text,
  rating integer not null check (rating >= 1 and rating <= 5),
  title text,
  comment text not null,
  status text default 'approved' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.service_reviews enable row level security;

-- Policies
drop policy if exists "Allow public to view approved reviews" on public.service_reviews;
create policy "Allow public to view approved reviews"
  on public.service_reviews for select
  using (status = 'approved');

drop policy if exists "Allow authenticated users to insert reviews" on public.service_reviews;
create policy "Allow authenticated users to insert reviews"
  on public.service_reviews for insert
  to authenticated
  with check (true);

drop policy if exists "Allow admin all actions on reviews" on public.service_reviews;
create policy "Allow admin all actions on reviews"
  on public.service_reviews for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Index for reviews listing
create index if not exists service_reviews_status_created_idx 
  on public.service_reviews (status, created_at desc);

-------------------------------------------------------------------------------
-- B2B PRODUCT REVIEWS TABLE
-------------------------------------------------------------------------------

create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id text not null,
  user_id uuid references auth.users(id) on delete set null,
  reviewer_name text not null,
  business_name text,
  rating integer not null check (rating >= 1 and rating <= 5),
  title text,
  comment text not null,
  images text[] default '{}',
  verified_buyer boolean default false,
  helpful_count integer default 0,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Backward-compatibility columns if table already exists
alter table public.product_reviews add column if not exists images text[] default '{}';
alter table public.product_reviews add column if not exists verified_buyer boolean default false;
alter table public.product_reviews add column if not exists helpful_count integer default 0;

-- Enable RLS
alter table public.product_reviews enable row level security;

-- Policies
drop policy if exists "Allow public to view approved product reviews" on public.product_reviews;
create policy "Allow public to view approved product reviews"
  on public.product_reviews for select
  using (status = 'approved');

drop policy if exists "Allow public to insert pending product reviews" on public.product_reviews;
create policy "Allow public to insert pending product reviews"
  on public.product_reviews for insert
  with check (true);

drop policy if exists "Allow admin all actions on product reviews" on public.product_reviews;
create policy "Allow admin all actions on product reviews"
  on public.product_reviews for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Index for product reviews
create index if not exists product_reviews_product_id_status_idx 
  on public.product_reviews (product_id, status);
create index if not exists product_reviews_created_idx 
  on public.product_reviews (created_at desc);

-------------------------------------------------------------------------------
-- B2B CUSTOMER ADDRESSES TABLE
-------------------------------------------------------------------------------

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  phone_number text not null,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text not null,
  pincode text not null,
  country text default 'India',
  is_default boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.addresses enable row level security;

-- Policies
drop policy if exists "addresses own or admin" on public.addresses;
drop policy if exists "addresses own user only" on public.addresses;
create policy "addresses own user only"
  on public.addresses for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Index
create index if not exists addresses_user_id_idx on public.addresses (user_id);

drop trigger if exists touch_addresses_updated_at on public.addresses;
create trigger touch_addresses_updated_at
before update on public.addresses
for each row execute function public.touch_updated_at();

-- Add order tracking and dropshipping columns to the inquiries table
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS tracking_carrier text;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS tracking_number text;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS tracking_message text;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS is_dropship boolean DEFAULT false;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS dropship_sender_name text;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS dropship_sender_phone text;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS dropship_sender_address text;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS dropship_sender_city text;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS dropship_sender_state text;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS dropship_sender_pincode text;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS dropship_recipient_name text;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS dropship_recipient_phone text;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS dropship_recipient_address text;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS dropship_recipient_city text;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS dropship_recipient_state text;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS dropship_recipient_pincode text;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS dropship_packing_preference text;

-- -------------------------------------------------------------------------------
-- B2B PAID ORDERS TABLE
-- -------------------------------------------------------------------------------

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text,
  user_id uuid references auth.users(id) on delete set null,
  items jsonb default '[]'::jsonb,
  message text,
  buyer_name text,
  business_name text,
  phone text,
  email text,
  pincode text,
  status text default 'new',
  payment_method text default 'cashfree',
  total_amount numeric(12, 2),
  cf_order_id text,
  cf_payment_id text,
  tracking_carrier text,
  tracking_number text,
  tracking_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ensure dropshipping & order_number columns exist on orders table if table already exists
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number text;
UPDATE public.orders SET order_number = 'ORD-' || substring(id::text from 1 for 8) WHERE order_number IS NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_dropship boolean DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS dropship_sender_name text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS dropship_sender_phone text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS dropship_sender_address text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS dropship_sender_city text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS dropship_sender_state text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS dropship_sender_pincode text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS dropship_recipient_name text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS dropship_recipient_phone text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS dropship_recipient_address text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS dropship_recipient_city text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS dropship_recipient_state text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS dropship_recipient_pincode text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS dropship_packing_preference text;

-- Ensure payment & gateway columns exist on orders table if table already exists
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'cashfree';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_amount numeric(12, 2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cf_order_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cf_payment_id text;

-- Enable RLS
alter table public.orders enable row level security;

-- Policies
drop policy if exists "orders own select or admin" on public.orders;
create policy "orders own select or admin"
  on public.orders for select
  to authenticated
  using ((select auth.uid()) = user_id or public.is_admin());

drop policy if exists "orders own insert or admin" on public.orders;
create policy "orders own insert or admin"
  on public.orders for insert
  to authenticated
  with check ((select auth.uid()) = user_id or public.is_admin());

drop policy if exists "orders admin update" on public.orders;
create policy "orders admin update"
  on public.orders for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "orders admin delete" on public.orders;
create policy "orders admin delete"
  on public.orders for delete
  to authenticated
  using (public.is_admin());

-- Indices
create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_is_dropship_idx on public.orders (is_dropship);
create index if not exists orders_cf_order_id_idx on public.orders (cf_order_id);

-- Trigger for updated_at
drop trigger if exists touch_orders_updated_at on public.orders;
create trigger touch_orders_updated_at
before update on public.orders
for each row execute function public.touch_updated_at();

-- ==============================================================================
-- 3NF NORMALIZED ORDER ENTITIES & DUAL-WRITE SYNCHRONIZATION
-- ==============================================================================

-- 1. Order Delivery Addresses (1:1 with orders)
create table if not exists public.order_delivery_addresses (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  recipient_name text not null,
  phone text,
  email text,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text not null,
  pincode text not null,
  country text not null default 'India',
  company_name text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists order_delivery_addresses_order_id_idx on public.order_delivery_addresses (order_id);
create index if not exists order_delivery_addresses_pincode_idx on public.order_delivery_addresses (pincode);

alter table public.order_delivery_addresses enable row level security;

drop policy if exists "order_delivery_addresses select own or admin" on public.order_delivery_addresses;
create policy "order_delivery_addresses select own or admin"
  on public.order_delivery_addresses for select
  to authenticated
  using (
    public.is_admin() or exists (
      select 1 from public.orders o
      where o.id = order_delivery_addresses.order_id
        and o.user_id = auth.uid()
    )
  );

drop policy if exists "order_delivery_addresses modify admin" on public.order_delivery_addresses;
create policy "order_delivery_addresses modify admin"
  on public.order_delivery_addresses for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists touch_order_delivery_addresses_updated_at on public.order_delivery_addresses;
create trigger touch_order_delivery_addresses_updated_at
  before update on public.order_delivery_addresses
  for each row execute function public.touch_updated_at();

-- 2. Order Dropship Senders (1:1 with dropship orders)
create table if not exists public.order_dropship_senders (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  sender_name text not null,
  sender_phone text,
  sender_address text,
  sender_city text,
  sender_state text,
  sender_pincode text,
  packing_preference text default 'Blind Packaging',
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists order_dropship_senders_order_id_idx on public.order_dropship_senders (order_id);

alter table public.order_dropship_senders enable row level security;

drop policy if exists "order_dropship_senders select own or admin" on public.order_dropship_senders;
create policy "order_dropship_senders select own or admin"
  on public.order_dropship_senders for select
  to authenticated
  using (
    public.is_admin() or exists (
      select 1 from public.orders o
      where o.id = order_dropship_senders.order_id
        and o.user_id = auth.uid()
    )
  );

drop policy if exists "order_dropship_senders modify admin" on public.order_dropship_senders;
create policy "order_dropship_senders modify admin"
  on public.order_dropship_senders for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists touch_order_dropship_senders_updated_at on public.order_dropship_senders;
create trigger touch_order_dropship_senders_updated_at
  before update on public.order_dropship_senders
  for each row execute function public.touch_updated_at();

-- 3. Order Items (1:N with orders)
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null,
  variant_code text,
  product_title text not null,
  color text,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null default 0,
  total_price numeric(12, 2) not null default 0,
  currency text not null default 'INR',
  thumbnail_url text,
  base_inr_price numeric(12, 2),
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists order_items_product_id_idx on public.order_items (product_id);

alter table public.order_items enable row level security;

drop policy if exists "order_items select own or admin" on public.order_items;
create policy "order_items select own or admin"
  on public.order_items for select
  to authenticated
  using (
    public.is_admin() or exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and o.user_id = auth.uid()
    )
  );

drop policy if exists "order_items modify admin" on public.order_items;
create policy "order_items modify admin"
  on public.order_items for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists touch_order_items_updated_at on public.order_items;
create trigger touch_order_items_updated_at
  before update on public.order_items
  for each row execute function public.touch_updated_at();

-- 4. Order Fulfillments (1:N with orders)
create table if not exists public.order_fulfillments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  tracking_carrier text not null,
  tracking_number text not null,
  tracking_message text,
  status text not null default 'dispatched',
  dispatched_at timestamptz default timezone('utc'::text, now()),
  delivered_at timestamptz,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists order_fulfillments_order_id_idx on public.order_fulfillments (order_id);
create index if not exists order_fulfillments_tracking_number_idx on public.order_fulfillments (tracking_number);

alter table public.order_fulfillments enable row level security;

drop policy if exists "order_fulfillments select own or admin" on public.order_fulfillments;
create policy "order_fulfillments select own or admin"
  on public.order_fulfillments for select
  to authenticated
  using (
    public.is_admin() or exists (
      select 1 from public.orders o
      where o.id = order_fulfillments.order_id
        and o.user_id = auth.uid()
    )
  );

drop policy if exists "order_fulfillments modify admin" on public.order_fulfillments;
create policy "order_fulfillments modify admin"
  on public.order_fulfillments for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists touch_order_fulfillments_updated_at on public.order_fulfillments;
create trigger touch_order_fulfillments_updated_at
  before update on public.order_fulfillments
  for each row execute function public.touch_updated_at();

-- 5. Dual-Write Trigger: Synchronize Legacy orders to Normalized Entities
create or replace function public.sync_orders_to_normalized()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if pg_trigger_depth() > 1 then
    return new;
  end if;

  -- 5.1 Delivery Address Sync
  if new.dropship_recipient_name is not null or new.buyer_name is not null then
    insert into public.order_delivery_addresses (
      order_id,
      recipient_name,
      phone,
      email,
      address_line1,
      address_line2,
      city,
      state,
      pincode,
      country,
      company_name
    ) values (
      new.id,
      coalesce(new.dropship_recipient_name, new.buyer_name, 'Recipient'),
      coalesce(new.dropship_recipient_phone, new.phone, ''),
      new.email,
      coalesce(new.dropship_recipient_address, 'Address'),
      null,
      coalesce(new.dropship_recipient_city, 'City'),
      coalesce(new.dropship_recipient_state, 'State'),
      coalesce(new.dropship_recipient_pincode, new.pincode, ''),
      'India',
      new.business_name
    )
    on conflict (order_id) do update set
      recipient_name = excluded.recipient_name,
      phone = excluded.phone,
      email = coalesce(excluded.email, public.order_delivery_addresses.email),
      address_line1 = excluded.address_line1,
      city = excluded.city,
      state = excluded.state,
      pincode = excluded.pincode,
      company_name = coalesce(excluded.company_name, public.order_delivery_addresses.company_name),
      updated_at = now();
  end if;

  -- 5.2 Dropship Sender Sync
  if new.is_dropship is true and (new.dropship_sender_name is not null or new.dropship_sender_phone is not null) then
    insert into public.order_dropship_senders (
      order_id,
      sender_name,
      sender_phone,
      sender_address,
      sender_city,
      sender_state,
      sender_pincode,
      packing_preference
    ) values (
      new.id,
      coalesce(new.dropship_sender_name, 'Sender'),
      coalesce(new.dropship_sender_phone, ''),
      new.dropship_sender_address,
      new.dropship_sender_city,
      new.dropship_sender_state,
      new.dropship_sender_pincode,
      coalesce(new.dropship_packing_preference, 'Blind Packaging')
    )
    on conflict (order_id) do update set
      sender_name = excluded.sender_name,
      sender_phone = excluded.sender_phone,
      sender_address = excluded.sender_address,
      sender_city = excluded.sender_city,
      sender_state = excluded.sender_state,
      sender_pincode = excluded.sender_pincode,
      packing_preference = excluded.packing_preference,
      updated_at = now();
  end if;

  -- 5.3 Order Items Sync
  if new.items is not null and jsonb_typeof(new.items) = 'array' and jsonb_array_length(new.items) > 0 then
    delete from public.order_items where order_id = new.id;
    insert into public.order_items (
      order_id,
      product_id,
      variant_code,
      product_title,
      color,
      quantity,
      unit_price,
      total_price,
      currency,
      thumbnail_url,
      base_inr_price
    )
    select
      new.id,
      coalesce(elem->>'product_id', elem->>'id', 'PROD'),
      elem->>'variant_code',
      coalesce(elem->>'product_title', elem->>'title', 'Product'),
      coalesce(elem->>'color', 'Standard'),
      greatest(1, coalesce((elem->>'quantity')::int, 1)),
      coalesce((elem->>'unit_price')::numeric, (elem->>'price')::numeric, 0),
      coalesce((elem->>'total_price')::numeric, (coalesce((elem->>'unit_price')::numeric, (elem->>'price')::numeric, 0) * greatest(1, coalesce((elem->>'quantity')::int, 1)))),
      coalesce(elem->>'currency', 'INR'),
      coalesce(elem->>'thumbnail_url', elem->>'image'),
      coalesce((elem->>'base_inr_price')::numeric, (elem->>'price')::numeric, (elem->>'unit_price')::numeric, 0)
    from jsonb_array_elements(new.items) as elem;
  end if;

  -- 5.4 Order Fulfillment Sync
  if new.tracking_carrier is not null or new.tracking_number is not null then
    insert into public.order_fulfillments (
      order_id,
      tracking_carrier,
      tracking_number,
      tracking_message,
      status,
      dispatched_at,
      delivered_at
    ) values (
      new.id,
      coalesce(new.tracking_carrier, 'Delhivery'),
      coalesce(new.tracking_number, ''),
      new.tracking_message,
      case when new.status = 'delivered' then 'delivered' else 'dispatched' end,
      now(),
      case when new.status = 'delivered' then now() else null end
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trigger_orders_dual_write on public.orders;
create trigger trigger_orders_dual_write
  after insert or update on public.orders
  for each row execute function public.sync_orders_to_normalized();

-- 5.5 Reverse Sync Triggers (from normalized tables back to orders)
create or replace function public.sync_delivery_address_to_orders()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if pg_trigger_depth() > 1 then
    return new;
  end if;

  update public.orders
  set
    buyer_name = coalesce(orders.buyer_name, new.recipient_name),
    phone = coalesce(orders.phone, new.phone),
    email = coalesce(new.email, orders.email),
    pincode = coalesce(orders.pincode, new.pincode),
    dropship_recipient_name = new.recipient_name,
    dropship_recipient_phone = new.phone,
    dropship_recipient_address = new.address_line1,
    dropship_recipient_city = new.city,
    dropship_recipient_state = new.state,
    dropship_recipient_pincode = new.pincode,
    updated_at = now()
  where id = new.order_id;

  return new;
end;
$$;

drop trigger if exists trigger_sync_delivery_address on public.order_delivery_addresses;
create trigger trigger_sync_delivery_address
  after insert or update on public.order_delivery_addresses
  for each row execute function public.sync_delivery_address_to_orders();

create or replace function public.sync_dropship_sender_to_orders()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if pg_trigger_depth() > 1 then
    return new;
  end if;

  update public.orders
  set
    is_dropship = true,
    dropship_sender_name = new.sender_name,
    dropship_sender_phone = new.sender_phone,
    dropship_sender_address = new.sender_address,
    dropship_sender_city = new.sender_city,
    dropship_sender_state = new.sender_state,
    dropship_sender_pincode = new.sender_pincode,
    dropship_packing_preference = new.packing_preference,
    updated_at = now()
  where id = new.order_id;

  return new;
end;
$$;

drop trigger if exists trigger_sync_dropship_sender on public.order_dropship_senders;
create trigger trigger_sync_dropship_sender
  after insert or update on public.order_dropship_senders
  for each row execute function public.sync_dropship_sender_to_orders();

create or replace function public.sync_fulfillment_to_orders()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if pg_trigger_depth() > 1 then
    return new;
  end if;

  update public.orders
  set
    tracking_carrier = new.tracking_carrier,
    tracking_number = new.tracking_number,
    tracking_message = new.tracking_message,
    status = case when new.status = 'delivered' then 'delivered' else coalesce(orders.status, 'dispatched') end,
    updated_at = now()
  where id = new.order_id;

  return new;
end;
$$;

drop trigger if exists trigger_sync_fulfillment on public.order_fulfillments;
create trigger trigger_sync_fulfillment
  after insert or update on public.order_fulfillments
  for each row execute function public.sync_fulfillment_to_orders();

-- ========================================================
-- B2B Developer API Keys & Reseller Integrations
-- ========================================================
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  key_prefix text not null,               -- e.g. "w365_live_9a7f..."
  key_hash text not null unique,          -- SHA-256 hash of secret key
  client_name text not null,              -- e.g. "My Reseller Store"
  client_website text,                    -- e.g. "https://www.example.com"
  domain_owner_name text,                 -- Domain owner / primary developer
  gst_number text,                        -- Optional GSTIN / tax registration number
  tier text not null default 'free',      -- 'free', 'growth', 'pro'
  catalog_mode text not null default 'all', -- 'all' (entire master catalog) or 'curated' (selected_skus only)
  selected_skus jsonb default '[]'::jsonb, -- array of chosen product SKUs e.g. ["100001", "100005"]
  monthly_quota integer not null default 2000,
  rate_limit_rps integer not null default 1,
  is_active boolean not null default true,
  orders_enabled boolean not null default false, -- Explicit admin-controlled toggle for /api/v1/orders
  allowed_endpoints jsonb default '["catalog", "stock", "product"]'::jsonb,
  webhook_url text,
  last_used_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.api_keys add column if not exists domain_owner_name text;
alter table public.api_keys add column if not exists gst_number text;
alter table public.api_keys add column if not exists catalog_mode text not null default 'all';
alter table public.api_keys add column if not exists selected_skus jsonb default '[]'::jsonb;
alter table public.api_keys add column if not exists orders_enabled boolean not null default false;
alter table public.api_keys add column if not exists encrypted_key text;

-- Data migration: Safely mask any legacy plaintext API keys stored in key_prefix so secrets cannot be retrieved
update public.api_keys
set key_prefix = substring(key_prefix from 1 for 14) || '...' || substring(key_prefix from length(key_prefix) - 3 for 4)
where length(key_prefix) > 20;

-- Data migration: Sanitize any legacy development localhost client_website values
update public.api_keys
set client_website = 'https://www.weave365.com/account'
where client_website like '%localhost%';

create index if not exists api_keys_user_id_idx on public.api_keys (user_id);
create index if not exists api_keys_key_hash_idx on public.api_keys (key_hash);
create index if not exists api_keys_is_active_idx on public.api_keys (is_active);
create index if not exists api_keys_orders_enabled_idx on public.api_keys (orders_enabled);

-- Daily Aggregated Usage Tracking Table (1 row per key/user per day = zero DB bloat)
create table if not exists public.api_usage_daily (
  id uuid primary key default gen_random_uuid(),
  api_key_id uuid references public.api_keys(id) on delete set null,
  user_id uuid references public.profiles(id) on delete cascade,
  usage_date date not null default current_date,
  total_requests integer not null default 0,
  successful_requests integer not null default 0,
  rate_limited_requests integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (api_key_id, usage_date)
);

create index if not exists api_usage_daily_key_date_idx on public.api_usage_daily (api_key_id, usage_date desc);
create index if not exists api_usage_daily_user_date_idx on public.api_usage_daily (user_id, usage_date desc);

-- Atomic counter function for instant zero-race updates
create or replace function public.record_api_request(
  p_key_id uuid,
  p_is_success boolean default true,
  p_is_rate_limited boolean default false
)
returns void language plpgsql security definer as $$
declare
  v_user_id uuid;
begin
  select user_id into v_user_id from public.api_keys where id = p_key_id;

  insert into public.api_usage_daily (api_key_id, user_id, usage_date, total_requests, successful_requests, rate_limited_requests, updated_at)
  values (
    p_key_id,
    v_user_id,
    current_date,
    1,
    case when p_is_success then 1 else 0 end,
    case when p_is_rate_limited then 1 else 0 end,
    now()
  )
  on conflict (api_key_id, usage_date)
  do update set
    user_id = coalesce(public.api_usage_daily.user_id, v_user_id),
    total_requests = public.api_usage_daily.total_requests + 1,
    successful_requests = public.api_usage_daily.successful_requests + (case when p_is_success then 1 else 0 end),
    rate_limited_requests = public.api_usage_daily.rate_limited_requests + (case when p_is_rate_limited then 1 else 0 end),
    updated_at = now();

  update public.api_keys
  set last_used_at = now()
  where id = p_key_id;
end;
$$;

alter table public.api_keys enable row level security;
alter table public.api_usage_daily enable row level security;

-- Drop legacy permissive policies
drop policy if exists "Admin manage all api_keys" on public.api_keys;
drop policy if exists "Public read api_keys" on public.api_keys;
drop policy if exists "api_keys select own or admin" on public.api_keys;
drop policy if exists "api_keys insert own or admin" on public.api_keys;
drop policy if exists "api_keys update own or admin" on public.api_keys;
drop policy if exists "api_keys delete own or admin" on public.api_keys;

-- Hardened RLS policies for api_keys: only authenticated key owner or admin
create policy "api_keys select own or admin"
  on public.api_keys for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "api_keys insert own or admin"
  on public.api_keys for insert
  to authenticated
  with check (user_id = auth.uid() or public.is_admin());

create policy "api_keys update own or admin"
  on public.api_keys for update
  to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "api_keys delete own or admin"
  on public.api_keys for delete
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Drop legacy permissive policies for api_usage_daily
drop policy if exists "Admin manage all api_usage_daily" on public.api_usage_daily;
drop policy if exists "Public read api_usage_daily" on public.api_usage_daily;
drop policy if exists "api_usage_daily select own or admin" on public.api_usage_daily;
drop policy if exists "api_usage_daily modify admin" on public.api_usage_daily;

-- Hardened RLS policies for api_usage_daily: owner or admin read, admin write
create policy "api_usage_daily select own or admin"
  on public.api_usage_daily for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "api_usage_daily modify admin"
  on public.api_usage_daily for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- -------------------------------------------------------------------------------
-- B2B DEVELOPER API & RESELLER DROPSHIP ORDERS TABLE
-- -------------------------------------------------------------------------------

create table if not exists public.api_orders (
  id uuid primary key default gen_random_uuid(),
  api_key_id uuid references public.api_keys(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  reseller_order_id text,
  platform text default 'api',
  recipient_name text not null,
  recipient_phone text not null,
  recipient_email text,
  recipient_address text not null,
  recipient_city text not null,
  recipient_state text not null,
  recipient_pincode text not null,
  sender_name text,
  sender_phone text,
  packing_preference text default 'Blind Packaging',
  items jsonb not null default '[]'::jsonb,
  status text default 'new',
  tracking_carrier text,
  tracking_number text,
  tracking_message text,
  shipping_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indices for api_orders
create index if not exists api_orders_user_id_idx on public.api_orders (user_id);
create index if not exists api_orders_key_id_idx on public.api_orders (api_key_id);
create index if not exists api_orders_reseller_id_idx on public.api_orders (reseller_order_id);
create index if not exists api_orders_status_idx on public.api_orders (status);

-- Trigger for api_orders updated_at
drop trigger if exists touch_api_orders_updated_at on public.api_orders;
create trigger touch_api_orders_updated_at
before update on public.api_orders
for each row execute function public.touch_updated_at();

-- Enable RLS on api_orders
alter table public.api_orders enable row level security;
drop policy if exists "api_orders insert public or authenticated" on public.api_orders;
create policy "api_orders insert public or authenticated"
  on public.api_orders for insert
  with check (true);

drop policy if exists "api_orders select public or authenticated" on public.api_orders;
drop policy if exists "api_orders select own or admin" on public.api_orders;
create policy "api_orders select own or admin"
  on public.api_orders for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "api_orders update admin" on public.api_orders;
create policy "api_orders update admin"
  on public.api_orders for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "api_orders delete admin" on public.api_orders;
create policy "api_orders delete admin"
  on public.api_orders for delete
  to authenticated
  using (public.is_admin());

-- Create secure get_order_tracking database function querying normalized 3NF tables
DROP FUNCTION IF EXISTS public.get_order_tracking(uuid);
CREATE OR REPLACE FUNCTION public.get_order_tracking(order_id uuid)
RETURNS TABLE (
  id uuid,
  order_number text,
  status text,
  tracking_carrier text,
  tracking_number text,
  tracking_message text,
  dispatched_at timestamptz,
  delivered_at timestamptz,
  recipient jsonb,
  sender jsonb,
  items jsonb,
  buyer_name text,
  phone text,
  email text,
  message text,
  is_dropship boolean,
  dropship_sender_name text,
  dropship_sender_phone text,
  dropship_sender_address text,
  dropship_sender_city text,
  dropship_sender_state text,
  dropship_sender_pincode text,
  dropship_recipient_name text,
  dropship_recipient_phone text,
  dropship_recipient_address text,
  dropship_recipient_city text,
  dropship_recipient_state text,
  dropship_recipient_pincode text,
  dropship_packing_preference text,
  created_at timestamptz,
  updated_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    coalesce(o.order_number, 'ORD-' || substring(o.id::text from 1 for 8)) AS order_number,
    coalesce(f.status, o.status) AS status,
    coalesce(f.tracking_carrier, o.tracking_carrier) AS tracking_carrier,
    coalesce(f.tracking_number, o.tracking_number) AS tracking_number,
    coalesce(f.tracking_message, o.tracking_message) AS tracking_message,
    f.dispatched_at,
    f.delivered_at,
    to_jsonb(a.*) AS recipient,
    to_jsonb(s.*) AS sender,
    coalesce(
      (
        SELECT jsonb_agg(to_jsonb(it.*))
        FROM public.order_items it
        WHERE it.order_id = o.id
      ),
      o.items,
      '[]'::jsonb
    ) AS items,
    coalesce(a.recipient_name, o.buyer_name) AS buyer_name,
    coalesce(a.phone, o.phone) AS phone,
    coalesce(a.email, o.email) AS email,
    o.message,
    o.is_dropship,
    coalesce(s.sender_name, o.dropship_sender_name) AS dropship_sender_name,
    coalesce(s.sender_phone, o.dropship_sender_phone) AS dropship_sender_phone,
    coalesce(s.sender_address, o.dropship_sender_address) AS dropship_sender_address,
    coalesce(s.sender_city, o.dropship_sender_city) AS dropship_sender_city,
    coalesce(s.sender_state, o.dropship_sender_state) AS dropship_sender_state,
    coalesce(s.sender_pincode, o.dropship_sender_pincode) AS dropship_sender_pincode,
    coalesce(a.recipient_name, o.dropship_recipient_name) AS dropship_recipient_name,
    coalesce(a.phone, o.dropship_recipient_phone) AS dropship_recipient_phone,
    coalesce(a.address_line1, o.dropship_recipient_address) AS dropship_recipient_address,
    coalesce(a.city, o.dropship_recipient_city) AS dropship_recipient_city,
    coalesce(a.state, o.dropship_recipient_state) AS dropship_recipient_state,
    coalesce(a.pincode, o.dropship_recipient_pincode) AS dropship_recipient_pincode,
    coalesce(s.packing_preference, o.dropship_packing_preference) AS dropship_packing_preference,
    o.created_at,
    o.updated_at
  FROM public.orders o
  LEFT JOIN public.order_delivery_addresses a ON a.order_id = o.id
  LEFT JOIN public.order_dropship_senders s ON s.order_id = o.id
  LEFT JOIN LATERAL (
    SELECT ful.*
    FROM public.order_fulfillments ful
    WHERE ful.order_id = o.id
    ORDER BY ful.created_at DESC
    LIMIT 1
  ) f ON true
  WHERE o.id = get_order_tracking.order_id;
END;
$$;

-- Grant execute permissions to public/anonymous roles
GRANT EXECUTE ON FUNCTION public.get_order_tracking(uuid) TO anon, authenticated;

-- Create landing_pages table to manage dynamic collection pages and SEO content
CREATE TABLE IF NOT EXISTS public.landing_pages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  meta_title text NOT NULL,
  meta_description text NOT NULL,
  og_title text,
  og_description text,
  image_url text,
  canonical_path text,
  robots_index boolean DEFAULT true,
  robots_follow boolean DEFAULT true,
  h1 text NOT NULL,
  intro_title text,
  intro_text text,
  buyer_guide_title text,
  buyer_guide_sections jsonb default '[]'::jsonb, -- Array of { title, content }
  faqs jsonb default '[]'::jsonb,                 -- Array of { q, a }
  filter jsonb default '{}'::jsonb,                -- Filtering rules: { category, fabric, work, search }
  catalog_title text,
  catalog_subtitle text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.landing_pages ADD COLUMN IF NOT EXISTS catalog_title text;
ALTER TABLE public.landing_pages ADD COLUMN IF NOT EXISTS catalog_subtitle text;

ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "landing pages public read" ON public.landing_pages;
CREATE POLICY "landing pages public read" ON public.landing_pages 
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "landing pages admin all" ON public.landing_pages;
CREATE POLICY "landing pages admin all" ON public.landing_pages 
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-------------------------------------------------------------------------------
-- B2B INFLUENCER & AFFILIATE PROGRAM TABLES
-------------------------------------------------------------------------------

-- 1. Influencer Profiles
create table if not exists public.influencer_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  referral_code text unique not null,
  commission_percentage numeric not null default 10.0 check (commission_percentage >= 0 and commission_percentage <= 100),
  payment_details jsonb default '{}'::jsonb,
  is_approved boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Influencer Landing Click Logs
create table if not exists public.influencer_clicks (
  id uuid primary key default gen_random_uuid(),
  influencer_id uuid not null references public.influencer_profiles(id) on delete cascade,
  user_agent text,
  referrer text,
  created_at timestamptz default now()
);

-- 3. Influencer Sales Referrals
create table if not exists public.influencer_referrals (
  id uuid primary key default gen_random_uuid(),
  influencer_id uuid not null references public.influencer_profiles(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  inquiry_id uuid references public.inquiries(id) on delete set null,
  buyer_id uuid references public.profiles(id) on delete set null,
  buyer_name text,
  items jsonb default '[]'::jsonb,
  sale_amount numeric not null default 0,
  commission_amount numeric not null default 0,
  status text default 'pending' check (status in ('pending', 'paid', 'cancelled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indices
create index if not exists influencer_profiles_code_idx on public.influencer_profiles (lower(referral_code));
create index if not exists influencer_clicks_influencer_id_idx on public.influencer_clicks (influencer_id);
create index if not exists influencer_referrals_influencer_id_idx on public.influencer_referrals (influencer_id);

-- Enable RLS
alter table public.influencer_profiles enable row level security;
alter table public.influencer_clicks enable row level security;
alter table public.influencer_referrals enable row level security;

-- Policies: Influencer Profiles
drop policy if exists "Anyone can select influencer profiles" on public.influencer_profiles;
create policy "Anyone can select influencer profiles"
  on public.influencer_profiles for select
  using (true);

drop policy if exists "Users can insert own influencer profile" on public.influencer_profiles;
create policy "Users can insert own influencer profile"
  on public.influencer_profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "Users can update own influencer profile" on public.influencer_profiles;
create policy "Users can update own influencer profile"
  on public.influencer_profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "Admin manage all influencer profiles" on public.influencer_profiles;
create policy "Admin manage all influencer profiles"
  on public.influencer_profiles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Policies: Influencer Clicks
drop policy if exists "Anyone can insert clicks" on public.influencer_clicks;
create policy "Anyone can insert clicks"
  on public.influencer_clicks for insert
  with check (true);

drop policy if exists "Influencers can select own clicks" on public.influencer_clicks;
create policy "Influencers can select own clicks"
  on public.influencer_clicks for select
  to authenticated
  using ((select auth.uid()) = influencer_id or public.is_admin());

-- Policies: Influencer Referrals
drop policy if exists "Anyone can insert referrals" on public.influencer_referrals;
create policy "Anyone can insert referrals"
  on public.influencer_referrals for insert
  with check (true);

drop policy if exists "Influencers can select own referrals" on public.influencer_referrals;
create policy "Influencers can select own referrals"
  on public.influencer_referrals for select
  to authenticated
  using ((select auth.uid()) = influencer_id or public.is_admin());

drop policy if exists "Admin manage all referrals" on public.influencer_referrals;
create policy "Admin manage all referrals"
  on public.influencer_referrals for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ========================================================
-- Website Traffic & AI Referral Analytics Table
-- ========================================================
create table if not exists public.site_analytics (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  path text not null default '/',
  referrer text,
  source_category text default 'Direct / App',
  source_name text default 'Direct Visit',
  device_type text default 'Desktop',
  device_os text default 'Unknown',
  browser text default 'Unknown',
  country text default 'IN',
  city text default 'Unknown',
  created_at timestamptz default now()
);

create index if not exists site_analytics_created_at_idx on public.site_analytics (created_at desc);
create index if not exists site_analytics_source_category_idx on public.site_analytics (source_category);
create index if not exists site_analytics_source_name_idx on public.site_analytics (source_name);

alter table public.site_analytics enable row level security;

drop policy if exists "Anyone can insert site analytics" on public.site_analytics;
create policy "Anyone can insert site analytics"
  on public.site_analytics for insert
  with check (true);

drop policy if exists "Admin select site analytics" on public.site_analytics;
create policy "Admin select site analytics"
  on public.site_analytics for select
  to authenticated
  using (public.is_admin() or true);

-- ========================================================
-- Vendor Product Stock & Availability Overrides Table
-- ========================================================
create table if not exists public.vendor_product_stock (
  product_id text primary key,
  vendor_code text,
  vendor_name text,
  stock_status text not null,
  stock_status_label text not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null,
  updated_by text,
  updated_by_name text,
  updated_at_ist text not null
);

create index if not exists vendor_product_stock_vendor_code_idx on public.vendor_product_stock (vendor_code);
create index if not exists vendor_product_stock_stock_status_idx on public.vendor_product_stock (stock_status);
create index if not exists vendor_product_stock_updated_at_idx on public.vendor_product_stock (updated_at desc);

alter table public.vendor_product_stock enable row level security;

drop policy if exists "Public read vendor product stock" on public.vendor_product_stock;
create policy "Public read vendor product stock"
  on public.vendor_product_stock for select
  to anon, authenticated
  using (true);

drop policy if exists "Public modify vendor product stock" on public.vendor_product_stock;
drop policy if exists "vendor_product_stock modify admin or vendor" on public.vendor_product_stock;
create policy "vendor_product_stock modify admin or vendor"
  on public.vendor_product_stock for all
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.vendor_code is not null
        and profiles.vendor_code = vendor_product_stock.vendor_code
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.vendor_code is not null
        and profiles.vendor_code = vendor_product_stock.vendor_code
    )
  );

-- ========================================================
-- SHEET DATA (PRODUCT CATALOG & STATIC ASSET CACHE)
-- ========================================================
create table if not exists public.sheet_data (
  id text primary key,
  csv_data text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists sheet_data_updated_at_idx on public.sheet_data (updated_at desc);

alter table public.sheet_data enable row level security;

drop policy if exists "sheet_data public read" on public.sheet_data;
create policy "sheet_data public read"
  on public.sheet_data for select
  to anon, authenticated
  using (true);

drop policy if exists "sheet_data admin modify" on public.sheet_data;
create policy "sheet_data admin modify"
  on public.sheet_data for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists touch_sheet_data_updated_at on public.sheet_data;
create trigger touch_sheet_data_updated_at
  before update on public.sheet_data
  for each row execute function public.touch_updated_at();

-- ========================================================
-- BLOG POSTS (DYNAMIC CMS & SEO ARTICLES)
-- ========================================================
create table if not exists public.blog_posts (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  title text not null,
  meta_title text,
  meta_description text,
  category text not null,
  tag text,
  date text not null,
  read_time text not null,
  author text not null,
  image text not null,
  intro text not null,
  content text not null,
  faqs jsonb default '[]'::jsonb,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists blog_posts_slug_idx on public.blog_posts (slug);
create index if not exists blog_posts_category_idx on public.blog_posts (category);
create index if not exists blog_posts_created_at_idx on public.blog_posts (created_at desc);

alter table public.blog_posts enable row level security;

drop policy if exists "blog_posts public read" on public.blog_posts;
create policy "blog_posts public read"
  on public.blog_posts for select
  to anon, authenticated
  using (true);

drop policy if exists "blog_posts admin modify" on public.blog_posts;
create policy "blog_posts admin modify"
  on public.blog_posts for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists touch_blog_posts_updated_at on public.blog_posts;
create trigger touch_blog_posts_updated_at
  before update on public.blog_posts
  for each row execute function public.touch_updated_at();

-- ==============================================================================
-- COUNTRY-BASED PRICING & DYNAMIC EXCHANGE RATES
-- ==============================================================================
create table if not exists public.country_pricing_configs (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,               -- ISO 2-letter country code (e.g. 'IN', 'US', 'QA', 'AE')
  name text not null,                      -- Country name (e.g. 'India', 'USA', 'Qatar', 'UAE')
  currency text not null,                  -- ISO currency code (e.g. 'INR', 'USD', 'QAR', 'AED')
  currency_symbol text not null,           -- Currency symbol (e.g. '₹', '$', 'QAR', 'AED')
  markup_percent numeric not null default 0, -- Markup % applied to base INR product price
  flag text default '🌐',                  -- Emoji flag
  enabled boolean not null default true,   -- Whether country is selectable
  is_base boolean not null default false,  -- Base reference currency (India/INR)
  sort_order int default 0,                -- Display ordering
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_country_pricing_configs_code on public.country_pricing_configs(code);
create index if not exists idx_country_pricing_configs_enabled on public.country_pricing_configs(enabled);

create table if not exists public.exchange_rates_cache (
  id text primary key default 'INR',       -- Base currency
  rates jsonb not null default '{}'::jsonb,-- Map of currency -> exchange rate
  provider text default 'ExchangeRate-API',
  last_updated timestamptz default now(),
  next_refresh timestamptz,
  expires_at bigint
);

alter table public.country_pricing_configs enable row level security;
alter table public.exchange_rates_cache enable row level security;

-- Policies: Allow full access so Edge Functions and Authenticated Admin clients can read/write without RLS blocking
drop policy if exists "Public read country_pricing_configs" on public.country_pricing_configs;
drop policy if exists "Admin manage country_pricing_configs" on public.country_pricing_configs;
drop policy if exists "Enable all access for country_pricing_configs" on public.country_pricing_configs;
create policy "Enable all access for country_pricing_configs"
  on public.country_pricing_configs for all
  to public
  using (true)
  with check (true);

drop policy if exists "Public read exchange_rates_cache" on public.exchange_rates_cache;
drop policy if exists "Admin manage exchange_rates_cache" on public.exchange_rates_cache;
drop policy if exists "Enable all access for exchange_rates_cache" on public.exchange_rates_cache;
create policy "Enable all access for exchange_rates_cache"
  on public.exchange_rates_cache for all
  to public
  using (true)
  with check (true);

-- Seed Initial Countries (Configurable from Admin Panel)
insert into public.country_pricing_configs (code, name, currency, currency_symbol, markup_percent, flag, enabled, is_base, sort_order)
values
  ('IN', 'India', 'INR', '₹', 0, '🇮🇳', true, true, 1),
  ('US', 'USA', 'USD', '$', 10, '🇺🇸', true, false, 2),
  ('QA', 'Qatar', 'QAR', 'QAR', 15, '🇶🇦', true, false, 3),
  ('AE', 'UAE', 'AED', 'AED', 12, '🇦🇪', true, false, 4),
  ('GB', 'United Kingdom', 'GBP', '£', 12, '🇬🇧', true, false, 5),
  ('EU', 'Eurozone', 'EUR', '€', 12, '🇪🇺', true, false, 6),
  ('CA', 'Canada', 'CAD', 'CA$', 12, '🇨🇦', true, false, 7),
  ('AU', 'Australia', 'AUD', 'A$', 12, '🇦🇺', true, false, 8),
  ('SG', 'Singapore', 'SGD', 'S$', 10, '🇸🇬', true, false, 9),
  ('SA', 'Saudi Arabia', 'SAR', 'SAR', 15, '🇸🇦', true, false, 10),
  ('KW', 'Kuwait', 'KWD', 'KWD', 15, '🇰🇼', true, false, 11),
  ('OM', 'Oman', 'OMR', 'OMR', 15, '🇴🇲', true, false, 12),
  ('BH', 'Bahrain', 'BHD', 'BHD', 15, '🇧🇭', true, false, 13)
on conflict (code) do update set
  name = excluded.name,
  currency = excluded.currency,
  currency_symbol = excluded.currency_symbol,
  markup_percent = excluded.markup_percent,
  flag = excluded.flag,
  enabled = excluded.enabled,
  is_base = excluded.is_base,
  sort_order = excluded.sort_order,
  updated_at = now();

-- Seed Initial Exchange Rates Cache
insert into public.exchange_rates_cache (id, rates, provider, last_updated, next_refresh, expires_at)
values (
  'INR',
  '{
    "INR": 1,
    "USD": 0.0118,
    "QAR": 0.0430,
    "AED": 0.0433,
    "EUR": 0.0109,
    "GBP": 0.0093,
    "CAD": 0.0162,
    "AUD": 0.0181,
    "SGD": 0.0157,
    "SAR": 0.0442,
    "KWD": 0.0036,
    "OMR": 0.0045,
    "BHD": 0.0044
  }'::jsonb,
  'ExchangeRate-API',
  now(),
  now() + interval '6 hours',
  extract(epoch from (now() + interval '6 hours')) * 1000
)
on conflict (id) do update set
  rates = excluded.rates,
  provider = excluded.provider,
  last_updated = excluded.last_updated,
  next_refresh = excluded.next_refresh,
  expires_at = excluded.expires_at;

-- ========================================================
-- SELLER PRODUCT UPLOADS & ADMIN APPROVAL TABLE
-- ========================================================
create table if not exists public.seller_products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references public.profiles(id) on delete set null,
  seller_code text not null,               -- e.g. "V02"
  seller_name text,                        -- Firm or Partner name
  sku text not null,                       -- Predefined 6-digit base SKU e.g. "102001"
  category text not null,                  -- "Saree", "Suit", "Dupatta", "Lehenga"
  category_code text not null,             -- "1", "2", "3", "4"
  design_code text not null,               -- "001"
  title text not null,
  fabric text not null,
  fabric_top text,                         -- For Suits
  fabric_bottom text,                      -- For Suits
  fabric_dupatta text,                     -- For Suits
  work text not null,
  pattern text not null,
  weave text not null,
  purity text not null,
  type text not null,
  colors jsonb not null default '[]'::jsonb, -- Array of [{ color: 'Rani', image_url: '...', sku: '102001-1' }]
  images jsonb not null default '[]'::jsonb, -- Array of Cloudflare R2 image URLs
  cover_image text,                        -- Primary design cover image
  wholesale_price numeric,
  status text not null default 'submitted' check (status in ('submitted', 'approved', 'rejected')),
  admin_notes text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists seller_products_seller_code_idx on public.seller_products (seller_code);
create index if not exists seller_products_sku_idx on public.seller_products (sku);
create index if not exists seller_products_status_idx on public.seller_products (status);
create index if not exists seller_products_category_idx on public.seller_products (category);
create index if not exists seller_products_created_at_idx on public.seller_products (created_at desc);

alter table public.seller_products enable row level security;

-- Public can view approved products only
drop policy if exists "Public view approved seller products" on public.seller_products;
create policy "Public view approved seller products"
  on public.seller_products for select
  to anon, authenticated
  using (status = 'approved');

-- Authenticated sellers can view own products regardless of status
drop policy if exists "Sellers view own products" on public.seller_products;
create policy "Sellers view own products"
  on public.seller_products for select
  to authenticated
  using (auth.uid() = seller_id);

-- Authenticated users can insert products
drop policy if exists "Sellers insert products" on public.seller_products;
create policy "Sellers insert products"
  on public.seller_products for insert
  to authenticated
  with check (auth.uid() = seller_id or public.is_admin());

-- Admins can view and update all seller products
drop policy if exists "Admin all actions on seller products" on public.seller_products;
create policy "Admin all actions on seller products"
  on public.seller_products for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());


