/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'weave365.in' }],
        destination: 'https://www.weave365.in/:path*',
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
