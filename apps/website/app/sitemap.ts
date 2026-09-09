import type { MetadataRoute } from "next";
import { getTours } from "@web/lib/catalogue";

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || "https://sundarbanyatra.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl().replace(/\/$/, "");
  const staticRoutes = ["", "/tours", "/hire", "/about", "/contact", "/archive"];
  const entries: MetadataRoute.Sitemap = staticRoutes.map((p) => ({
    url: `${base}${p || "/"}`,
    lastModified: new Date(),
    changeFrequency: p === "" ? "daily" : "weekly",
    priority: p === "" ? 1 : 0.8,
  }));
  const tours = await getTours();
  for (const t of tours) entries.push({ url: `${base}/tours/${t.slug}`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 });
  return entries;
}
