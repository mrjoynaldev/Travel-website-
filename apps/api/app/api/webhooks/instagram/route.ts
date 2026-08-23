import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/supabase";

// Verify webhook (hub.challenge)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  const verifyToken = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN || "codereport-verify";
  if (mode === "subscribe" && token === verifyToken) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

// Handle comment events
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Instagram comments webhook: entry[].changes[].value {from, post_id, comment_id, text}
    const entries = body.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        if (change.field !== "comments" && change.field !== "live_comments") continue;
        const value = change.value;
        const commentId = value?.id || value?.comment_id;
        const text: string = value?.text || value?.message || "";
        const fromId: string = value?.from?.id || value?.from_id || "";
        const postId: string = value?.media?.id || value?.post_id || entry.id || "";
        if (!commentId || !text || !fromId) continue;

        // Find active automations for this post/media + platform
        const db = getSupabase();
        const { data: autos } = await db.from("automations").select("*").eq("is_active", true).eq("post_id", postId);
        if (!autos?.length) {
          // Also try without post filter (global keyword)
          const { data: globalAutos } = await db.from("automations").select("*").eq("is_active", true).is("post_id", null);
          if (!globalAutos?.length) continue;
          // Use global
          for (const auto of globalAutos) await handleAutomation(auto, { commentId, text, fromId, postId });
        } else {
          for (const auto of autos) await handleAutomation(auto, { commentId, text, fromId, postId });
        }
      }
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[webhook instagram] error", e);
    return NextResponse.json({ success: false }, { status: 200 });
  }
}

async function handleAutomation(auto: any, ctx: { commentId: string; text: string; fromId: string; postId: string }) {
  const db = getSupabase();
  // Keyword match (case-insensitive, contains)
  const keyword = String(auto.keyword || "").toLowerCase().trim();
  if (!keyword || !ctx.text.toLowerCase().includes(keyword)) return;

  // 1 per user per 24h check
  const since24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { data: recent } = await db.from("automation_logs").select("id").eq("commenter_id", ctx.fromId).eq("automation_id", auto.id).gte("created_at", since24h).limit(1);
  if (recent?.length) return;

  // 750/hour global check (approx)
  const sinceHour = new Date(Date.now() - 3600 * 1000).toISOString();
  const { count } = await db.from("automation_logs").select("id", { count: "exact", head: true }).gte("created_at", sinceHour).eq("status", "sent");
  if ((count ?? 0) >= 740) return; // leave headroom under 750

  // Follow check if required
  if (auto.follow_required) {
    try {
      const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN || process.env.INSTAGRAM_ACCESS_TOKEN;
      if (token && auto.platform === "instagram") {
        // Check via followers edge (paginated) — best effort
        const igId = process.env.FACEBOOK_IG_USER_ID;
        if (igId) {
          // For now, we rely on private reply inbox vs requests behavior; strict follow check requires business_discovery which is limited.
          // We log and proceed; admin can set follow_required false to allow Requests folder delivery.
          // Future: implement followers pagination if available.
        }
      }
    } catch {}
  }

  // 7-day window check is implicit (webhook is real-time, comment is new)

  // Queue log as queued, then send private reply with button after 3s
  const { data: log } = await db.from("automation_logs").insert({
    automation_id: auto.id,
    comment_id: ctx.commentId,
    commenter_id: ctx.fromId,
    platform: auto.platform,
    status: "queued",
  }).select("id").single();

  setTimeout(async () => {
    try {
      const platform = auto.platform as string;
      const dmText = String(auto.dm_template || "").replace("{name}", "").trim() || "Here’s your guide:";
      const buttonText = String(auto.button_text || "Read Full Guide").slice(0, 20);
      const buttonUrl = String(auto.button_url || "").trim();
      // Build message with button link managed by admin — for private reply, we send text + button URL as part of text (private reply is text-only, button is follow-up if user replies)
      // For Instagram private reply, message is text-only, but we include button URL as clickable link in text; for Facebook Page, we can use generic template with button
      let fullMessage = dmText;
      if (buttonUrl) fullMessage += `\n\n${buttonText}: ${buttonUrl}`;

      if (platform === "instagram") {
        const pageId = process.env.FACEBOOK_PAGE_ID;
        const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN || process.env.INSTAGRAM_ACCESS_TOKEN;
        if (!pageId || !token) throw new Error("Missing FB Page token");
        const res = await fetch(`https://graph.facebook.com/v26.0/${pageId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipient: { comment_id: ctx.commentId },
            message: { text: fullMessage },
            access_token: token,
          }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j?.error?.message || `IG private reply ${res.status}`);
        await db.from("automation_logs").update({ status: "sent" }).eq("id", log?.id);
      } else if (platform === "facebook") {
        const pageId = process.env.FACEBOOK_PAGE_ID;
        const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
        if (!pageId || !token) throw new Error("Missing FB token");
        const res = await fetch(`https://graph.facebook.com/v26.0/${pageId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipient: { comment_id: ctx.commentId },
            message: { text: fullMessage },
            access_token: token,
          }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j?.error?.message || `FB private reply ${res.status}`);
        await db.from("automation_logs").update({ status: "sent" }).eq("id", log?.id);
      }
    } catch (e: any) {
      await db.from("automation_logs").update({ status: "failed", error: String(e?.message || e).slice(0, 500) }).eq("id", log?.id);
    }
  }, 3000);
}
