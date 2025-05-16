/** @type {import('next').NextConfig} */
const nextConfig = {
  // Explicitly disable experimental features that might use Turbopack
  experimental: {
    turbo: false, // Disable Turbopack
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false
    return config
  }
}

module.exports = nextConfig 