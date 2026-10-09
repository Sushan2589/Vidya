import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Verification scripts use separate output/config files so an active dev
  // server and teammates' TypeScript configuration are left untouched.
  distDir: process.env.VIDYA_CHECK_DIST_DIR || ".next",
  typescript: {
    tsconfigPath: process.env.VIDYA_CHECK_TSCONFIG || "tsconfig.json",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  allowedDevOrigins: ["192.168.1.70", "192.168.1.12", "localhost"],
};

export default nextConfig;
