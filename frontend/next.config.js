/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
      },
    ],
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
    // Remove trailing /api/v1 if present to avoid duplication
    const baseUrl = apiUrl.replace(/\/api\/v1$/, '');
    return [
      {
        source: '/api/:path*',
        destination: `${baseUrl}/api/v1/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
