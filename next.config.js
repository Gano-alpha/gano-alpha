/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['logo.clearbit.com'],
  },
  async rewrites() {
    return [
      {
        source: '/backend/:path*',
        destination: 'https://api.ganoalpha.com/:path*',
      },
    ]
  },
}

module.exports = nextConfig
