import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

const rootDir = import.meta.dirname;
const packagesDir = path.resolve(rootDir, "../../packages");

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: "@/admin-site", replacement: path.resolve(rootDir, "src/admin-site") },
      { find: "@shared", replacement: path.resolve(packagesDir, "contracts/src") },
      { find: "@", replacement: path.resolve(packagesDir, "client-common/src") },
    ],
  },
  envDir: rootDir,
  build: {
    outDir: path.resolve(rootDir, "dist"),
    emptyOutDir: true,
  },
  server: {
    proxy: {
      "/api": "http://localhost:4000",
      "/manus-storage": "http://localhost:4000",
    },
  },
});
