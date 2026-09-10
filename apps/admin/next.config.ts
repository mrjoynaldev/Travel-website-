import type { NextConfig } from "next";

// Static export for Firebase Hosting (see firebase.json at the repo root).
// There is no Next.js server in production: the browser talks to the Render
// API directly via NEXT_PUBLIC_API_URL (apps/admin/.env for local dev,
// build-time env for Firebase).
const nextConfig: NextConfig = {
  output: "export",
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
};

export default nextConfig;
