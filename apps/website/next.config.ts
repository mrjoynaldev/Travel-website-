import type { NextConfig } from "next";

// Server mode for Firebase App Hosting (live SSR + ISR — admin edits appear
// without redeploys). API_URL points at the Render API:
// - Server components call it directly (see src/lib/trpc-server.ts).
// - Browsers use same-origin /api rewrites below (no CORS needed); setting
//   NEXT_PUBLIC_API_URL overrides to direct calls when required.
const apiOrigin = (process.env.API_URL || "http://localhost:4000").replace(/\/+$/, "");

// Content-Security-Policy: allow only what the site actually uses (audited
// Sep 2026 — no maps, no payments, no OAuth popups, no third-party frames
// except CMS article embeds). 'unsafe-inline' is required because Next.js
// inlines critical CSS and the RSC flight data; external sources stay locked
// down. GA origins are included but only load when NEXT_PUBLIC_GA_MEASUREMENT_ID
// is set. YouTube/Vimeo iframes come from CMS article bodies only.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://*.supabase.co",
  "font-src 'self' data:",
  "media-src 'self' https://*.supabase.co",
  "connect-src 'self' https://*.onrender.com https://www.googletagmanager.com https://www.google-analytics.com https://*.supabase.co",
  "frame-src https://www.youtube-nocookie.com https://player.vimeo.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy", value: csp },
  // No OAuth/payment popups or cross-window messaging on the site, so
  // same-origin isolation is safe (WhatsApp/tel links are plain navigations).
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
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
  async redirects() {
    return [
      // Canonical domain: www must not serve the site separately (duplicate-
      // content SEO risk). Host-scoped so localhost/preview hosts are untouched.
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.sundarbanyatri.com" }],
        destination: "https://sundarbanyatri.com/:path*",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${apiOrigin}/api/:path*` },
      { source: "/manus-storage/:path*", destination: `${apiOrigin}/manus-storage/:path*` },
    ];
  },
};

export default nextConfig;
