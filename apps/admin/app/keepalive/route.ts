import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const api = (process.env.API_URL || "https://codereportglobal-backend.onrender.com").replace(/\/+$/, "");
  let status = 502;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${api}/healthz`, {
        cache: "no-store",
        headers: { "user-agent": "vercel-cron-keep-alive" },
      });
      status = res.status;
      if (status >= 200 && status < 500) break;
    } catch {
      status = 502;
    }
    if (attempt < 2) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
  }
  return NextResponse.json(
    { ok: status < 500, status },
    { status: status < 500 ? 200 : 502, headers: { "x-keep-alive-source": "route" } }
  );
}