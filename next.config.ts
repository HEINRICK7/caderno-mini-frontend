import type { NextConfig } from "next";

const apiBaseUrl = new URL(process.env.API_BASE_URL ?? "http://localhost:3000").origin;

const nextConfig: NextConfig = {
  devIndicators: false,
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiBaseUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
