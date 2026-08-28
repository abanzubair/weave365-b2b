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
    optimizePackageImports: ['lucide-react'],
  },
  allowedDevOrigins: [
    'localhost',
    'localhost:3000',
    '127.0.0.1',
    '127.0.0.1:3000',
    ...localIPs,
    ...localIPs.map(ip => `${ip}:3000`)
  ],
  async redirects() {
    return [
      {
        source: '/favicon.ico',
        destination: 'https://assets.weave365.com/assets/banner/favicon.ico',
        permanent: false,
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
        destination: '/fabrics',
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
      {
        source: '/fabric',
        destination: '/fabrics',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
