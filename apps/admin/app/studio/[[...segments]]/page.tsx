import StudioRoute from "../route-client";

// Static export: every known Studio view prerenders as a shell; data loads
// in the browser. Unknown deep links (e.g. /studio/posts/<id>) fall through
// to /studio/index.html via the Firebase rewrite and resolve client-side.
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
    // Deep links with ids (e.g. /studio/posts/<id>) fall through to the
    // /studio.html shell via the hosting rewrite and resolve client-side,
    // but the id-less "new post" route can and should prerender directly.
    { segments: ["posts", "new"] },
  ];
}

export default function StudioPage() {
  return <StudioRoute />;
}
