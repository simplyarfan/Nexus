/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,

  // Temporarily ignore ESLint errors during build (green theme migration in progress)
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
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://thesimpleai.vercel.app',
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Enterprise AI Hub',
    NEXT_PUBLIC_COMPANY_DOMAIN: process.env.NEXT_PUBLIC_COMPANY_DOMAIN || 'securemaxtech.com',
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
