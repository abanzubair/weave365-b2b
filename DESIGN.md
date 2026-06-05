---
name: Saree Wholesale B2B Storefront
description: Premium B2B e-commerce platform for Banarasi saree wholesale and reseller networks.
colors:
  primary: "#b78646"
  neutral-bg: "#ffffff"
  neutral-ink: "#241912"
  neutral-muted: "#6d5946"
  neutral-cream: "#fbf6ee"
  border-line: "#eadbc8"
typography:
  display:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "clamp(48px, 6vw, 100px)"
    fontWeight: 600
    lineHeight: 1.2
  body:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "clamp(16px, 1.2vw, 22px)"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  sm: "4px"
  md: "8px"
  lg: "16px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
---

# Design System: Saree Wholesale B2B Storefront

## 1. Overview

**Creative North Star: "The Heritage Curator"**

The visual language of Weave365 balances the luxury of traditional Banarasi saree weaving with a modern, high-contrast B2B interface. This system is designed for professional retailers and boutique owners, rejecting cluttered layout patterns in favor of clean space, refined typography, and purposeful interactive elements.

**Key Characteristics:**
- Restrained editorial palette centered on rich gold, cream, and deep charcoal.
- Strong weight contrast in typography using a serif heading and sans-serif body.
- Spacious layouts with high-contrast text and fine-line borders.

## 2. Colors

The color palette represents a warm, high-end editorial experience.

### Primary
- **Heritage Gold** (`#b78646`): Used strategically for active states, key CTAs, highlights, and secondary label categories. Rare and deliberate.

### Neutral
- **Weave Paper** (`#ffffff`): The primary background color for layouts and card cards.
- **Varanasi Ink** (`#241912`): The primary text color, delivering maximum contrast (over 7:1) on white and cream backgrounds.
- **Artisan Cream** (`#fbf6ee`): The default page background fill, conveying luxury warmth without visual noise.
- **Muted Earth** (`#6d5946`): Used for subheadings, captions, secondary details, and helper text.
- **Loom Line** (`#eadbc8`): A warm sand tone used for dividers, borders, and input boundaries.

### Named Rules
**The 10% Accent Rule.** Heritage Gold is reserved exclusively for primary interactive elements, tags, and key highlights. It should cover no more than 10% of any single viewport surface to preserve its premium signaling.

## 3. Typography

**Display Font:** Cormorant Garamond (with Georgia, serif fallback)
**Body Font:** Manrope (with system-ui, sans-serif fallback)

### Hierarchy
- **Display** (600, `clamp(48px, 6vw, 100px)`, 1.2): Used for primary page titles and hero headers.
- **Headline** (500, `clamp(34px, 4.5vw, 64px)`, 1.2): Used for major sections and callouts.
- **Title** (600, `1.25rem`, 1.3): Used for cards, group headers, and secondary items.
- **Body** (400, `clamp(16px, 1.2vw, 22px)`, 1.6): Used for primary text blocks.
- **Label** (500, `0.75rem`, 0.05em, uppercase): Used for navigation items, small tags, and eyebrows.

### Named Rules
**The Prose Ceiling Rule.** Body copy blocks must be constrained to a maximum width of `75ch` (~650px) to prevent layout scanning fatigue.

## 4. Elevation

The visual space is defined by flat, layered layouts relying on fine borders (`1px`) and soft ambient shadows rather than rigid card structures.

### Shadow Vocabulary
- **Ambient Gold** (`0 18px 45px rgba(128, 93, 49, 0.12)`): Standard soft hover shadow used to lift buttons or clickable cards.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are kept flat and clean at rest. Ambient shadows are applied dynamically on hover or to active modal dialogs.

## 5. Components

### Buttons
- **Shape:** Gently rounded corners (4px radius).
- **Primary:** Background color in gold (`#b78646`), text in white (`#ffffff`). Padding is `12px 24px`.
- **Hover:** Background shifts to dark gold (`#805d31`) with a smooth 0.2s transition.

### Cards / Containers
- **Corner Style:** Rounded corners (16px radius).
- **Background:** White (`#ffffff`) or Cream (`#fbf6ee`).
- **Border:** Fine sand border (`1px solid rgba(234, 219, 200, 0.4)`).
- **Internal Padding:** Generous padding (`24px` to `32px` depending on container width).

### Inputs / Fields
- **Style:** Background white (`#ffffff`), border sand (`1px solid #eadbc8`), radius (8px).
- **Focus:** Border changes to Heritage Gold (`#b78646`) with a subtle glow transition.

### Navigation
- **Style:** Fixed or floating header with minimal links. Active state highlighted in gold with a thin line indicator.

## 6. Do's and Don'ts

### Do:
- **Do** maintain a strict 4.5:1 text-to-background contrast ratio for all readable content.
- **Do** use Lucide React SVG icons consistently for actions and visual tags.
- **Do** align components strictly to the layout grid and use fluid typography scales.

### Don't:
- **Don't** use emojis as UI icons.
- **Don't** use side-stripe borders (e.g. `border-left`) as colored decorative accents on cards.
- **Don't** apply gradient text or heavy color dropshadows.
- **Don't** nested cards inside cards.
- **Don't** overload pages with kickers or small kicker kickers above every header.
