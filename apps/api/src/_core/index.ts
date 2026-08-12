import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerStorageProxy } from "./_core/storageProxy";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import { registerPublicFeeds } from "./publicFeeds";
import { getSupabase } from "./supabase";

const CORS_ORIGINS = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);

function registerCors(app: express.Express) {
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && CORS_ORIGINS.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", req.headers["access-control-request-headers"] || "Content-Type,Authorization");
      res.setHeader("Access-Control-Max-Age", "600");
    }
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 4000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.set("trust proxy", 1);
  registerCors(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.get("/healthz", (_req, res) => res.status(200).json({ ok: true, service: "fieldnote-api", timestamp: new Date().toISOString() }));
  app.get("/readyz", async (_req, res) => {
    try {
      const result = await Promise.race([
        getSupabase().from("sites").select("id").limit(1),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("database readiness probe timed out")), 5_000)),
      ]);
      const { error } = result;
      if (error) return res.status(503).json({ ok: false, service: "fieldnote-api", dependency: "database" });
      return res.status(200).json({ ok: true, service: "fieldnote-api", dependency: "database" });
    } catch {
      return res.status(503).json({ ok: false, service: "fieldnote-api", dependency: "database" });
    }
  });
  registerStorageProxy(app);
  registerPublicFeeds(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // Catch-all JSON 404 for the API surface (no UI is served from here).
  app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));

  const preferredPort = parseInt(process.env.PORT || "4000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Fieldnote API running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
