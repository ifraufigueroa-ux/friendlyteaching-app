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
  async headers() {
    return [
      {
        // /sw.js is a kill-switch now — never let the browser cache it,
        // otherwise a stuck client keeps the old worker in control for
        // hours. Same for the manifest while we're at it.
        source: '/:file(sw.js|manifest.json)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, max-age=0' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
    ];
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
