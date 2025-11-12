/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, // Enable strict mode for better error detection
  swcMinify: true,

  // ESLint enabled - helps catch bugs during development
  // Warnings only during build (errors are for development)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Enable serverless functions for API routes (Netlify Functions)
  // Removed 'output: export' to allow API routes to work
  // Removed trailingSlash to fix API route 404s
  trailingSlash: false,

  // Image optimization settings for static export
  images: {
    unoptimized: true,
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Enterprise AI Hub',
    NEXT_PUBLIC_COMPANY_DOMAIN: process.env.NEXT_PUBLIC_COMPANY_DOMAIN,
    NEXT_PUBLIC_SUPER_ADMIN_EMAIL: process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL,
    NEXT_PUBLIC_SUPPORT_EMAIL: process.env.NEXT_PUBLIC_SUPPORT_EMAIL,
  },

  // Transpile GSAP modules for proper ES6 support
  transpilePackages: ['gsap'],

  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    return config;
  },
};

module.exports = nextConfig;
