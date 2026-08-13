import type { NextConfig } from "next";

const apiOrigin = (process.env.API_URL || "http://localhost:4000").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  transpilePackages: [
    "@fieldnote/client-common",
    "@fieldnote/contracts",
    "streamdown",
  ],
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${apiOrigin}/api/:path*` },
      { source: "/manus-storage/:path*", destination: `${apiOrigin}/manus-storage/:path*` },
      { source: "/robots.txt", destination: `${apiOrigin}/robots.txt` },
      { source: "/sitemap.xml", destination: `${apiOrigin}/sitemap.xml` },
      { source: "/rss.xml", destination: `${apiOrigin}/rss.xml` },
    ];
  },
};

export default nextConfig;
