import { TRPCError } from "@trpc/server";
import { createSign } from "node:crypto";
import { z } from "zod";
import { assertRole } from "../blog";
import { protectedProcedure, router } from "../_core/trpc";

/**
 * Content-research + live-traffic router.
 *
 * - `ga`     → Google Analytics 4 Data API (service-account JWT, no SDK needed)
 * - `trends` → Google Trends daily trending searches (public RSS, keyless)
 * - `hn`     → Hacker News front page / search (Algolia public API, keyless)
 */

const GA_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const GA_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GA_REPORT_URL = (propertyId: string) =>
  `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;

function gaConfig() {
  const propertyId = process.env.GA_PROPERTY_ID;
  const clientEmail = process.env.GA_CLIENT_EMAIL;
  const privateKey = process.env.GA_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!propertyId || !clientEmail || !privateKey) return null;
  return { propertyId, clientEmail, privateKey };
}

let gaAccessToken: { token: string; expiresAt: number } | null = null;

async function gaAuthorize(config: { clientEmail: string; privateKey: string }) {
  if (gaAccessToken && Date.now() < gaAccessToken.expiresAt - 60_000) {
    return gaAccessToken.token;
  }
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const claims = Buffer.from(
    JSON.stringify({
      iss: config.clientEmail,
      scope: GA_SCOPE,
      aud: GA_TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  ).toString("base64url");
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  let signature: string;
  try {
    signature = signer.sign(config.privateKey).toString("base64url");
  } catch {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message:
        "The GA_PRIVATE_KEY is invalid. Re-copy it from the service-account JSON file.",
    });
  }
  const response = await fetch(GA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claims}.${signature}`,
    }),
  });
  const payload: any = await response.json().catch(() => null);
  if (!response.ok || !payload?.access_token) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Google authorization failed (${response.status}). Make sure ${config.clientEmail} was added as a Viewer in GA4 property access.`,
    });
  }
  gaAccessToken = { token: payload.access_token, expiresAt: Date.now() + (payload.expires_in ?? 3600) * 1000 };
  return gaAccessToken.token;
}

async function gaRunReport(propertyId: string, report: Record<string, unknown>) {
  const config = gaConfig();
  if (!config) return null;
  const token = await gaAuthorize(config);
  const response = await fetch(`${GA_REPORT_URL(propertyId)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(report),
  });
  const payload: any = await response.json().catch(() => null);
  if (!response.ok) {
    const reason = payload?.error?.message || `HTTP ${response.status}`;
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `GA4 report failed: ${reason}` });
  }
  return payload;
}

function rowsToObjects(payload: any) {
  const headers = (payload?.dimensionHeaders ?? []).map((h: any) => h.name);
  const metrics = (payload?.metricHeaders ?? []).map((m: any) => m.name);
  return (payload?.rows ?? []).map((row: any) => {
    const out: Record<string, string> = {};
    row.dimensionValues?.forEach((v: any, i: number) => { out[headers[i]] = v.value; });
    row.metricValues?.forEach((v: any, i: number) => { out[metrics[i]] = v.value; });
    return out;
  });
}

const actor = async (ctx: any) => ctx.user;

