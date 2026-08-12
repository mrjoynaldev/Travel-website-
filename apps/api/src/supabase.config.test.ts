import { describe, expect, it } from "vitest";

describe("Supabase configuration", () => {
  it("authenticates a lightweight server-side REST metadata request", async () => {
    const url = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    expect(url).toMatch(/^https:\/\/[a-z0-9-]+\.supabase\.co$/i);
    expect(serviceRoleKey).toBeTruthy();

    const response = await fetch(`${url}/rest/v1/`, {
      headers: {
        apikey: serviceRoleKey!,
        Authorization: `Bearer ${serviceRoleKey!}`,
      },
    });

    expect(response.status).not.toBe(401);
    expect(response.status).not.toBe(403);
    expect(response.status).toBeLessThan(500);
  });

  it("validates the project-administration credential against Supabase project metadata", async () => {
    const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
    const projectRef = new URL(process.env.VITE_SUPABASE_URL!).hostname.split(".")[0];

    expect(accessToken).toBeTruthy();
    expect(projectRef).toMatch(/^[a-z0-9]+$/i);

    const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}`, {
      headers: { Authorization: `Bearer ${accessToken!}` },
    });

    expect(response.status).toBe(200);
  });
});
