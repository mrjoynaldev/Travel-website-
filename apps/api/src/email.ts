import { getSupabase } from "./supabase";

type DispatchResult = { attempted: number; delivered: number; skipped: boolean };
type PendingNotification = { id: string; recipient_email: string; subject: string; body_text: string };

function gmailConfigured(): boolean {
  return Boolean(
    process.env.GMAIL_CLIENT_ID &&
    process.env.GMAIL_CLIENT_SECRET &&
    process.env.GMAIL_REFRESH_TOKEN &&
    process.env.EMAIL_FROM,
  );
}

async function gmailAccessToken(): Promise<string> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GMAIL_CLIENT_ID!,
      client_secret: process.env.GMAIL_CLIENT_SECRET!,
      refresh_token: process.env.GMAIL_REFRESH_TOKEN!,
      grant_type: "refresh_token",
    }),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Gmail token exchange failed: ${response.status} ${text}`);
  }
  const payload = (await response.json()) as { access_token?: string };
  if (!payload.access_token) throw new Error("Gmail token exchange returned no access token.");
  return payload.access_token;
}

function buildRawMessage(notification: PendingNotification): string {
  const subject = `=?UTF-8?B?${Buffer.from(notification.subject, "utf8").toString("base64")}?=`;
  const body = Buffer.from(notification.body_text, "utf8").toString("base64");
  const headers = [
    `From: ${process.env.EMAIL_FROM}`,
    `To: ${notification.recipient_email}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="utf-8"',
    "Content-Transfer-Encoding: base64",
  ];
  return `${headers.join("\r\n")}\r\n\r\n${body}`;
}

async function dispatchViaGmail(notification: PendingNotification): Promise<string | null> {
  const accessToken = await gmailAccessToken();
  const raw = Buffer.from(buildRawMessage(notification), "utf8").toString("base64url");
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
    body: JSON.stringify({ raw }),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Gmail send failed: ${response.status} ${text}`);
  }
  const payload = (await response.json()) as { id?: string };
  return payload.id ?? null;
}

async function dispatchViaResend(notification: PendingNotification): Promise<string | null> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `codereport-${notification.id}`,
    },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [notification.recipient_email], subject: notification.subject, text: notification.body_text }),
  });
  const payload = await response.json().catch(() => ({} as { id?: string; message?: string }));
  if (!response.ok) throw new Error(String(payload.message ?? `Email provider returned ${response.status}`));
  return payload.id ?? null;
}

export async function dispatchPendingNotifications(siteId: string, postId?: string): Promise<DispatchResult> {
  const useResend = Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
  const useGmail = !useResend && gmailConfigured();
  if (!useResend && !useGmail) return { attempted: 0, delivered: 0, skipped: true };

  const db = getSupabase();
  let query = db
    .from("notification_outbox")
    .select("id, recipient_email, subject, body_text")
    .eq("site_id", siteId)
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(200);
  if (postId) query = query.eq("post_id", postId);
  const { data: pending, error } = await query;
  if (error) throw new Error("Could not read pending notification outbox records.");

  let delivered = 0;
  for (const notification of pending ?? []) {
    try {
      const providerMessageId = useResend
        ? await dispatchViaResend(notification)
        : await dispatchViaGmail(notification);
      await db.from("notification_outbox").update({ status: "sent", provider_message_id: providerMessageId, sent_at: new Date().toISOString(), last_error: null }).eq("id", notification.id);
      delivered += 1;
    } catch (dispatchError) {
      await db.from("notification_outbox").update({ status: "failed", last_error: dispatchError instanceof Error ? dispatchError.message : "Unknown email provider failure" }).eq("id", notification.id);
    }
  }
  return { attempted: pending?.length ?? 0, delivered, skipped: false };
}
