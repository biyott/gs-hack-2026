import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { cpus: 2 },
  serverExternalPackages: ["better-sqlite3", "sharp", "js-aruco2"],
  devIndicators: false,
  poweredByHeader: false,
};

export default nextConfig;
