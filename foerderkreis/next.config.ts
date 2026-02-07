import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || "https://sdl.88.99.83.132.sslip.io",
  },
};

export default nextConfig;
