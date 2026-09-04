import React from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { siteUrl } from '../../../src/config';

export const runtime = 'edge';

const STOREFRONT_URL = process.env.NEXT_PUBLIC_STOREFRONT_SUPABASE_URL || 'https://agsldsqeynzydujmijgc.supabase.co';
const STOREFRONT_KEY = process.env.STOREFRONT_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_STOREFRONT_SUPABASE_ANON_KEY;

let storefrontDb = null;
function getStorefrontClient() {
  if (!storefrontDb && STOREFRONT_URL && STOREFRONT_KEY) {
    storefrontDb = createClient(STOREFRONT_URL, STOREFRONT_KEY, {
      auth: { persistSession: false },
    });
  }
  return storefrontDb;
}

async function getStorefrontData(slug) {
  if (!slug) return null;
  const cleanSlug = String(slug).toLowerCase().trim();

  try {
    const sb = getStorefrontClient();
    if (!sb) {
      console.error('[store route] Storefront secondary DB not configured');
      return null;
    }

    const { data, error } = await sb
      .from('boutique_tenants')
      .select('*')
      .eq('slug', cleanSlug)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('[store route] Error fetching storefront from secondary DB:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('[store route] Server error:', err);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const storeSlug = decodeURIComponent(resolvedParams?.storeSlug || '');
  const storefront = await getStorefrontData(storeSlug);

  if (!storefront) {
    return {
      title: 'Boutique Storefront Not Found | Weave 365',
      description: 'The requested boutique storefront is not available on Weave 365.',
    };
  }

  const storeTitle = `${storefront.store_name || 'Boutique'} | Official Online Store`;
  const storeDescription = `Explore exclusive handcrafted Banarasi sarees, suits, and handloom textiles from ${storefront.store_name || 'our boutique'}, curated with Weave 365.`;
  const canonicalUrl = `${siteUrl}/store/${encodeURIComponent(storeSlug)}`;

  return {
    title: storeTitle,
    description: storeDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: storeTitle,
      description: storeDescription,
      url: canonicalUrl,
      type: 'website',
      siteName: storefront.store_name || 'Weave 365',
      images: storefront.logo_url ? [{ url: storefront.logo_url }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: storeTitle,
      description: storeDescription,
    },
  };
}

export default async function StorefrontHostPage({ params }) {
  const resolvedParams = await params;
  const storeSlug = decodeURIComponent(resolvedParams?.storeSlug || '');
  const storefront = await getStorefrontData(storeSlug);

  if (!storefront) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        fontFamily: 'Outfit, system-ui, -apple-system, sans-serif',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: '480px',
          background: '#ffffff',
          padding: '2.5rem 2rem',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 16px rgba(0,0,0,0.05)'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: '#fef2f2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem'
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
            Storefront Not Found
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9375rem', lineHeight: '1.5', margin: '0 0 1.75rem 0' }}>
            The boutique handle <strong style={{ color: '#0f172a' }}>"{storeSlug}"</strong> has not been registered or is currently inactive.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link
              href="/wholesale-catalogue"
              style={{
                display: 'inline-block',
                background: '#0f172a',
                color: '#ffffff',
                padding: '0.75rem 1.25rem',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.875rem',
                textDecoration: 'none'
              }}
            >
              Browse Wholesale Catalogue
            </Link>
            <Link
              href="/resell-sarees-online"
              style={{
                display: 'inline-block',
                background: 'transparent',
                color: '#64748b',
                padding: '0.6rem 1.25rem',
                borderRadius: '8px',
                fontWeight: 500,
                fontSize: '0.875rem',
                textDecoration: 'none'
              }}
            >
              Create Your Own Boutique Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Strictly isolated iframe targeting the reseller's specific tenant route and chosen theme
  const themeKey = String(storefront.theme_color || storefront.theme_settings?.theme_id || '').toLowerCase().trim();
  const isTavishiHeritage = themeKey === 'tavishi-heritage' || themeKey === '50k' || themeKey === 'theme-classic-luxury' || themeKey === 'tavishi';
  const isAtelierBanaras = themeKey === 'kasaya-atelier' || themeKey === 'atelier' || themeKey === 'atelier-banaras' || themeKey === 'ecom-template-3' || themeKey === 'template-3' || themeKey === 'e-com-template-3';

  const vrtxBase = process.env.TEMPLATE_VRTX_URL || 'https://ecom-template-1-tau.vercel.app';
  const tavishiBase = process.env.TEMPLATE_TAVISHI_URL || 'https://50k-gamma.vercel.app';
  const atelierBase = process.env.TEMPLATE_ATELIER_URL || 'https://e-com-template-3.vercel.app';

  let templateTargetUrl;
  if (isAtelierBanaras) {
    templateTargetUrl = `${atelierBase.replace(/\/+$/, '')}/?store=${encodeURIComponent(storefront.slug)}`;
  } else if (isTavishiHeritage) {
    templateTargetUrl = `${tavishiBase.replace(/\/+$/, '')}/?store=${encodeURIComponent(storefront.slug)}`;
  } else {
    templateTargetUrl = `${vrtxBase.replace(/\/+$/, '')}/${encodeURIComponent(storefront.slug)}`;
  }

  return (
    <main style={{
      position: 'fixed',
      inset: 0,
      width: '100vw',
      height: '100vh',
      margin: 0,
      padding: 0,
      overflow: 'hidden',
      background: '#ffffff',
      zIndex: 999999
    }}>
      <iframe
        src={templateTargetUrl}
        title={storefront.store_name || 'Boutique Storefront'}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block'
        }}
        allow="clipboard-write; payment; geolocation"
      />
    </main>
  );
}
