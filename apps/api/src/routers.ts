import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { clearSessionCookie, createSessionToken, setSessionCookie } from "./_core/session";
import { SupabaseAuthError, signInWithPassword, signUp } from "./_core/supabaseAuth";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { aiRouter } from "./routers/aiRouter";
import { agentRouter } from "./routers/agentRouter";
import { blogRouter } from "./routers/blogRouter";
import { llmRouter } from "./routers/llmRouter";
import { studioRouter } from "./routers/studioRouter";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    signIn: publicProcedure
      .input(z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        try {
          const user = await signInWithPassword(input.email, input.password);
          const token = await createSessionToken({ openId: user.id, name: user.name, email: user.email });
          setSessionCookie(ctx.res, ctx.req, token);
          return { success: true as const, user };
        } catch (error) {
          if (error instanceof SupabaseAuthError) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: error.message });
          }
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign-in failed. Please try again." });
        }
      }),
    signUp: publicProcedure
      .input(z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(8), name: z.string().trim().max(80).optional() }))
      .mutation(async ({ ctx, input }) => {
        try {
          const result = await signUp(input.email, input.password, input.name || undefined);
          if (result.session) {
            const token = await createSessionToken({ openId: result.session.id, name: result.session.name, email: result.session.email });
            setSessionCookie(ctx.res, ctx.req, token);
            return { success: true as const, confirmationRequired: false, user: result.session };
          }
          return { success: true as const, confirmationRequired: true, user: null as null };
        } catch (error) {
          if (error instanceof SupabaseAuthError) {
            throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
          }
          throw new TRPCError({ code: "BAD_REQUEST", message: "Could not create your account. Please try again." });
        }
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      clearSessionCookie(ctx.res, ctx.req);
      return {
        success: true,
      } as const;
    }),
  }),

  blog: blogRouter,
  studio: studioRouter,
  ai: aiRouter,
  agent: agentRouter,
  llm: llmRouter,

});

export type AppRouter = typeof appRouter;
