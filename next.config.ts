import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/super/admin/head", destination: "/super/head/admins", permanent: true },
      { source: "/super/admin/head/:path*", destination: "/super/head/:path*", permanent: true },
      { source: "/super/admin/management", destination: "/super/head/admins", permanent: true },
      { source: "/super/management", destination: "/super/head/admins", permanent: true },
    ];
  },
};

export default nextConfig;
