import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: ".",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pivotmedia.co.jp",
      },
    ],
    unoptimized: true,
  },
};

export default nextConfig;
