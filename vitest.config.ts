import "dotenv/config";
import { defineConfig } from "vitest/config";
import path from "path";

const templateRoot = path.resolve(import.meta.dirname);

export default defineConfig({
  resolve: {
    alias: [
      { find: "@/admin-site", replacement: path.resolve(templateRoot, "apps/admin/src/admin-site") },
      { find: "@shared", replacement: path.resolve(templateRoot, "packages/contracts/src") },
      { find: "@", replacement: path.resolve(templateRoot, "packages/client-common/src") },
    ],
  },
  test: {
    root: templateRoot,
    environment: "node",
    env: {
      JWT_SECRET: "test-only-jwt-secret-0123456789abcdef0123456789abcdef",
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ?? "",
      VITE_SUPABASE_PUBLISHABLE_KEY: process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
      SUPABASE_ACCESS_TOKEN: process.env.SUPABASE_ACCESS_TOKEN ?? "",
    },
    include: [
      "apps/api/src/**/*.test.ts",
      "apps/api/src/**/*.spec.ts",
      "apps/admin/src/**/*.test.ts",
      "apps/admin/src/**/*.spec.ts",
    ],
  },
});
