import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.mzstatic.com' },
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'is1-ssl.mzstatic.com' },
      { protocol: 'https', hostname: 'is2-ssl.mzstatic.com' },
      { protocol: 'https', hostname: 'is3-ssl.mzstatic.com' },
      { protocol: 'https', hostname: 'is4-ssl.mzstatic.com' },
      { protocol: 'https', hostname: 'is5-ssl.mzstatic.com' },
      { protocol: 'https', hostname: 'is6-ssl.mzstatic.com' },
    ],
  },
  async redirects() {
    return [
      { source: '/login', destination: '/auth/login', permanent: true },
      // Friendlyflix — legacy /movies URLs still point to the same page.
      { source: '/dashboard/teacher/movies',      destination: '/dashboard/teacher/friendlyflix',      permanent: true },
      { source: '/dashboard/teacher/movies/:path*', destination: '/dashboard/teacher/friendlyflix/:path*', permanent: true },
    ];
  },
  async rewrites() {
    return [
      // Firebase Auth action emails link to /__/auth/action — rewrite to our handler
      {
        source: '/__/auth/action',
        destination: '/auth/action',
      },
    ];
  },
};

export default nextConfig;