export const researchRouter = router({
  status: protectedProcedure.query(async ({ ctx }) => {
    await actor(ctx);
    const config = gaConfig();
    return {
      googleAnalytics: Boolean(config),
      propertyId: config?.propertyId ?? null,
      clientEmail: config?.clientEmail ?? null,
      trends: true,
      hackerNews: true,
    };
  }),

  gaOverview: protectedProcedure
    .input(z.object({ days: z.number().int().min(1).max(90).default(28) }))
    .query(async ({ ctx, input }) => {
      await actor(ctx);
      const config = gaConfig();
      if (!config) {
        return { configured: false as const, reason: "Set GA_PROPERTY_ID, GA_CLIENT_EMAIL and GA_PRIVATE_KEY on the API server." };
      }
      const range = { startDate: `${input.days}daysAgo`, endDate: "today" };
      try {
        const [totals, pages, countries, sources] = await Promise.all([
          gaRunReport(config.propertyId, {
            dateRanges: [range],
            metrics: [
              { name: "activeUsers" }, { name: "sessions" },
              { name: "screenPageViews" }, { name: "engagementRate" },
              { name: "averageSessionDuration" },
            ],
          }),
          gaRunReport(config.propertyId, {
            dateRanges: [range],
            dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
            metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
            orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
            limit: 10,
          }),
          gaRunReport(config.propertyId, {
            dateRanges: [range],
            dimensions: [{ name: "country" }],
            metrics: [{ name: "activeUsers" }],
            orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
            limit: 8,
          }),
          gaRunReport(config.propertyId, {
            dateRanges: [range],
            dimensions: [{ name: "sessionSource" }],
            metrics: [{ name: "sessions" }],
            orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
            limit: 8,
          }),
        ]);
        const totalsRow = totals?.rows?.[0]?.metricValues ?? [];
        return {
          configured: true as const,
          days: input.days,
          totals: {
            activeUsers: Number(totalsRow[0]?.value ?? 0),
            sessions: Number(totalsRow[1]?.value ?? 0),
            pageviews: Number(totalsRow[2]?.value ?? 0),
            engagementRate: Number(totalsRow[3]?.value ?? 0),
            avgSessionSeconds: Number(totalsRow[4]?.value ?? 0),
          },
          topPages: rowsToObjects(pages).map((r: any) => ({
            path: r.pagePath, title: r.pageTitle,
            views: Number(r.screenPageViews ?? 0), users: Number(r.activeUsers ?? 0),
          })),
          countries: rowsToObjects(countries).map((r: any) => ({ country: r.country, users: Number(r.activeUsers ?? 0) })),
          sources: rowsToObjects(sources).map((r: any) => ({ source: r.sessionSource, sessions: Number(r.sessions ?? 0) })),
        };
      } catch (error: any) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `GA4 request failed: ${error?.message ?? error}` });
      }
    }),

  trends: protectedProcedure
    .input(z.object({ geo: z.string().trim().length(2).default("US") }))
    .query(async ({ ctx, input }) => {
      await actor(ctx);
      const geo = input.geo.toUpperCase();
      const response = await fetch(
        `https://trends.google.com/trending/rss?geo=${geo}`,
        { headers: { "User-Agent": "Mozilla/5.0 (compatible; SundarbanYatri/1.0)" } },
      );
      if (!response.ok) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Google Trends returned HTTP ${response.status} for geo "${geo}".` });
      }
      const xml = await response.text();
      const items: Array<{ title: string; traffic: string; news: string[] }> = [];
      const itemBlocks = xml.split("<item>").slice(1);
      for (const block of itemBlocks) {
        const title = block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)?.[1]?.trim();
        if (!title) continue;
        const traffic = block.match(/<ht:approx_traffic>([\s\S]*?)<\/ht:approx_traffic>/)?.[1]?.trim() ?? "";
        const news: string[] = [];
        const newsRegex = /<ht:news_item>[\s\S]*?<ht:news_item_title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/ht:news_item_title>/g;
        let match: RegExpExecArray | null;
        while ((match = newsRegex.exec(block)) && news.length < 3) news.push(match[1].trim());
        items.push({ title, traffic, news });
      }
      return { geo, fetchedAt: new Date().toISOString(), items };
    }),

  hackerNews: protectedProcedure
    .input(z.object({ query: z.string().trim().max(120).optional(), limit: z.number().int().min(1).max(30).default(20) }))
    .query(async ({ ctx, input }) => {
      await actor(ctx);
      const url = input.query
        ? `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(input.query)}&tags=story&hitsPerPage=${input.limit}`
        : `https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=${input.limit}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Hacker News returned HTTP ${response.status}.` });
      }
      const payload: any = await response.json();
      return {
        fetchedAt: new Date().toISOString(),
        stories: (payload.hits ?? []).map((hit: any) => ({
          objectID: hit.objectID,
          title: hit.title ?? hit.story_title ?? "",
          url: hit.url ?? hit.story_url ?? `https://news.ycombinator.com/item?id=${hit.objectID}`,
          points: hit.points ?? 0,
          comments: hit.num_comments ?? 0,
          createdAt: hit.created_at ?? "",
        })),
      };
    }),
});
