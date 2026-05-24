/** @type {import('next').NextConfig} */
const nextConfig = {
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
