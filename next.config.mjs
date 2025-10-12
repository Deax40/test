/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
  experimental: {
    esmExternals: 'loose',
    serverComponentsExternalPackages: ['bcryptjs'],
    workerThreads: false,
    cpus: 1,
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
