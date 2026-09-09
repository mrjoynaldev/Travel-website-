import { getSupabase } from "@/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await Promise.race([
      getSupabase().from("sites").select("id").limit(1),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("database readiness probe timed out")), 5_000)),
    ]);
    const { error } = result;
    if (error) return Response.json({ ok: false, service: "sundarban-yatri-api", dependency: "database" }, { status: 503 });
    return Response.json({ ok: true, service: "sundarban-yatri-api", dependency: "database" });
  } catch {
    return Response.json({ ok: false, service: "sundarban-yatri-api", dependency: "database" }, { status: 503 });
  }
}
