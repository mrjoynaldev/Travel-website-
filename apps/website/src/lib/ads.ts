/**
 * Adsterra monetization config (user website only).
 *
 * Placement follows Adsterra's official publisher guidance:
 * - Social Bar: single lightweight script before </body>, all pages, rotates
 *   its 5 sub-formats itself and ships its own close buttons.
 * - Popunder: needs no page space; official guidance says align it with user
 *   behavior (after click / content navigation), never on entry.
 * - Smartlink: attach to a clearly-labeled element only — never to navigation,
 *   CTAs, citations, or purchase/lead actions (official limitation).
 *
 * Clean-UX guards live in <AdsManager />: delayed/idle loading (no LCP hit),
 * engagement gating + 24h frequency cap for popunder, DNT + admin opt-outs,
 * and /hire exclusion so lead conversion is never interrupted.
 */

export const ADS = {
  enabled: process.env.NEXT_PUBLIC_ADS_ENABLED !== "0",
  socialBarSrc:
    process.env.NEXT_PUBLIC_ADS_SOCIAL_BAR_SRC ||
    "https://wrenlull.com/bc/75/a6/bc75a68889ba64d96cf0873978b32b01.js",
  popunderSrc:
    process.env.NEXT_PUBLIC_ADS_POPUNDER_SRC ||
    "https://wrenlull.com/ec/3b/f9/ec3bf9821a3738612c0241f8919a36d6.js",
  smartlinkUrl:
    process.env.NEXT_PUBLIC_ADS_SMARTLINK_URL ||
    "https://wrenlull.com/vk6k61dju4?key=ca18f84300a969f749f54160a5f813c5",
  // Social Bar loads after browser idle + this delay (ms) — keeps LCP/INP clean.
  socialBarDelayMs: 4000,
  // Popunder arms only after scroll depth OR dwell time (official: after behavior).
  popunderScrollDepth: 0.5,
  popunderDwellMs: 45000,
  // Max one popunder per user per window (ms). Official dashboard frequency
  // still applies on top; this is our own stricter, irritation-first cap.
  popunderCapMs: 24 * 60 * 60 * 1000,
  // Never arm popunder here (lead + utility pages).
  popunderBlockedPrefixes: ["/hire"],
} as const;

export const SMARTLINK_URL = ADS.smartlinkUrl;
