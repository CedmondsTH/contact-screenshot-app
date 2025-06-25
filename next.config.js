/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack is now stable, no experimental config needed
  images: {
    domains: ['localhost'],
    formats: ['image/avif', 'image/webp'],
  },
  // Optimize for Railway deployment
  output: 'standalone',
  // Enable compression
  compress: true,
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 