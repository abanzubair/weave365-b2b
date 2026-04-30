# Supabase Setup

This site already has Supabase support for:

- email/password login
- saved cart
- favourite items

Products still come from your Google Sheet. Supabase is only used for user accounts and saved user data.

## 1. Create a Supabase project

1. Go to [https://supabase.com](https://supabase.com)
2. Create an account
3. Click `New project`
4. Choose your organization
5. Give the project a name
6. Set a database password
7. Choose a region close to your buyers
8. Wait for the project to finish creating

## 2. Get your project keys

In Supabase:

1. Open your project
2. Go to `Project Settings`
3. Open `API`
4. Copy these two values:

- `Project URL`
- `anon public key`

## 3. Create your local env file

In this project folder, create a file named:

```txt
.env
```

or:

```txt
.env.local
```

Copy this into it:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

VITE_STORE_NAME=Weave365
VITE_STORE_SUBTITLE=WHOLESALE
VITE_STORE_EMAIL=weave365@gmail.com
VITE_STORE_PHONE=+91 99191 01369
VITE_STORE_WHATSAPP=919919101369
VITE_MIN_ORDER_VALUE=10000
```

You can also use [.env.example](</D:/weave365 B2B react/.env.example>) as your reference.

## 4. Create the database tables

In Supabase:

1. Open `SQL Editor`
2. Click `New query`
3. Paste the contents of [supabase-schema.sql](</D:/weave365 B2B react/supabase-schema.sql>)
4. Run it

This creates:

- `profiles`
- `cart_items`
- `favorites`

It also turns on Row Level Security so users can only access their own data.

## 5. Enable email login

In Supabase:

1. Go to `Authentication`
2. Open `Providers`
3. Make sure `Email` is enabled

For now, email/password is enough for this site.

## 6. Add your local site URL

In Supabase:

1. Go to `Authentication`
2. Open `URL Configuration`
3. Add this as the site URL during local development:

```txt
http://127.0.0.1:5173
```

If you later deploy the site, add your real domain there too.

## 7. Restart the dev server

After adding the env file, restart the Vite server so it reads the new keys.

## 8. Test it

Once configured:

1. Open the site
2. Click `Login / Register`
3. Create a new account
4. Log in
5. Add a cart item
6. Save a favourite
7. Refresh the page

If everything is connected correctly, cart and favourites should stay attached to the logged-in account.

## Notes

- If Supabase keys are missing, the app falls back to demo local login.
- The app does not store product inventory in Supabase right now.
- Only account data, cart, and favourites are stored there.
