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
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
    ],
    unoptimized: true,
  },
};

export default nextConfig;
