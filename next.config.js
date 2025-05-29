/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Important for App Engine
  eslint: {
    // Disable ESLint during production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript checks during production builds
    ignoreBuildErrors: true,
  },
  transpilePackages: ['framer-motion'],
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'fs': false,
      'net': false,
      'tls': false,
      'crypto': false,
      'stream': false,
      'url': false,
      'zlib': false,
      'http': false,
      'https': false,
      'assert': false,
      'os': false,
      'path': false,
      'process': false,
    };

    // Grab the existing rule that handles SVG imports
    const fileLoaderRule = config.module.rules.find((rule) =>
      rule.test?.test?.('.svg')
    );

    config.module.rules.push(
      // Reapply the existing rule, but only for svg imports ending in ?url
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/, // *.svg?url
      },
      // Convert all other *.svg imports to React components
      {
        test: /\.svg$/i,
        issuer: { not: /\?url/ },
        use: ['@svgr/webpack'],
      }
    );

    // Modify the file loader rule to ignore *.svg, since we have it handled now.
    fileLoaderRule.exclude = /\.svg$/i;

    return config;
  },
};

module.exports = nextConfig; 