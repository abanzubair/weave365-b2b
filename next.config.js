import os from 'os';

const getLocalIPs = () => {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    const list = interfaces[name];
    if (!list) continue;
    for (const iface of list) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  return ips;
};

const localIPs = getLocalIPs();

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ['@heroicons/react'],
  },
  allowedDevOrigins: [
    'localhost',
    'localhost:3000',
    '127.0.0.1',
    '127.0.0.1:3000',
    ...localIPs,
    ...localIPs.map(ip => `${ip}:3000`),
  ],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
          },
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https://assets.weave365.com https://drive.google.com https://lh3.googleusercontent.com https://*.googleusercontent.com https://www.googletagmanager.com https://www.google-analytics.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://assets.weave365.com https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://api.resend.com; frame-src 'self' https://ecom-template-1-tau.vercel.app https://50k-gamma.vercel.app https://e-com-template-3.vercel.app; frame-ancestors 'self' https://ecom-template-1-tau.vercel.app https://50k-gamma.vercel.app https://e-com-template-3.vercel.app; object-src 'none'; base-uri 'self'; form-action 'self';",
          },
        ],
      },
      {
        source: '/api/v1/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-API-Key' },
        ],
      },
      {
        source: '/api/developer/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-API-Key' },
        ],
      },
      {
        source: '/api/catalog',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/weaver-onboarding',
        destination: '/sell-banarasi-sarees',
        permanent: true,
      },
      {
        source: '/wholesale-banarasi-sarees',
        destination: '/wholesale-catalogue',
        permanent: true,
      },
      {
        source: '/reseller-banarasi-sarees',
        destination: '/resell-sarees-online',
        permanent: true,
      },
      {
        source: '/private-label',
        destination: '/white-label',
        permanent: true,
      },
      {
        source: '/banarasi-sarees/occasion',
        destination: '/sarees',
        permanent: true,
      },
      {
        source: '/banarasi-sarees',
        destination: '/sarees',
        permanent: true,
      },
      {
        source: '/banarasi-suits',
        destination: '/suits',
        permanent: true,
      },
      {
        source: '/banarasi-lehengas',
        destination: '/lehengas',
        permanent: true,
      },
      {
        source: '/banarasi-dupattas',
        destination: '/dupattas',
        permanent: true,
      },
      {
        source: '/banarasi-fabrics',
        destination: '/catalogue',
        permanent: true,
      },
      {
        source: '/fabrics',
        destination: '/catalogue',
        permanent: true,
      },
      {
        source: '/fabric',
        destination: '/catalogue',
        permanent: true,
      },
      {
        source: '/saree',
        destination: '/sarees',
        permanent: true,
      },
      {
        source: '/suit',
        destination: '/suits',
        permanent: true,
      },
      {
        source: '/lehenga',
        destination: '/lehengas',
        permanent: true,
      },
      {
        source: '/dupatta',
        destination: '/dupattas',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
