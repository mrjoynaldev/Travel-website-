import StudioRoute from "../route-client";

// Static export: every known Studio view prerenders as a shell; data loads
// in the browser. Deep links with IDs (e.g. /studio/posts/<id>) are handled
// by the Vercel rewrite in vercel.json, which serves the nearest prerendered
// shell and lets client-side routing take over.
export function generateStaticParams() {
  const views = [
    "posts",
    "gravity",
    "preview",
    "media",
    "taxonomy",
    "moderation",
    "analytics",
    "research",
    "team",
    "leads",
    "catalog-tours",
    "catalog-faqs",
    "reviews",
    "food-menu",
    "business",
    "notifications",
    "ai",
    "agent",
    "automations",
    "settings",
    "brand",
    "pages",
    "sections",
    "capabilities",
    "audit",
    "export",
    "subscribers",
    "api-tokens",
    "mcp",
    "distribution",
  ];
  return [
    { segments: [] },
    ...views.map(view => ({ segments: [view] })),
    { segments: ["posts", "new"] },
  ];
}

export default function StudioPage() {
  return <StudioRoute />;
}
