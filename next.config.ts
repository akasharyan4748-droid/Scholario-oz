import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: ["*.space-z.ai", "*.chatglm.cn", "*.z.ai", "127.0.0.1", "localhost", "*.localhost"],
  // NOTE (dev stability): dev.log / tmp-scripts / .zscripts are in
  // .gitignore — Turbopack's watcher honors gitignore, so scratch scripts
  // and the request log never trigger Fast-Refresh rebuild loops.
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'framer-motion',
      'motion',
      'date-fns',
    ],
    // Sandbox has ~3.9GB RAM — keep Turbopack's dev memory in check so the
    // kernel OOM-killer never takes the server down during route compiles.
    turbopackMemoryLimit: 2200,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
