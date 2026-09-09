import type { NextConfig } from "next";

const apiOrigin = (process.env.API_URL || "http://localhost:4000").replace(/\/+$/, "");

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const seoCacheHeaders = [
  { key: "Cache-Control", value: "public, max-age=3600, s-maxage=3600" },
];

const staticCacheHeaders = [
  { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Allow Google Cloud Shell preview hosts, otherwise Next blocks /_next dev assets → white screen.
  allowedDevOrigins: ["**.cloudshell.dev", "**.googleusercontent.com", "**.trycloudflare.com", "10.88.0.4"],
  transpilePackages: ["@fieldnote/client-common"],
  experimental: {
    inlineCss: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/render/image/**" },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/(robots\\.txt|sitemap\\.xml|rss\\.xml|news-sitemap\\.xml|llms\\.txt)",
        headers: seoCacheHeaders,
      },
      {
        source: "/(.*)\\.(ico|png|jpg|jpeg|gif|webp|avif|svg|woff|woff2|ttf|eot|css|js)",
        headers: staticCacheHeaders,
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