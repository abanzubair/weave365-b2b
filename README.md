# Weave365 B2B Wholesale & Reseller Platform

A premium, modular B2B e-commerce platform built with **Next.js 16**, **React 19**, and **Supabase**, engineered for Varanasi handloom weavers, wholesale buyers, boutique owners, and reseller networks.

🔗 **Live Storefront**: [https://www.weave365.com/](https://www.weave365.com/)

---

## ✨ Features & Architecture

### 🛍️ B2B Wholesale Catalog & Purchasing
* **Dynamic Wholesale Catalog**: Real-time filtering by category (Sarees, Suits, Dupattas, Lehengas), fabric type, weave patterns, and price tiers.
* **Granular Product Views**: High-resolution image preview grids, interactive color swatches, volume-based tiered wholesale pricing, and MOQ (Minimum Order Quantity) calculators.
* **Direct WhatsApp Order Engine**: Instant order payload generator formatted with color variants, wholesale totals, delivery address blocks, and product links for single-click WhatsApp checkout.
* **Pincode Serviceability Check**: Real-time PAN-India courier & Cash on Delivery (COD) serviceability lookup.

### 💼 Reseller Hub & White-Label Tools
* **Custom Profit Margin Builder**: Allows resellers to add percentage or flat price markups to products before sharing with their end-customers.
* **Blind Dropshipping**: Automated parcel label generation with reseller sender branding (zero supplier branding / no price tags).
* **Instant Catalog Sharing**: One-click WhatsApp catalog export with custom images and markup pricing.

### 🧵 Vendor & Artisan Onboarding
* **Master Weaver Registration**: Dual-stage partner onboarding portal with full **English & Hindi (हिंदी)** localization for heritage weavers and manufacturers in Varanasi.
* **Loom & Production Verification**: Verification pipeline for custom woven private label saree production.

### 🛡️ Admin Dashboard & Analytics
* **Buyer Pipeline & Traffic Tracker**: Monitor buyer activity, search impressions, conversion metrics, and regional inquiry trends.
* **Order & Inquiry Management**: Pro-Forma invoice generator, courier tracking manager, and status update workflows.
* **Visual Page & SEO Builder**: Integrated CMS for managing blog articles (`BlogManager`), SEO landing pages, and theme tokens.

---

## 🚀 Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) · [React 19](https://react.dev/) |
| **Backend & Auth** | [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security, Auth) |
| **API Runtime** | Next.js Serverless & Edge API Routes (`app/api/[[...route]]`) |
| **Styling System** | Vanilla CSS (Modular design tokens & responsive media queries) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Deployment** | Cloudflare Pages / Next.js Edge Runtime |
| **Code Base Graph** | Codebase Memory MCP (`codebase-memory-mcp`) |

---

## 📁 Repository Structure

```
weave365-b2b/
├── app/                                 # Next.js App Router & Serverless API Routes
│   ├── layout.jsx                       # Root Layout (Metadata, Fonts, Analytics)
│   ├── [[...slug]]/page.jsx             # Client-side router catch-all route
│   └── api/[[...route]]/                # Edge API handlers (Uploads, Analytics, Early Access)
│
├── src/                                 # Frontend Core Codebase
│   ├── App.jsx                          # Main App routing engine & state orchestrator
│   ├── CatalogPage.jsx                  # Wholesale product catalog view
│   ├── ProductPage.jsx                  # Product detail view & review system
│   ├── views/                           # 30+ Dedicated Page Views (Home, Admin, Reseller, Custom Woven)
│   ├── components/                      # 30+ UI Components (Header, CartDrawer, AuthModal, Search)
│   ├── store/                           # Storefront global state (Zustand)
│   ├── utils/ & services/               # Pricing math, cart helpers, SEO generators, traffic tracking
│   └── styles/                          # Modular Vanilla CSS stylesheets
│
├── design-system/                       # Master design tokens & guidelines
├── supabase-schema.sql                  # Complete SQL schema & table definitions
└── wrangler.jsonc / next.config.js      # Deployment & edge runtime configs
```

---

## 🛠️ Development & Build Setup

### Prerequisites
* **Node.js**: v18.0 or higher
* **npm**: v9.0 or higher

### 1. Installation
```bash
git clone https://github.com/DeusData/codebase-memory-mcp.git # or repo URI
cd weave365-b2b
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Running Locally
Start the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Production Build
Validate production compilation:
```bash
npm run build
```

---

Built for **Weave365** — *Direct Varanasi Handloom Weavers to Global Wholesale Buyers.*
