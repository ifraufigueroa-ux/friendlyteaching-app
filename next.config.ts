import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
