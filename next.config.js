/** @type {import('next').NextConfig} */
const nextConfig = {
  // explicit_api.experimental features from origin/main combined with our needs
  experimental: {
    turbo: false, // Disable Turbopack
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Add any other specific experimental flags if they were in your stashed version
    // and are still needed, though the common ones are turbo and serverActions.
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;

    // Adding a rule to handle .mjs files explicitly
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: "javascript/auto",
    });

    return config;
  },
};

module.exports = nextConfig; 