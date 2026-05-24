/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/catalog',
        destination: '/catalogue',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
