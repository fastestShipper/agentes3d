import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
  ],
  async rewrites() {
    return [
      { source: "/api/bridge/:path*", destination: "http://127.0.0.1:8700/:path*" },
    ];
  },
};

export default nextConfig;
