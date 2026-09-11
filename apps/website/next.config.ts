import type { NextConfig } from "next";

// Server mode for Firebase App Hosting (live SSR + ISR — admin edits appear
// without redeploys). API_URL points at the Render API:
// - Server components call it directly (see src/lib/trpc-server.ts).
// - Browsers use same-origin /api rewrites below (no CORS needed); setting
//   NEXT_PUBLIC_API_URL overrides to direct calls when required.
const apiOrigin = (process.env.API_URL || "http://localhost:4000").replace(/\/+$/, "");

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
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
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${apiOrigin}/api/:path*` },
      { source: "/manus-storage/:path*", destination: `${apiOrigin}/manus-storage/:path*` },
    ];
  },
};

export default nextConfig;
