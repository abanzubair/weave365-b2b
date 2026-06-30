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
