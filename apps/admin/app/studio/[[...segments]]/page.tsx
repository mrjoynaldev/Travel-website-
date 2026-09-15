import StudioRoute from "../route-client";

// Static export: every known Studio view prerenders as a shell; data loads
// in the browser. Unknown deep links (e.g. /studio/posts/<id>) also need
// the SPA shell so client-side routing can take over.
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
    // Deep links with ids need the SPA shell too — the catch-all renders
    // StudioRoute which resolves the view client-side via useRouteId().
    { segments: ["posts", "new"] },
    { segments: ["posts", ":id"] },
  ];
}

// Dynamic params (like :id) are not known at build time — let the SPA
// shell render for any unmatched /studio/* path so client routing works.
export const dynamicParams = true;

export default function StudioPage() {
  return <StudioRoute />;
}
