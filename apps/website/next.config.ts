import type { NextConfig } from "next";

// Static export for Firebase Hosting (see firebase.json at the repo root).
// There is no Next.js server in production:
// - Security/SEO/cache headers are served from firebase.json.
// - Browsers call the Render API directly via NEXT_PUBLIC_API_URL
//   (apps/website/.env for local dev, build-time env for Firebase).
// - Sitemap/robots/RSS/llms.txt are generated at build time, not proxied.
const nextConfig: NextConfig = {
  output: "export",
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
};

export default nextConfig;
