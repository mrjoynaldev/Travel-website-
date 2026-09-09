import type { NextConfig } from "next";

const apiOrigin = (process.env.API_URL || "http://localhost:4000").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  // Allow Google Cloud Shell preview hosts (e.g. 3100-cs-*.cloudshell.dev)
  // plus direct IP access, otherwise Next blocks /_next dev assets → white screen.
  allowedDevOrigins: ["**.cloudshell.dev", "**.googleusercontent.com", "**.trycloudflare.com", "10.88.0.4"],
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
      { source: "/docs/:path*", destination: `${apiOrigin}/docs/:path*` },
      { source: "/manus-storage/:path*", destination: `${apiOrigin}/manus-storage/:path*` },
      { source: "/robots.txt", destination: `${apiOrigin}/robots.txt` },
      { source: "/sitemap.xml", destination: `${apiOrigin}/sitemap.xml` },
      { source: "/rss.xml", destination: `${apiOrigin}/rss.xml` },
    ];
  },
};

export default nextConfig;
