#!/usr/bin/env node
/**
 * Seed the live database from the website's bundled fallback data so the
 * Studio manages the same content the public site shows.
 *
 * Sources (single source of truth, imported — never duplicated here):
 *   apps/website/src/lib/travel-data.ts  → TOURS, TOUR_DETAILS, FAQS
 *
 * Targets (canonical site = oldest active site, same rule as the public API):
 *   tours (upsert on site_id+slug) · faqs (insert-if-missing by question)
 *
 * Idempotent — safe to re-run any time.
 *
 *   set -a; source apps/api/.env; set +a
 *   node --experimental-strip-types --no-warnings scripts/seed-catalog.mjs
 *
 * Requires in apps/api/.env: VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 */
import { createClient } from "@supabase/supabase-js";
import {
  BOAT_IMAGE,
  FAQS,
  HERO_IMAGE,
  SAFARI_DEFAULT,
  SAFARI_IMAGE,
  TOUR_DETAILS,
  TOURS,
  TRUST_FEATURES,
} from "../apps/website/src/lib/travel-data.ts";

const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (use apps/api/.env).");
  process.exit(1);
}
const db = createClient(url, serviceKey, { auth: { persistSession: false } });

// Canonical site = oldest active site (mirrors publicSiteOrThrow in blogRouter).
const { data: site, error: siteError } = await db
  .from("sites")
  .select("id, organization_id, name, slug")
  .eq("status", "active")
  .order("created_at", { ascending: true })
  .limit(1)
  .maybeSingle();
if (siteError || !site) throw new Error(`Could not resolve canonical site: ${siteError?.message}`);
console.log(`Seeding into: ${site.name} (${site.slug}) org=${site.organization_id.slice(0, 8)} site=${site.id.slice(0, 8)}`);

// ——— Tours (upsert by site_id+slug) ———
const tourRows = TOURS.map((tour, i) => ({
  organization_id: site.organization_id,
  site_id: site.id,
  slug: tour.slug,
  title: tour.title,
  duration: tour.duration || "",
  days: tour.days ?? 1,
  category: tour.group || "",
  summary: tour.summary || "",
  image_url: tour.image || null,
  featured: tour.featured ?? i === 0,
  price_note: tour.priceNote || null,
  best_for: tour.bestFor || null,
  detail: TOUR_DETAILS[tour.slug] ?? {},
  sort_order: i,
  status: "published",
}));
const { error: tourError } = await db
  .from("tours")
  .upsert(tourRows, { onConflict: "site_id,slug" });
if (tourError) throw new Error(`Tours upsert failed: ${tourError.message}`);
console.log(`tours: upserted ${tourRows.length} (${tourRows.map((t) => t.slug).join(", ")})`);

// ——— FAQs (insert only questions that are not already present) ———
const { data: existing, error: faqReadError } = await db
  .from("faqs")
  .select("question")
  .eq("site_id", site.id);
if (faqReadError) throw new Error(`FAQs read failed: ${faqReadError.message}`);
const known = new Set((existing ?? []).map((f) => f.question.trim().toLowerCase()));
const missing = FAQS.filter((f) => !known.has(f.q.trim().toLowerCase()));
if (missing.length) {
  const { error: faqError } = await db.from("faqs").insert(
    missing.map((f, i) => ({
      organization_id: site.organization_id,
      site_id: site.id,
      question: f.q,
      answer: f.a,
      sort_order: (existing ?? []).length + i,
      status: "published",
    })),
  );
  if (faqError) throw new Error(`FAQs insert failed: ${faqError.message}`);
}
console.log(`faqs: ${missing.length} inserted, ${FAQS.length - missing.length} already present`);

// ——— Business contact email: keep the .com domain consistent ———
const { data: settings } = await db
  .from("site_settings")
  .select("contact")
  .eq("site_id", site.id)
  .maybeSingle();
const contact = settings?.contact ?? {};
if (contact.email === "hello@sundarbanyatra.in") {
  const { error: contactError } = await db
    .from("site_settings")
    .update({ contact: { ...contact, email: "hello@sundarbanyatri.com" }, updated_at: new Date().toISOString() })
    .eq("site_id", site.id);
  if (contactError) throw new Error(`Contact email fix failed: ${contactError.message}`);
  console.log("contact: email updated to hello@sundarbanyatri.com");
} else {
  console.log(`contact: left as-is (${contact.email ?? "none"})`);
}

// ——— Brand kit: hero background + copy (fill only what is missing) ———
const { data: brandRow } = await db
  .from("site_settings")
  .select("brand")
  .eq("site_id", site.id)
  .maybeSingle();
const brand = brandRow?.brand ?? {};
const heroDefaults = {
  heroMediaType: "image",
  heroImageUrl: HERO_IMAGE,
  heroVideoUrl: "",
  heroEyebrow: "Sundarban Travel • Tours • Guides",
  heroTitle: "Plan Your Sundarban Journey with Confidence",
  heroSubtitle: "Discover mangrove waterways, wildlife, villages and memorable boat journeys — with practical guides and thoughtfully planned Sundarban tours.",
  safariImageUrl: SAFARI_IMAGE,
  safariTitle: SAFARI_DEFAULT.title,
  safariText: SAFARI_DEFAULT.text,
  aboutImageUrl: BOAT_IMAGE,
};
const heroArrays = {
  safariPoints: SAFARI_DEFAULT.points,
  trustItems: TRUST_FEATURES.map(({ icon, title, desc }) => ({ icon, title, desc })),
};
const heroPatch = {};
for (const [key, value] of Object.entries(heroDefaults)) {
  if (typeof brand[key] !== "string" || !brand[key].trim()) heroPatch[key] = value;
}
for (const [key, value] of Object.entries(heroArrays)) {
  if (!Array.isArray(brand[key]) || !brand[key].length) heroPatch[key] = value;
}
if (Object.keys(heroPatch).length) {
  const { error: brandError } = await db
    .from("site_settings")
    .update({ brand: { ...brand, ...heroPatch }, updated_at: new Date().toISOString() })
    .eq("site_id", site.id);
  if (brandError) throw new Error(`Brand hero seed failed: ${brandError.message}`);
  console.log(`brand: hero defaults seeded (${Object.keys(heroPatch).join(", ")})`);
} else {
  console.log("brand: hero already customized — left as-is");
}

console.log("Done — Studio catalogue now manages the live content.");
