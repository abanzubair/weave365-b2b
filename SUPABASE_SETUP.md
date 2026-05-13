# Supabase Setup And Repair Guide

This project uses Supabase for:

- buyer login/register
- buyer profile and approval status
- approved price group control
- cart persistence
- favourites
- inquiry CRM tables
- saved customer order tables
- follow-up/admin note tables

Products still come from Google Sheets. The public frontend can keep loading public product data from Google Sheets. Later, private price data should come through a backend/Edge Function, not directly from React.

## 1. Confirm local environment variables

Your `.env` or `.env.local` needs:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
VITE_ADMIN_EMAILS=your@email.com

VITE_STORE_NAME=Weave365
VITE_STORE_SUBTITLE=WHOLESALE
VITE_STORE_EMAIL=weave365@gmail.com
VITE_STORE_PHONE=+91 99191 01369
VITE_STORE_WHATSAPP=919919101369
VITE_MIN_ORDER_VALUE=10000
```

After editing env values, restart the Vite dev server.

## 2. Run the repair-safe SQL

In Supabase:

1. Open your project.
2. Go to `SQL Editor`.
3. Create a new query.
4. Paste all of [supabase-schema.sql](</D:/weave365 B2B react/supabase-schema.sql>).
5. Run it.

This script is safe to run again if you already created some tables or policies earlier.

It creates or repairs:

- `profiles`
- `cart_items`
- `favorites`
- `inquiries`
- `saved_customer_orders`
- `follow_ups`
- `admin_notes`

It also enables Row Level Security and recreates the policies used by the React app.

## 3. Register your admin account from the website

1. Open the local site.
2. Click `Login / Register`.
3. Register with the same email you placed in `VITE_ADMIN_EMAILS`.
4. If email confirmation is enabled, confirm the email from your inbox.
5. Log in once so the app creates your row in `profiles`.

## 4. Promote your account to admin

After your profile row exists, go back to Supabase SQL Editor and run this with your real email:

```sql
update public.profiles
set role = 'admin',
    approval_status = 'approved',
    price_group = 'wholesale'
where lower(email) = lower('your@email.com');
```

Refresh the website. You should now see the `Admin` nav item.

## 5. Auth settings to check

In Supabase, check:

- `Authentication` -> `Sign In / Providers`: Email provider enabled.
- `Authentication` -> `URL Configuration`: site URL includes your local URL.
- Add redirect URLs for every dev/prod URL you use.

Useful local URLs:

```txt
http://127.0.0.1:5173
http://127.0.0.1:5174
http://127.0.0.1:5175
```

Production later:

```txt
https://yourdomain.com
```

## 6. Buyer approval behavior

The database and React app now follow this rule:

- Normal registered buyers are auto-approved.
- `buyer_type = wholesale` gets `price_group = wholesale`.
- `buyer_type = reseller` gets `price_group = reseller`.
- Pincodes starting with `221` stay `pending` because that is the Varanasi pincode region.
- Admin can manually approve as wholesale/reseller, hold, or suspend from the admin dashboard.

## 7. What to test

Test these in order:

1. Logged out: prices show locked message.
2. Register with a non-Varanasi pincode like `302001`: price access should become approved.
3. Register with a Varanasi pincode like `221001`: price access should remain pending.
4. Admin page: approve that buyer as wholesale or reseller.
5. Add a cart item, refresh, and confirm cart persists.
6. Save a favourite, refresh, and confirm favourite persists.

## 8. Common errors and fixes

### `relation public.profiles does not exist`

Run [supabase-schema.sql](</D:/weave365 B2B react/supabase-schema.sql>) again.

### `policy already exists`

Use the latest [supabase-schema.sql](</D:/weave365 B2B react/supabase-schema.sql>). It drops and recreates known policies safely.

### Admin dashboard says access denied

Check both:

- `.env` has your email in `VITE_ADMIN_EMAILS`
- `profiles.role` is set to `admin` for that same email

### User can log in but cart/favourites do not save

Check:

- `.env` has the correct Supabase URL and anon key.
- Dev server was restarted after env changes.
- RLS policies were created by running the full SQL.

### Confirmation email redirects to the wrong site

Update Supabase `Authentication` -> `URL Configuration`.

### Prices still show to logged-out users

Restart the dev server and confirm the app is using the latest React build. Later, remove private price columns from the public product Google Sheet before production.

## 9. Later private price-tab setup

When the React UI is complete, create a private Google Sheet tab with:

```txt
product_group_key | variant_code | wholesale_price | reseller_price
```

Then add a Supabase Edge Function that:

1. Checks the logged-in user.
2. Reads `profiles.approval_status`.
3. Reads `profiles.price_group`.
4. Fetches the private Google Sheet price tab.
5. Returns only the allowed visible price.

Do not put the private price-tab URL directly in React.
