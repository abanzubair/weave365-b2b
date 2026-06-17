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
      // Redirect weave365.in to www.weave365.com
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'weave365.in' }],
        destination: 'https://www.weave365.com/:path*',
        permanent: true,
      },
      // Redirect www.weave365.in to www.weave365.com
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.weave365.in' }],
        destination: 'https://www.weave365.com/:path*',
        permanent: true,
      },
      // Redirect weave365.com to www.weave365.com
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'weave365.com' }],
        destination: 'https://www.weave365.com/:path*',
        permanent: true,
      },
      {
        source: '/catalog',
        destination: '/wholesale-catalogue',
        permanent: true,
      },
      {
        source: '/catalogue',
        destination: '/wholesale-catalogue',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
