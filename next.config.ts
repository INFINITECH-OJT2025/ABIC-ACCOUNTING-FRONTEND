import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [100, 75],
  },
  serverOptions: {
    hostname: "localhost",
    port: 3000,
  },
};

export default nextConfig;
