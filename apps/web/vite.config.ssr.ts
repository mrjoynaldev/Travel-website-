import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

const rootDir = import.meta.dirname;
const packagesDir = path.resolve(rootDir, "../../packages");

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: "@/public-site", replacement: path.resolve(rootDir, "src/public-site") },
      { find: "@shared", replacement: path.resolve(packagesDir, "contracts/src") },
      { find: "@", replacement: path.resolve(packagesDir, "client-common/src") },
    ],
  },
  build: {
    ssr: path.resolve(rootDir, "src/entry-server.tsx"),
    outDir: path.resolve(rootDir, "dist/server"),
    emptyOutDir: true,
    target: "node20",
    rollupOptions: {
      output: {
        format: "esm",
        entryFileNames: "entry-server.js",
      },
    },
  },
  ssr: {
    noExternal: ["streamdown"],
  },
});
