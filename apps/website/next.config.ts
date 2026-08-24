import type { NextConfig } from "next";

const apiOrigin = (process.env.API_URL || "http://localhost:4000").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ["@fieldnote/client-common"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${apiOrigin}/api/:path*` },
      { source: "/manus-storage/:path*", destination: `${apiOrigin}/manus-storage/:path*` },
      { source: "/robots.txt", destination: `${apiOrigin}/robots.txt` },
      { source: "/sitemap.xml", destination: `${apiOrigin}/sitemap.xml` },
      { source: "/rss.xml", destination: `${apiOrigin}/rss.xml` },
      { source: "/news-sitemap.xml", destination: `${apiOrigin}/news-sitemap.xml` },
    ];
  },
};

export default nextConfig;
