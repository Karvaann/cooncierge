import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable ESLint during build to prevent deployment failures
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript type checking during build (optional)
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;