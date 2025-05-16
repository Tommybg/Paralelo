/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: false, // Disable Turbopack if you were using it
    // Any other experimental flags you might have that could relate to build tooling
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false

    // It's good practice to ensure pdf.worker.js isn't processed by server-side loaders
    // if it's only meant for client-side. However, our current setup copies it to public
    // and Processor.ts handles client-side loading, which is generally fine.

    // Adding a rule to handle .mjs files explicitly if not already handled by Next.js default webpack config
    // This can sometimes help with pdfjs-dist's .mjs files.
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: "javascript/auto",
    });

    return config
  }
}

module.exports = nextConfig 