/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const nodeUrl =
      process.env.NEXT_PUBLIC_NODE_BACKEND_URL || "http://localhost:3000";
    const goUrl =
      process.env.NEXT_PUBLIC_GO_BACKEND_URL || "http://localhost:3001";

    return [
      {
        source: "/api/node/:path*",
        destination: `${nodeUrl}/:path*`,
        // Add cache busting
        has: [
          {
            type: "query",
            key: "_t",
            value: undefined,
          },
        ],
      },
      {
        source: "/api/go/:path*",
        destination: `${goUrl}/:path*`,
        // Add cache busting
        has: [
          {
            type: "query",
            key: "_t",
            value: undefined,
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
