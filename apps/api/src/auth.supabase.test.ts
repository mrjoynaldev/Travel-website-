import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { COOKIE_NAME } from "@shared/const";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

const { SupabaseAuthError, signInWithPassword, signUp } = vi.hoisted(() => {
  class SupabaseAuthError extends Error {
    errorCode?: string;
    constructor(message: string, errorCode?: string) {
      super(message);
      this.name = "SupabaseAuthError";
      this.errorCode = errorCode;
    }
  }
  return { SupabaseAuthError, signInWithPassword: vi.fn(), signUp: vi.fn() };
});

vi.mock("./_core/supabaseAuth", () => ({
  SupabaseAuthError,
  signInWithPassword,
  signUp,
}));

function createContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    apiToken: null,
    req: new Request("http://localhost", { headers: { "x-forwarded-proto": "https" } }),
    resHeaders: new Headers(),
  };
  return { ctx };
}

const identity = { id: "qa-supabase-user-1", email: "qa@example.test", name: "QA Admin" };

describe("auth.supabase", () => {
  beforeEach(() => {
    signInWithPassword.mockReset();
    signUp.mockReset();
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("signs in with Supabase credentials and sets the session cookie", async () => {
    signInWithPassword.mockResolvedValue(identity);
    const { ctx } = createContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.signIn({ email: "QA@Example.test", password: "hunter2hunter2" });

    expect(signInWithPassword).toHaveBeenCalledWith("qa@example.test", "hunter2hunter2");
    expect(result.success).toBe(true);
    expect(result.user).toMatchObject({ id: identity.id, email: identity.email });
    const cookie = ctx.resHeaders.get("Set-Cookie");
    expect(cookie).toBeDefined();
    expect(cookie).toContain(`${COOKIE_NAME}=`);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=None");
    expect(cookie).toContain("Path=/");
  });

  it("rejects invalid credentials with UNAUTHORIZED", async () => {
    signInWithPassword.mockRejectedValue(new SupabaseAuthError("Invalid email or password.", "invalid_credentials"));
    const { ctx } = createContext();
    const caller = appRouter.createCaller(ctx);

    const error = await caller.auth.signIn({ email: "qa@example.test", password: "wrongpass123" }).catch(e => e);
    expect(error.code).toBe("UNAUTHORIZED");
    expect(error.message).toBe("Invalid email or password.");
  });

  it("signs up and reports when email confirmation is required", async () => {
    signUp.mockResolvedValue({ user: identity, session: null });
    const { ctx } = createContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.signUp({ email: "qa@example.test", password: "longenough1", name: "QA Admin" });

    expect(signUp).toHaveBeenCalledWith("qa@example.test", "longenough1", "QA Admin");
    expect(result.confirmationRequired).toBe(true);
    expect(result.user).toBeNull();
    expect(ctx.resHeaders.get("Set-Cookie")).toBeNull();
  });

  it("signs up and signs in immediately when the project auto-confirms email", async () => {
    signUp.mockResolvedValue({ user: identity, session: identity });
    const { ctx } = createContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.signUp({ email: "qa@example.test", password: "longenough1" });

    expect(result.confirmationRequired).toBe(false);
    expect(result.user?.id).toBe(identity.id);
    expect(ctx.resHeaders.get("Set-Cookie")).toContain(`${COOKIE_NAME}=`);
  });

  it("returns the current user from auth.me", async () => {
    const { ctx } = createContext();
    const caller = appRouter.createCaller({ ...ctx, user: { id: 1, openId: identity.id, name: identity.name, email: identity.email, loginMethod: "supabase", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() } } as TrpcContext);    const me = await caller.auth.me();
    expect(me?.openId).toBe(identity.id);
  });
});
