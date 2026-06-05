---
trigger: always_on
---

# Weave365 B2B Codebase Review

> Reviewed: All source files under `src/`, `app/`, and root config.
> Stack: **Next.js 16 (App Router)** · React 19 · Supabase · Vanilla CSS · Cloudflare Pages

---

## Executive Summary

The codebase is **functional, well-commented, and ships a rich feature set** — B2B catalog, reseller tools, vendor onboarding, admin panel, blog, SEO landing pages, and more. However, it has **grown organically** and now has several structural issues that will make future development slower and buggier. The biggest concerns are:

1. **God Component** — `App.jsx` (1,656 lines) owns nearly all application state and routing.
2. **Massive monolith files** — `Admin.jsx` (4,207 lines), `TrustedPartnerRegistrationPage.jsx` (3,163 lines), `ProductPage.jsx` (2,033 lines).
3. **Client-side routing inside a Next.js App Router project** — undermining SSR, SEO, and code-splitting.

---

## 🔴 Critical Issues

### 1. God Component: [App.jsx](file:///d:/weave365%20B2B/src/App.jsx) (1,656 lines)

This single component manages:
- ~25 `useState` hooks (search, filters, auth, cart, favorites, user, vendor, dropdowns, positions, scroll state…)
- ~15 `useEffect` hooks
- All client-side routing (giant `if/else` chain at lines 895–1120)
- The entire header/nav bar markup (lines 1122–1452)
- The full search overlay UI (lines 1455–1600)
- Cart, auth modal, footer, and internal link components

**Why this is bad:**
- Any state change (e.g. typing in search) triggers React reconciliation for the **entire application shell**.
- Every view is eagerly imported at the top of the file (lines 40–73). None are lazy-loaded despite `Suspense` being imported but **never used**.
- It's nearly impossible to test individual features in isolation.

**Recommendation:**
- Extract routing into actual Next.js file-based routes (e.g. `app/wholesale-catalogue/page.jsx`, `app/product/[id]/page.jsx`).
- Move shared state into a React Context or a lightweight store (e.g. Zustand).
- Break the header, search overlay, and mobile menu into standalone feature components with their own local state.

---

### 2. Massive File Sizes

