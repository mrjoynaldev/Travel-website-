import { existsSync, readFileSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import superjson from "superjson";
import { createHttpPrefetch } from "../src/ssr/httpPrefetch";
import { MIME_TYPES, renderHead, serializeState } from "../src/ssr/html";

const CLIENT_DIR = path.resolve(process.cwd(), "dist/client");

function contentPathFor(urlPath: string): string | null {
  const decoded = decodeURIComponent(urlPath);
  const full = path.normalize(path.join(CLIENT_DIR, decoded));
  if (!full.startsWith(CLIENT_DIR)) return null;
  return full;
}

function serveStatic(res: ServerResponse, filePath: string): void {
  const ext = path.extname(filePath).toLowerCase();
  res.statusCode = 200;
  res.setHeader("content-type", MIME_TYPES[ext] || "application/octet-stream");
  res.setHeader("cache-control", "public, max-age=31536000, immutable");
  res.end(readFileSync(filePath));
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = req.url ?? "/";
  const pathname = url.split("?")[0];

  if (pathname.startsWith("/assets/")) {
    const filePath = contentPathFor(pathname);
    if (filePath && existsSync(filePath)) {
      serveStatic(res, filePath);
      return;
    }
    res.statusCode = 404;
    res.end("Not found");
    return;
  }

  if (pathname.startsWith("/api/")) {
    res.statusCode = 404;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  const templatePath = path.join(CLIENT_DIR, "index.html");
  if (!existsSync(templatePath)) {
    res.statusCode = 500;
    res.setHeader("content-type", "text/plain");
    res.end("Client bundle not found. Run the web build first.");
    return;
  }

  const proto = req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
  const requestUrl = `${proto}://${host}${url}`;

  try {
    const prefetch = createHttpPrefetch();
    const { render } = await import("../dist/server/entry-server.js");
    const { html, dehydratedState, head } = await render(requestUrl, prefetch);

    let template = readFileSync(templatePath, "utf-8");
    template = template.replace("<!--app-head-->", renderHead(head));
    template = template.replace("<!--app-html-->", html);
    const serialized = superjson.stringify(dehydratedState);
    template = template.replace("</body>", `<script>window.__RQ_STATE__=${serializeState(serialized)};</script></body>`);

    res.statusCode = 200;
    res.setHeader("content-type", "text/html; charset=utf-8");
    res.setHeader("cache-control", "public, s-maxage=300, stale-while-revalidate=600");
    res.end(template);
  } catch (error) {
    console.error("[ssr] render failed for", url, error);
    res.statusCode = 500;
    res.setHeader("content-type", "text/plain");
    res.end("Internal server error");
  }
}
