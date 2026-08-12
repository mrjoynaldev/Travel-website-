import "dotenv/config";
import { existsSync, readFileSync, statSync } from "node:fs";
import http from "node:http";
import https from "node:https";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import superjson from "superjson";
import { createHttpPrefetch } from "./src/ssr/httpPrefetch";
import { MIME_TYPES, renderHead, serializeState } from "./src/ssr/html";
import type { HeadMeta, SsrPrefetch } from "./src/ssr/prefetch";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV !== "production";
const PORT = Number(process.env.PORT || 3000);
const API_TARGET = (process.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "");

type RenderResult = { html: string; dehydratedState: unknown; head: HeadMeta };
type RenderFn = (url: string, prefetch: SsrPrefetch) => Promise<RenderResult>;

const FEED_PATHS = new Set(["/robots.txt", "/sitemap.xml", "/rss.xml"]);
const isFeedPath = (pathname: string) => FEED_PATHS.has(pathname);

function contentPathFor(urlPath: string, rootDir: string): string | null {
  const decoded = decodeURIComponent(urlPath);
  const full = path.normalize(path.join(rootDir, decoded));
  if (!full.startsWith(rootDir)) return null;
  return full;
}

function serveStatic(res: ServerResponse, filePath: string): void {
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    "content-type": MIME_TYPES[ext] || "application/octet-stream",
    "cache-control": isDev ? "no-cache" : "public, max-age=31536000, immutable",
  });
  res.end(readFileSync(filePath));
}

function proxyApi(req: IncomingMessage, res: ServerResponse, url: string): void {
  const target = new URL(`${API_TARGET}${url}`);
  const lib = target.protocol === "https:" ? https : http;
  const proxyReq = lib.request(
    target,
    {
      method: req.method,
      headers: { ...req.headers, host: target.host },
    },
    proxyRes => {
      res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
      proxyRes.pipe(res);
    },
  );
  proxyReq.on("error", () => {
    res.writeHead(502, { "content-type": "text/plain" });
    res.end("Bad gateway");
  });
  req.pipe(proxyReq);
}

async function main() {
  let renderFn: RenderFn;
  let template: string;

  if (isDev) {
    const { createServer } = await import("vite");
    const vite = await createServer({
      root: __dirname,
      server: { middlewareMode: true },
      appType: "custom",
    });
    template = readFileSync(path.join(__dirname, "index.html"), "utf-8");
    renderFn = async (url, prefetch) => {
      const mod = await vite.ssrLoadModule("/src/entry-server.tsx");
      return mod.render(url, prefetch);
    };
    const server = http.createServer((req, res) => {
      const url = req.url ?? "/";
      const pathname = url.split("?")[0];
      if (isFeedPath(pathname)) {
        proxyApi(req, res, url);
        return;
      }
      vite.middlewares(req, res, () => {
        handleSsr(res, renderFn, template, url).catch(error => {
          console.error("[ssr]", error);
          res.writeHead(500, { "content-type": "text/plain" });
          res.end("Internal server error");
        });
      });
    });
    server.listen(PORT, () => console.log(`CodeReport Global web (dev) running on http://localhost:${PORT}/`));
    return;
  }

  const clientDir = path.resolve(__dirname, "dist/client");
  template = readFileSync(path.join(clientDir, "index.html"), "utf-8");
  const entryPath = path.resolve(__dirname, "dist/server/entry-server.js");
  const mod = (await import(entryPath)) as { render: RenderFn };
  renderFn = mod.render;

  const server = http.createServer((req, res) => {
    const url = req.url ?? "/";
    const pathname = url.split("?")[0];
    const staticFile = contentPathFor(pathname, clientDir);
    if (staticFile && existsSync(staticFile) && statSync(staticFile).isFile()) {
      serveStatic(res, staticFile);
      return;
    }
    if (pathname.startsWith("/assets/")) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    if (pathname.startsWith("/api/") || pathname.startsWith("/manus-storage") || isFeedPath(pathname)) {
      proxyApi(req, res, url);
      return;
    }
    handleSsr(res, renderFn, template, url).catch(error => {
      console.error("[ssr]", error);
      res.writeHead(500, { "content-type": "text/plain" });
      res.end("Internal server error");
    });
  });
  server.listen(PORT, () => console.log(`CodeReport Global web (preview) running on http://localhost:${PORT}/`));
}

async function handleSsr(res: ServerResponse, renderFn: RenderFn, template: string, url: string): Promise<void> {
  const prefetch = createHttpPrefetch();
  const { html, dehydratedState, head } = await renderFn(url, prefetch);
  let doc = template;
  doc = doc.replace("<!--app-head-->", renderHead(head));
  doc = doc.replace("<!--app-html-->", html);
  const serialized = superjson.stringify(dehydratedState);
  doc = doc.replace("</body>", `<script>window.__RQ_STATE__=${serializeState(serialized)};</script></body>`);
  res.writeHead(head.notFound ? 404 : 200, { "content-type": "text/html; charset=utf-8" });
  res.end(doc);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
