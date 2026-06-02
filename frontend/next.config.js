/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Only proxy /api to a local backend during development. In production the
    // API client (lib/api.ts) talks to NEXT_PUBLIC_API_URL directly or serves
    // built-in demo data, so no rewrite is needed.
    if (process.env.NODE_ENV !== "development") return [];
    const target = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${target}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
