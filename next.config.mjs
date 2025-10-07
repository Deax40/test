/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
  experimental: {
    esmExternals: 'loose',
    serverComponentsExternalPackages: ['bcryptjs'],
  },
  // Increase body size limit for image uploads
  // Note: Vercel has a hard limit of 4.5MB for serverless functions
  api: {
    bodyParser: {
      sizeLimit: '4mb',
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

    // Fix bcryptjs and other native modules
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
