import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/super/admin/employee", destination: "/super/employee/masterfile", permanent: true },
      { source: "/super/admin/employee/:path*", destination: "/super/employee/:path*", permanent: true },
      { source: "/super/admin/head", destination: "/super/head/admins", permanent: true },
      { source: "/super/admin/head/:path*", destination: "/super/head/:path*", permanent: true },
      { source: "/super/admin/forms", destination: "/super/forms/onboarding-checklist", permanent: true },
      { source: "/super/admin/forms/:path*", destination: "/super/forms/:path*", permanent: true },
      { source: "/super/admin/directory", destination: "/super/directory/process", permanent: true },
      { source: "/super/admin/directory/:path*", destination: "/super/directory/:path*", permanent: true },
      { source: "/super/admin/attendance", destination: "/super/attendance/tardiness", permanent: true },
      { source: "/super/admin/attendance/:path*", destination: "/super/attendance/:path*", permanent: true },
      { source: "/super/admin/management", destination: "/super/head/admins", permanent: true },
      { source: "/super/management", destination: "/super/head/admins", permanent: true },
    ];
  },
};

export default nextConfig;
