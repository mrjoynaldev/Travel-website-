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
      { find: "@/public-site", replacement: path.resolve(rootDir, "src/public-site") },
      { find: "@shared", replacement: path.resolve(packagesDir, "contracts/src") },
      { find: "@", replacement: path.resolve(packagesDir, "client-common/src") },
    ],
  },
  envDir: rootDir,
  publicDir: false,
  build: {
    outDir: path.resolve(rootDir, "dist/client"),
    emptyOutDir: true,
  },
  server: {
    proxy: {
      "/api": "http://localhost:4000",
      "/manus-storage": "http://localhost:4000",
    },
  },
  ssr: {
    noExternal: ["streamdown"],
  },
});
