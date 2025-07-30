/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true, // ✅ Skip ESLint on Vercel
  },
};

module.exports = nextConfig;
