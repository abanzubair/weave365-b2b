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
  buyer_subtype text,
  buying_behavior text default 'instant',
  pincode text,
  interested_categories jsonb default '[]'::jsonb,
  price_group text default 'pending',
  approval_status text default 'pending',
  role text default 'customer',
  city text,
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

-------------------------------------------------------------------------------
-- RESELLER WHITE-LABEL FEATURE
-------------------------------------------------------------------------------

-- 1. Reseller Storefronts (Identity & Branding)
create table if not exists public.reseller_storefronts (
  id uuid primary key default gen_random_uuid(),
  reseller_id uuid not null unique references public.profiles(id) on delete cascade,
  store_name text not null,
  slug text not null unique,
  logo_url text,
  whatsapp text,
  theme_settings jsonb default '{"primary_color": "#0F172A", "accent_color": "#0369A1"}'::jsonb,
  custom_domain text unique,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

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
create index if not exists reseller_storefronts_slug_idx on public.reseller_storefronts (slug);
create index if not exists reseller_shares_public_token_idx on public.reseller_shares (public_token);
create index if not exists reseller_share_items_share_id_idx on public.reseller_share_items (share_id);
create index if not exists reseller_customer_inquiries_reseller_id_idx on public.reseller_customer_inquiries (reseller_id);

-- RLS
alter table public.reseller_storefronts enable row level security;
alter table public.reseller_shares enable row level security;
alter table public.reseller_share_items enable row level security;
alter table public.reseller_customer_inquiries enable row level security;

-- Policies: Reseller Storefronts
create policy "Public can view active storefronts"
  on public.reseller_storefronts for select
  using (is_active = true);

create policy "Resellers can manage own storefront"
  on public.reseller_storefronts for all
  to authenticated
  using (auth.uid() = reseller_id)
  with check (auth.uid() = reseller_id);

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
drop trigger if exists touch_reseller_storefronts_updated_at on public.reseller_storefronts;
create trigger touch_reseller_storefronts_updated_at
before update on public.reseller_storefronts
for each row execute function public.touch_updated_at();

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
  pan_number text not null,
  years_in_business text not null,
  fabric_specialisation text not null,
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
  
  status text default 'submitted' check (status in ('submitted', 'approved', 'flagged', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS and policy for vendor_profiles
alter table public.vendor_profiles enable row level security;

drop policy if exists "Allow public onboarding inserts" on public.vendor_profiles;
create policy "Allow public onboarding inserts" 
  on public.vendor_profiles for insert 
  with check (true);

drop policy if exists "Allow select onboarding profiles" on public.vendor_profiles;
create policy "Allow select onboarding profiles" 
  on public.vendor_profiles for select 
  using (true);

drop policy if exists "Allow admin all onboarding profiles" on public.vendor_profiles;
create policy "Allow admin all onboarding profiles" 
  on public.vendor_profiles for all 
  using (public.is_admin());

