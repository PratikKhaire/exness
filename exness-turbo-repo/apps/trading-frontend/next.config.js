/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@repo/shared-types'],
  experimental: {
    esmExternals: true,
  },
  env: {
    TRADING_ENGINE_URL: process.env.TRADING_ENGINE_URL || 'http://localhost:4000',
    EXNESS_BACKEND_URL: process.env.EXNESS_BACKEND_URL || 'http://localhost:5000',
  },
}

module.exports = nextConfig
