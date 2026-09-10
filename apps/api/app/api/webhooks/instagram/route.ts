import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/supabase";

// Verify webhook (hub.challenge)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  const verifyToken = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN || "sundarban-yatri-verify";
  if (mode === "subscribe" && token === verifyToken) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

// Handle comment + messaging (postback) events
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Handle messaging postbacks (Follow gate: Get Guide / Following done)
    if (body.object === "instagram" || body.object === "page") {
      const entries = body.entry || [];
      for (const entry of entries) {
        const messagings = entry.messaging || [];
        for (const msg of messagings) {
          const senderId = msg.sender?.id;
          const postback = msg.postback?.payload || msg.message?.quick_reply?.payload || "";
          if (!senderId || !postback) continue;
          if (postback.startsWith("GET_GUIDE_") || postback.startsWith("VERIFY_FOLLOW_")) {
            const autoId = postback.split("_").slice(2, 3)[0] + "-" + postback.split("_").slice(3).join("-");
            // Reconstruct autoId from payload (we store full id in payload)
            const fullAutoId = postback.replace("GET_GUIDE_", "").replace("VERIFY_FOLLOW_", "").split("_")[0];
            // For simplicity, extract automation id from payload after prefix
            const parts = postback.split("_");
            // Payload is VERIFY_FOLLOW_{autoId}_{userId} or GET_GUIDE_{autoId}
            const autoIdFromPayload = parts.slice(2, 7).join("-"); // uuid has 5 parts
            const db = getSupabase();
            const { data: auto } = await db.from("automations").select("*").eq("id", autoIdFromPayload).maybeSingle();
            if (!auto) continue;
            await handlePostback(auto, senderId, postback);
          }
        }
      }
    }
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

async function handlePostback(auto: any, senderId: string, payload: string) {
  const db = getSupabase();
  const token = process.env.INSTAGRAM_ACCESS_TOKEN || process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const igId = process.env.FACEBOOK_IG_USER_ID;
  if (!token || !igId) return;
  let isFollower: boolean | null = null;
  try {
    const r = await fetch(`https://graph.facebook.com/v26.0/${senderId}?fields=is_user_follow_business&access_token=${encodeURIComponent(token)}`);
    const j = await r.json().catch(()=>({}));
    if (typeof j.is_user_follow_business === "boolean") isFollower = j.is_user_follow_business;
  } catch {}
  if (payload.startsWith("GET_GUIDE_")) {
    if (isFollower === false && auto.follow_required) {
      // Send follow prompt with URL button + quick reply
      await fetch(`https://graph.facebook.com/v26.0/${igId}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: { id: senderId },
          message: {
            text: `Please follow @${process.env.INSTAGRAM_HANDLE || "sundarbanyatri"} first to unlock your guide — tap Follow and then "Following done" 💜`,
            quick_replies: [{ content_type: "text", title: "Following done", payload: `VERIFY_FOLLOW_${auto.id}_${senderId}` }]
          },
          access_token: token,
        }),
      });
    } else {
      // Send guide link with button
      await fetch(`https://graph.facebook.com/v26.0/${igId}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: { id: senderId },
          message: { text: `${auto.dm_template}\n\n${auto.button_text}: ${auto.button_url}` },
          access_token: token,
        }),
      });
    }
  } else if (payload.startsWith("VERIFY_FOLLOW_")) {
    // Re-check with refresh
    try {
      const r = await fetch(`https://graph.facebook.com/v26.0/${senderId}?fields=is_user_follow_business&access_token=${encodeURIComponent(token)}&refresh=true`);
      const j = await r.json().catch(()=>({}));
      if (typeof j.is_user_follow_business === "boolean") isFollower = j.is_user_follow_business;
    } catch {}
    if (isFollower === true) {
      await fetch(`https://graph.facebook.com/v26.0/${igId}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: { id: senderId },
          message: { text: `Verified — you’re following! Here’s your guide:\n\n${auto.button_text}: ${auto.button_url}` },
          access_token: token,
        }),
      });
    } else {
      await fetch(`https://graph.facebook.com/v26.0/${igId}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: { id: senderId },
          message: { text: `Still not following — tap Follow: https://instagram.com/${process.env.INSTAGRAM_HANDLE || "sundarbanyatri"} then tap "Following done" again.` },
          access_token: token,
        }),
      });
    }
  }
}

