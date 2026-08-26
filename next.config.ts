import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/dashboard/contacts',
        destination: '/contacts',
        permanent: true,
      },
      {
        source: '/dashboard/contacts/:path*',
        destination: '/contacts/:path*',
        permanent: true,
      },
      {
        source: '/dashboard/templates',
        destination: '/templates',
        permanent: true,
      },
      {
        source: '/dashboard/templates/:path*',
        destination: '/templates/:path*',
        permanent: true,
      },
      {
        source: '/dashboard/whatsapp',
        destination: '/whatsapp',
        permanent: true,
      },
      {
        source: '/dashboard/wishes',
        destination: '/wishes',
        permanent: true,
      },
      {
        source: '/dashboard/settings',
        destination: '/settings',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
