/**
 * Registry of pre-made storefront templates available for Weave365 resellers.
 */
export const PREMADE_TEMPLATES = [
  {
    id: 'ecom-template-1',
    name: 'VRTX Modern Studio & Boutique',
    tagline: 'Ultra-fast, mobile-first boutique with cart drawer & WhatsApp order flow',
    category: 'Modern Minimalist Luxury',
    badge: 'Featured & Ready',
    badgeType: 'ready',
    status: 'ready',
    description: 'A high-converting, mobile-first luxury studio & boutique template with quick drawers, hero video banner, bento collections, and instant WhatsApp ordering.',
    previewImage: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=800&auto=format&fit=crop',
    techStack: ['Next.js 14', 'Tailwind CSS', 'TypeScript', 'Cart Drawer'],
    features: [
      'Live auto-sync with your Weave365 products & custom markups',
      'High-resolution image gallery & multiple fabric angles',
      '1-Click WhatsApp customer checkout and order confirmation',
      'Ultra-fast load speed & mobile-first responsiveness',
      'Custom branding, store name, and logo support'
    ],
  },
  {
    id: 'ecom-template-2',
    name: 'Royal Banaras Heritage',
    tagline: 'Bridal silk sarees, zari verification badges & heritage loom stories',
    category: 'Traditional & Bridal Heritage',
    badge: 'Coming Soon',
    badgeType: 'soon',
    status: 'coming_soon',
    description: 'Rich royal gold and maroon aesthetics designed specifically for high-ticket Banarasi bridal sarees, silk lehengas, and zari brocades.',
    previewImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800&auto=format&fit=crop',
    techStack: ['Next.js 14', 'Tailwind CSS', 'Framer Motion'],
    features: [
      'Heritage storytelling & artisan loom bio blocks',
      'Zari purity certificate badges & zoom inspection',
      'Video reel showcases & bridal lookbooks'
    ],
  },
  {
    id: 'ecom-template-3',
    name: 'Silk & Saffron Minimal',
    tagline: 'Editorial designer lookbook with color swatches & client PDF export',
    category: 'Contemporary Designer Label',
    badge: 'Coming Soon',
    badgeType: 'soon',
    status: 'coming_soon',
    description: 'Clean editorial catalog layout inspired by contemporary Indian luxury labels and handloom fashion houses.',
    previewImage: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop',
    techStack: ['Next.js 14', 'Vanilla CSS', 'Lucide Icons'],
    features: [
      'Editorial lookbook grid & fluid masonry layout',
      'Color swatch filters & multi-currency price toggle',
      'Instant catalog PDF export for clients'
    ],
  }
];

export const DEFAULT_TEMPLATE_ID = 'ecom-template-1';

