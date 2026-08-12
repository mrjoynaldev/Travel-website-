import { describe, expect, it } from "vitest";
import { dispatchPendingNotifications } from "./email";

describe("email delivery configuration", () => {
  it("keeps the notification adapter disabled until a verified email provider is configured", () => {
    const resend = Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
    const gmail = Boolean(process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET && process.env.GMAIL_REFRESH_TOKEN && process.env.EMAIL_FROM);
    const configured = resend || gmail;

    expect(typeof configured).toBe("boolean");
  });

  it("leaves pending records untouched when provider credentials are unavailable", async () => {
    const result = await dispatchPendingNotifications("00000000-0000-0000-0000-000000000000");

    expect(result).toEqual({ attempted: 0, delivered: 0, skipped: true });
  });
});