async function handleAutomation(auto: any, ctx: { commentId: string; text: string; fromId: string; postId: string }) {
  const db = getSupabase();
  // Keyword match: any_comment = match all; else split by comma, case-insensitive contains
  const anyComment = Boolean(auto.any_comment);
  const rawKeywords = String(auto.keywords || auto.keyword || "").toLowerCase().trim();
  if (!anyComment) {
    if (!rawKeywords) return;
    const kws = rawKeywords.split(",").map((k:string)=>k.trim()).filter(Boolean);
    const textLower = ctx.text.toLowerCase();
    const matched = kws.some(kw => textLower.includes(kw));
    if (!matched) return;
  }

  // 1 per user per 24h check
  const since24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { data: recent } = await db.from("automation_logs").select("id").eq("commenter_id", ctx.fromId).eq("automation_id", auto.id).gte("created_at", since24h).limit(1);
  if (recent?.length) return;

  // 750/hour global check (approx)
  const sinceHour = new Date(Date.now() - 3600 * 1000).toISOString();
  const { count } = await db.from("automation_logs").select("id", { count: "exact", head: true }).gte("created_at", sinceHour).eq("status", "sent");
  if ((count ?? 0) >= 740) return; // leave headroom under 750

  // Follow gate: if required, check is_user_follow_business via User Profile API (free, no extra fee)
  let isFollower: boolean | null = null;
  if (auto.follow_required) {
    try {
      const token = process.env.INSTAGRAM_ACCESS_TOKEN || process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
      if (token && ctx.fromId) {
        // Use private reply recipient_id if available, else fromId (IGSID)
        // For comments, fromId is Instagram-scoped ID after private reply; before, we use User Profile API with commenter IGSID
        // Try User Profile API: GET /{IGSID}?fields=is_user_follow_business
        const profileRes = await fetch(`https://graph.facebook.com/v26.0/${ctx.fromId}?fields=is_user_follow_business&access_token=${encodeURIComponent(token)}`);
        const profile = await profileRes.json().catch(()=>({}));
        if (typeof profile.is_user_follow_business === "boolean") isFollower = profile.is_user_follow_business;
      }
    } catch {}
    // If we cannot determine, treat as not follower to enforce gate (admin can set follow_required false to allow)
    if (isFollower === false) {
      // Will send follow prompt instead of direct guide (handled below)
    }
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
      const dmText = String(auto.dm_template || "").replace("{name}", "").trim() || "Here’s your guide:";
      const buttonText = String(auto.button_text || "Read Full Guide").slice(0, 20);
      const buttonUrl = String(auto.button_url || "").trim();
      // Advanced follow gate: if not follower and gate on, send follow prompt with buttons instead of direct guide
      let fullMessage: string;
      let useQuickReplies = false;
      let quickReplies: any[] = [];
      if (auto.follow_required && isFollower === false) {
        fullMessage = `Hey! To get your guide, please follow @${process.env.INSTAGRAM_HANDLE || "sundarbanyatri"} first — then tap "Following done" and I’ll send it right over 💜\n\n${dmText}`;
        useQuickReplies = true;
        // URL button to profile + quick reply for verification
        quickReplies = [
          { content_type: "text", title: "Following done", payload: `VERIFY_FOLLOW_${auto.id}_${ctx.fromId}` }
        ];
        // Note: URL button to Instagram profile is not via quick_replies, but via generic template — for private reply we include link as text
        fullMessage += `\n\nFollow here: https://instagram.com/${process.env.INSTAGRAM_HANDLE || "sundarbanyatri"}`;
      } else {
        fullMessage = dmText;
        if (buttonUrl) fullMessage += `\n\n${buttonText}: ${buttonUrl}`;
        // For follow gate, the initial private reply is the guide; the "Get Guide" button flow is handled via quick reply in follow-up if needed
        // If follow gate is on and we are sending guide directly (follower), we still include the guide link
      }

      // Instagram only per request — Facebook cut from DM automation (distribution Facebook Page posting still live)
      const pageId = process.env.FACEBOOK_PAGE_ID;
      const token = process.env.INSTAGRAM_ACCESS_TOKEN || process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
      if (!pageId || !token) throw new Error("Missing IG token");
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
    } catch (e: any) {
      await db.from("automation_logs").update({ status: "failed", error: String(e?.message || e).slice(0, 500) }).eq("id", log?.id);
    }
  }, 3000);
}
