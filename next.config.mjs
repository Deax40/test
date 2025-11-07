/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
  experimental: {
    esmExternals: 'loose',
    serverComponentsExternalPackages: ['bcryptjs', '@prisma/client', 'prisma'],
  },

  // Skip static generation for API routes to avoid build-time DB access
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
        ],
      },
    ]
  },
  // NOTE: api.bodyParser is for Pages Router only (deprecated)
  // App Router uses route handlers which handle their own body parsing
  // Body size limit is controlled at the route level with maxDuration

  // Logging configuration for debugging on Vercel
  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    // Fix bcryptjs and other native modules for Vercel
    config.externals = config.externals || [];
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
      'bcrypt': 'commonjs bcrypt',
    });

    return config;
  },
};
export default nextConfig;
