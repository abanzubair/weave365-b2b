# Cloudinary Setup — Step by Step Guide for Weave365 B2B

## Step 1: Create Your Free Account

1. Go to **[cloudinary.com/users/register_free](https://cloudinary.com/users/register_free)**
2. Fill in:
   - **Full Name**: Your name
   - **Email**: Your email
   - **Password**: Choose a strong password
   - **Cloud Name**: Pick something like `weave365` (this appears in all your image URLs)
3. Click **Create Account**
4. Verify your email (check inbox for confirmation link)

> [!IMPORTANT]
> Choose your **Cloud Name** carefully — it becomes part of every image URL and **cannot be changed later**.
> Example: `https://res.cloudinary.com/weave365/image/upload/...`
> Keep it short, lowercase, no spaces. Suggestions: `weave365`, `weave365b2b`, `weave-store`

---

## Step 2: Understand Your Dashboard

After logging in, you'll see:

| Section | What It Does |
|---|---|
| **Media Library** | Where all your images live (like Google Drive folders) |
| **Transformations** | Image editing/optimization settings |
| **Settings → Upload** | Upload presets and rules |
| **Dashboard** | Shows your usage (storage, bandwidth, etc.) |

Your **free plan limits** (shown on dashboard):
- 📦 **25 GB** storage
- 🌐 **25 GB** monthly bandwidth
- 🖼️ **25,000** transformations/month

---

## Step 3: Create Folders for Organization

1. Click **Media Library** in the left sidebar
2. Click the **Create Folder** button (folder icon with +)
3. Create these folders:

```
products/          ← All product images go here
  sarees/          ← Sub-folder per category (optional)
  suits/
  fabrics/
hero/              ← Hero banner images
banners/           ← Any promotional banners
```

> [!TIP]
> Organizing by category makes it much easier to manage 100+ products later.

---

## Step 4: Upload Product Images

### Option A: Upload via Web Dashboard (Easiest)

1. Go to **Media Library → products** folder
2. Click the **Upload** button (top right)
3. Choose **Browse** and select images from your computer
4. Or simply **drag and drop** images into the browser window
5. You can select multiple files at once (bulk upload)

### Option B: Upload via URL (from Google Drive)

If your images are still on Google Drive:
1. Click **Upload → Web Address**
2. Paste the direct Google Drive image URL
3. Cloudinary will download and store it

### Naming Your Images (IMPORTANT for SEO!)

Before uploading, **rename your image files** with descriptive names:

```
❌ Bad:   IMG_20250115_123456.jpg
❌ Bad:   1a2b3c4d5e.jpg
✅ Good:  silk-banarasi-saree-red-001.jpg
✅ Good:  cotton-suit-blue-paisley-045.jpg
✅ Good:  chiffon-dupatta-pink-embroidered-012.jpg
```

> [!IMPORTANT]
> Descriptive file names help Google Image Search rank your products. This is FREE SEO!

---

## Step 5: Get Your Image URLs

After uploading, click on any image in the Media Library:

1. You'll see a panel with image details on the right
2. Look for the **URL** field — it looks like this:

```
https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/v1234567890/products/silk-banarasi-saree-red-001.jpg
```

3. Click the **copy** icon to copy the URL

### The URL Structure Explained:

```
https://res.cloudinary.com/weave365/image/upload/v1234567890/products/saree-red.jpg
│                          │               │      │            │
│                          │               │      │            └── Your folder + filename
│                          │               │      └── Version (auto-generated, optional)
│                          │               └── "upload" = from your uploads
│                          └── Your Cloud Name
└── Cloudinary CDN domain
```

---

## Step 6: Add Optimization Transformations to URLs

This is where Cloudinary shines! You can add **transformation parameters** between `upload/` and the filename:

### Basic Optimized URL (USE THIS):
```
https://res.cloudinary.com/weave365/image/upload/f_auto,q_auto/products/saree-red.jpg
```

| Parameter | What It Does |
|---|---|
| `f_auto` | Auto-serves **WebP** to Chrome, **AVIF** to newer browsers (30-50% smaller!) |
| `q_auto` | Auto-adjusts quality to optimal level (saves bandwidth without visible loss) |
| `w_400` | Resize to 400px wide (great for thumbnail grids) |
| `w_800` | Resize to 800px wide (great for product listing) |
| `w_1200` | Resize to 1200px wide (great for product detail page) |
| `c_fill,w_400,h_400` | Crop to exact 400×400 square (great for uniform grids) |

### Examples for Different Page Contexts:

**Product listing page (thumbnail):**
```
https://res.cloudinary.com/weave365/image/upload/f_auto,q_auto,w_400/products/saree-red.jpg
```

**Product detail page (full size):**
```
https://res.cloudinary.com/weave365/image/upload/f_auto,q_auto,w_1200/products/saree-red.jpg
```

> [!TIP]
> You only need to upload **one high-res image**. Cloudinary generates all sizes on-the-fly from the URL parameters! No need to create multiple versions manually.

---

## Step 7: Update Your Google Sheets

Now replace the Google Drive links in your product spreadsheet with Cloudinary URLs.

### Cover Image Column:

| Before (Drive) | After (Cloudinary) |
|---|---|
| `https://drive.google.com/file/d/1a2b3c/view` | `https://res.cloudinary.com/weave365/image/upload/f_auto,q_auto/products/silk-banarasi-red-001.jpg` |

### Product Images / Color Column:

Your color entries use the format `ColorName:ImageURL`. Just replace the URL part:

| Before | After |
|---|---|
| `Red:https://drive.google.com/file/d/abc/view` | `Red:https://res.cloudinary.com/weave365/image/upload/f_auto,q_auto/products/saree-red.jpg` |
| `Blue:https://drive.google.com/file/d/xyz/view` | `Blue:https://res.cloudinary.com/weave365/image/upload/f_auto,q_auto/products/saree-blue.jpg` |

Multiple colors still use `|` separator:
```
Red:https://res.cloudinary.com/weave365/image/upload/f_auto,q_auto/products/saree-red.jpg|Blue:https://res.cloudinary.com/weave365/image/upload/f_auto,q_auto/products/saree-blue.jpg
```

> [!NOTE]
> You can migrate **gradually** — mix Drive and Cloudinary links in the same spreadsheet. The code we already updated in `productData.js` handles both formats automatically.

---

## Step 8: Sync & Verify

1. After updating Google Sheets, go to your **Admin Dashboard**
2. Click **Sync Sheets to Supabase** to pull the updated data
3. Browse your storefront — images should now load from Cloudinary's CDN
4. Open browser DevTools (F12) → Network tab → check that images come from `res.cloudinary.com`

---

## Bonus: Bulk Migration Shortcut

If you have **many images** on Google Drive and want to migrate them fast:

### Using Cloudinary's Fetch Feature (No upload needed!)

Cloudinary can **fetch and cache** images from any URL on-the-fly. Instead of `upload`, use `fetch`:

```
https://res.cloudinary.com/weave365/image/fetch/f_auto,q_auto,w_1200/https://drive.google.com/thumbnail?id=YOUR_FILE_ID&sz=w1200
```

This tells Cloudinary: *"Grab this image from Drive, optimize it, cache it on CDN, and serve it."*

> [!WARNING]
> The **fetch** method uses your Cloudinary bandwidth for both fetching AND serving. It's great as a **temporary bridge** while you migrate, but for long-term use, upload images directly for better control and performance.

> [!CAUTION]
> The fetch feature must be enabled in your Cloudinary settings:
> **Settings → Security → Fetched URL → Add `drive.google.com` to allowed domains**

---

## Summary Checklist

- [ ] Create Cloudinary account at [cloudinary.com/users/register_free](https://cloudinary.com/users/register_free)
- [ ] Choose a good Cloud Name (e.g., `weave365`)
- [ ] Create `products/` and `hero/` folders in Media Library
- [ ] Upload product images with descriptive filenames
- [ ] Copy URLs with `f_auto,q_auto` transformations
- [ ] Update Google Sheets with new Cloudinary URLs
- [ ] Sync Sheets to Supabase from Admin Dashboard
- [ ] Verify images load from `res.cloudinary.com` in browser DevTools

---

## Need Help Later?

- **Cloudinary Docs**: [cloudinary.com/documentation](https://cloudinary.com/documentation)
- **Image Transformations Reference**: [cloudinary.com/documentation/image_transformations](https://cloudinary.com/documentation/image_transformations)
- **Free tier limits**: [cloudinary.com/pricing](https://cloudinary.com/pricing)
