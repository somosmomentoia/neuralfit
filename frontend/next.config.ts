import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Local development
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
        pathname: '/uploads/**',
      },
      // Production - Railway or custom domain
      {
        protocol: 'https',
        hostname: '*.railway.app',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '*.up.railway.app',
        pathname: '/uploads/**',
      },
      // Custom domain
      {
        protocol: 'https',
        hostname: 'api.neuralfit.co',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '*.neuralfit.co',
        pathname: '/uploads/**',
      },
    ],
  },
};

export default nextConfig;