| File | Lines | Size |
|------|------:|-----:|
| [Admin.jsx](file:///d:/weave365%20B2B/src/views/Admin.jsx) | 4,207 | 184 KB |
| [TrustedPartnerRegistrationPage.jsx](file:///d:/weave365%20B2B/src/views/TrustedPartnerRegistrationPage.jsx) | 3,163 | 174 KB |
| [ProductPage.jsx](file:///d:/weave365%20B2B/src/ProductPage.jsx) | 2,033 | 85 KB |
| [pages.css](file:///d:/weave365%20B2B/src/styles/pages.css) | — | 110 KB |
| [vendorPartnershipPage.css](file:///d:/weave365%20B2B/src/styles/vendorPartnershipPage.css) | — | 69 KB |
| [Home.jsx](file:///d:/weave365%20B2B/src/views/Home.jsx) | 1,095 | 45 KB |

**Admin.jsx** contains the entire admin dashboard — user pipeline, SEO settings manager, blog CRUD, review moderation, vendor partner management, inline HTML document generator (lines 576–800+ of raw HTML template strings), chart components, and more. This should be split into at least 5–6 component files.

**TrustedPartnerRegistrationPage.jsx** contains ~300 lines of translation dictionaries (English + Hindi) that should be extracted to JSON locale files.

---

### 3. Fighting the Framework: Client-Side Routing in Next.js App Router

The project uses Next.js 16 App Router (`app/` directory) but **completely bypasses** it:

```jsx
// App.jsx line 106
const route = pendingRoute || pathSegments[0] || 'home';
// ... lines 895-1120: giant if/else chain manually selecting which component to render
```

The `app/[[...slug]]/page.jsx` catch-all route renders `<App />` for every single URL. This means:
- **No server-side rendering** for any page — all data fetching happens client-side.
- **No automatic code-splitting** — every view is bundled into the initial JS payload.
- **No route-level data loading** — Next.js `generateMetadata`, `generateStaticParams`, and server components are unused.
- The manual `setTimeout(() => router.push(href), 300)` at [line 849–851](file:///d:/weave365%20B2B/src/App.jsx#L849-L851) adds artificial 300ms delay to every navigation.

> [!CAUTION]
> This is the single biggest architectural problem. You're paying the cost of a Next.js framework (build complexity, server runtime) without getting any of its benefits (SSR, SSG, streaming, code-splitting).

---

## 🟡 Moderate Issues

### 4. Duplicated Meta Tag / SEO Logic

The pattern of manually creating `<meta>` tags and `<link rel="canonical">` via `document.createElement` is **duplicated identically** across:
- [Home.jsx](file:///d:/weave365%20B2B/src/views/Home.jsx#L329-L378) (lines 329–378)
- [ProductPage.jsx](file:///d:/weave365%20B2B/src/ProductPage.jsx#L413-L464) (lines 413–464)
- Likely every other view that does SEO

This should be a single reusable hook (e.g. `usePageSeo({ title, description, canonical })`), or better yet, handled by Next.js `generateMetadata` if you migrate to proper file-based routing.

---

### 5. Barrel-File Re-export Anti-Pattern: [storefrontShared.jsx](file:///d:/weave365%20B2B/src/storefrontShared.jsx)

This file imports **17 lucide-react icons** (lines 9–39) that it **never uses**. It also imports and re-exports 10 components purely as a "gateway":

```jsx
import { ResellerShareModal } from './components/ResellerShareModal.jsx';
// ...
export { ResellerShareModal, WhatsappIcon, SectionTitle, ... };
```

Meanwhile, most consumers (e.g. `ProductPage.jsx`) import these components **directly** from their source files anyway. This barrel file:
- Increases the initial bundle by pulling in unused icons.
- Creates a confusing dual-import path (do I import from `storefrontShared` or the component file directly?).

**Recommendation:** Remove the barrel re-exports. Import each utility/component directly from its own file. Keep only the business logic functions (`buildWhatsappUrl`, `expandedProductCards`, etc.) in this file.

---

### 6. Redundant/Dead Code

| Location | Issue |
|----------|-------|
| [App.jsx L9](file:///d:/weave365%20B2B/src/App.jsx#L9) | `Suspense` and `lazy` imported but **never used** |
| [App.jsx L10](file:///d:/weave365%20B2B/src/App.jsx#L10) | `createPortal` imported from react-dom — used, but the dropdown portal pattern is repeated 4× identically |
| [Home.jsx L222-240](file:///d:/weave365%20B2B/src/views/Home.jsx#L222-L240) | ~20 lines of commented-out hero rotation code |
| [Home.jsx L622-727](file:///d:/weave365%20B2B/src/views/Home.jsx#L622-L727) | ~100 lines of commented-out "Brand Collaboration Hero" JSX |
| [storefrontShared.jsx L163-165](file:///d:/weave365%20B2B/src/storefrontShared.jsx#L163-L165) | `shareImageProxyUrl` is a no-op identity function |
| [productData.js L39-40](file:///d:/weave365%20B2B/src/productData.js#L39-L43) | `row['Category'] || row['Category']` — same key used twice (copy-paste error) |
| [Home.jsx L23](file:///d:/weave365%20B2B/src/views/Home.jsx#L23) | `Calendar, Clock` imported from lucide-react but never used |
| [Home.jsx L41-54](file:///d:/weave365%20B2B/src/views/Home.jsx#L41-L54) | `defaultHeroFeatures` uses placeholder "Lorem ipsum" text |
| [ProductPage.jsx L614-619](file:///d:/weave365%20B2B/src/ProductPage.jsx#L614-L619) | `detailRows` has 3 deps in its memo array that aren't used in the body (`variant`, `displayPrice`, `totalColors`) |

---

### 7. Dropdown Portal Pattern Repeated 4×

The exact same dropdown portal logic appears in App.jsx for:
1. Categories dropdown (lines 1166–1206)
2. Partners dropdown (lines 1207–1249)
3. Profile dropdown (lines 1280–1381)
4. Currency dropdown (lines 1405–1449)

Each one has: a ref, a position state, a `getBoundingClientRect()` call, a `createPortal()`, and fixed positioning with `translateX(-50%)`. This should be a single `<DropdownPortal>` component.

---

### 8. Inline Styles in JSX

There are numerous inline `style={{...}}` objects scattered throughout the codebase, for example:
- [App.jsx L1329-1336](file:///d:/weave365%20B2B/src/App.jsx#L1329-L1336) — inline flex/gap/color on the Product Listing button
- [Home.jsx L561](file:///d:/weave365%20B2B/src/views/Home.jsx#L561) — `textDecoration: 'none'` inline on hero links

These create new object references on every render (triggering unnecessary reconciliation) and bypass the existing CSS system.

---

### 9. Fake/Seed Reviews Shipped as Real Data

[ProductPage.jsx lines 69–104](file:///d:/weave365%20B2B/src/ProductPage.jsx#L69-L104) generates fake "seed reviews" with fabricated reviewer names ("Aishwarya R.", "Meenakshi Iyer", "Suhasini Rao") and fake business names. These are shown to users when no real reviews exist. Combined with the Product Schema markup (lines 727–779) that includes these as structured data, this could violate Google's review spam policies.

---

### 10. No Error Boundaries

There is zero usage of React Error Boundaries. If any child component throws during render, the entire app crashes with a white screen. At minimum, wrap the `routeContent` render and the Admin panel in error boundaries.

---

## 🟢 Minor Issues & Suggestions

### 11. `window.__appNavigate` Global

[App.jsx line 861](file:///d:/weave365%20B2B/src/App.jsx#L861) — `window.__appNavigate = navigate` exposes internal state management to the global scope. This is a debugging artifact that should be removed in production.

### 12. Cart Persistence is Delete-Then-Insert

[cartHelpers.js lines 127–143](file:///d:/weave365%20B2B/src/utils/cartHelpers.js#L127-L143) — `persistCart` deletes ALL cart items then re-inserts. If the insert fails (network error), the user loses their entire cart. Use `upsert` or a transaction instead.

### 13. Console Logs in Production

[App.jsx line 842](file:///d:/weave365%20B2B/src/App.jsx#L842) — `console.log('Navigation triggered:', ...)` runs on every navigation in production. There are also various `console.log/warn/error` calls throughout that should be gated behind `process.env.NODE_ENV !== 'production'`.

### 14. Global `process` Polyfill Hack

[TrustedPartnerRegistrationPage.jsx lines 35–37](file:///d:/weave365%20B2B/src/views/TrustedPartnerRegistrationPage.jsx#L35-L37):
```javascript
if (typeof globalThis !== 'undefined' && !globalThis.process) {
  globalThis.process = { env: {} };
}
```
This is a workaround for a Cloudflare edge runtime issue. It should be handled in `next.config.js` or a proper polyfill, not at the component level.

### 15. `new Intl.NumberFormat()` Created on Every Call

[priceUtils.js line 88](file:///d:/weave365%20B2B/src/utils/priceUtils.js#L88-L94) — `formatMoney` creates a new `Intl.NumberFormat` instance every time it's called. Since currency rarely changes, memoize the formatter.

### 16. Sorting Duplicated

The sorting logic `sort by stockInDate descending, tiebreak by original index` is copy-pasted identically in:
- [App.jsx lines 643–651](file:///d:/weave365%20B2B/src/App.jsx#L643-L651)
- [Home.jsx lines 384–391](file:///d:/weave365%20B2B/src/views/Home.jsx#L384-L391)
- [Home.jsx lines 407–414](file:///d:/weave365%20B2B/src/views/Home.jsx#L407-L414)

Extract to a shared `sortByDateDescending(products)` utility.

### 17. 10 Google Fonts Loaded

[layout.jsx](file:///d:/weave365%20B2B/app/layout.jsx) loads **10 Google Fonts** (Cormorant Garamond, Outfit, Playfair Display, Inter, Manrope, Work Sans, Poppins, Cormorant, Montserrat, Marcellus). This significantly increases page weight and TTFB. Audit which fonts are actually used in your CSS and remove the rest.

### 18. SEO Category Map Duplicated

The `seoCategoryMap` object is defined identically in:
- [App.jsx lines 81–86](file:///d:/weave365%20B2B/src/App.jsx#L81-L86)
- [App.jsx lines 801–810](file:///d:/weave365%20B2B/src/App.jsx#L801-L810) (inside `navigate`)
- [Home.jsx lines 792–797](file:///d:/weave365%20B2B/src/views/Home.jsx#L792-L797) (inside render)

Extract to `config.js` as a single shared constant.

---

## ✅ What's Done Well

| Area | Assessment |
|------|-----------|
| **JSDoc comments** | Every file has a clear purpose header