-- ============================================================================
-- Weave365 B2B Developer API - 30-Day Prepaid Subscription System Migration
-- ============================================================================
-- Instructions: Run this script directly in the Supabase Dashboard SQL Editor.
-- This script is completely idempotent (safe to run multiple times).

-- 1. Add subscription columns to public.api_keys
alter table public.api_keys
  add column if not exists approval_status text not null default 'pending',
  add column if not exists subscription_status text not null default 'inactive',
  add column if not exists subscription_plan text,
  add column if not exists subscription_amount numeric,
  add column if not exists subscription_started_at timestamptz,
  add column if not exists subscription_expires_at timestamptz,
  add column if not exists payment_gateway text,
  add column if not exists last_payment_id text;

-- 2. Constraints for strict data integrity
alter table public.api_keys drop constraint if exists api_keys_approval_status_check;
alter table public.api_keys add constraint api_keys_approval_status_check
  check (approval_status in ('pending', 'approved', 'rejected'));

alter table public.api_keys drop constraint if exists api_keys_subscription_status_check;
alter table public.api_keys add constraint api_keys_subscription_status_check
  check (subscription_status in ('inactive', 'pending_payment', 'active', 'expired', 'cancelled'));

-- 3. High-performance lookup indices
create index if not exists api_keys_approval_status_idx on public.api_keys (approval_status);
create index if not exists api_keys_subscription_status_idx on public.api_keys (subscription_status);
create index if not exists api_keys_subscription_expires_at_idx on public.api_keys (subscription_expires_at);
create index if not exists api_keys_last_payment_id_idx on public.api_keys (last_payment_id);

-- 4. Backfill existing active keys so active partners continue without disruption
update public.api_keys
set approval_status = 'approved',
    subscription_status = 'active'
where is_active = true and (approval_status is null or approval_status = 'pending');

-- 5. Mark pending requests with explicit status
update public.api_keys
set approval_status = 'pending',
    subscription_status = 'inactive'
where is_active = false and (approval_status is null or approval_status = '');

-- 6. Ensure Row Level Security (RLS) is active with hardened policies
alter table public.api_keys enable row level security;

drop policy if exists "api_keys select own or admin" on public.api_keys;
create policy "api_keys select own or admin"
  on public.api_keys for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "api_keys insert own or admin" on public.api_keys;
create policy "api_keys insert own or admin"
  on public.api_keys for insert
  to authenticated
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "api_keys update own or admin" on public.api_keys;
create policy "api_keys update own or admin"
  on public.api_keys for update
  to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "api_keys delete own or admin" on public.api_keys;
create policy "api_keys delete own or admin"
  on public.api_keys for delete
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- 7. Dedicated Immutable Developer Subscription Payment Ledger Table
create table if not exists public.api_subscription_payments (
  id uuid primary key default gen_random_uuid(),
  api_key_id uuid references public.api_keys(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  plan text not null check (plan in ('growth', 'pro')),
  amount numeric(10, 2) not null,
  currency text not null default 'INR',
  payment_gateway text not null, -- 'cashfree' | 'phonepe'
  gateway_order_id text not null, -- Cashfree / PhonePe order ID
  gateway_payment_id text,        -- Transaction reference / UTR
  status text not null default 'completed',
  billing_cycle_days integer not null default 30,
  orders_enabled boolean not null default false,
  allowed_endpoints jsonb not null default '["catalog", "stock", "product"]'::jsonb,
  period_start timestamptz not null default now(),
  period_end timestamptz not null,
  created_at timestamptz not null default now()
);

-- Indices for reporting & billing history
create index if not exists api_sub_payments_user_id_idx on public.api_subscription_payments (user_id);
create index if not exists api_sub_payments_key_id_idx on public.api_subscription_payments (api_key_id);
create index if not exists api_sub_payments_gateway_order_idx on public.api_subscription_payments (gateway_order_id);
create index if not exists api_sub_payments_created_at_idx on public.api_subscription_payments (created_at desc);

-- Enable RLS
alter table public.api_subscription_payments enable row level security;

-- Developers can view their own payment transactions, Admin can view all
drop policy if exists "api_subscription_payments select own or admin" on public.api_subscription_payments;
create policy "api_subscription_payments select own or admin"
  on public.api_subscription_payments for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Server service role & admin can insert payment transactions
drop policy if exists "api_subscription_payments insert admin or service" on public.api_subscription_payments;
create policy "api_subscription_payments insert admin or service"
  on public.api_subscription_payments for insert
  to authenticated
  with check (user_id = auth.uid() or public.is_admin());
