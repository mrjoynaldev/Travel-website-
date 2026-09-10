"use client";

import ErrorBoundary from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import AgentWorkspace from "@/admin-site/pages/AgentWorkspace";
import { StudioBranding, StudioPages } from "@/admin-site/pages/SiteManagement";
import StudioSections from "@/admin-site/pages/SiteSections";
import { StudioAIProviders } from "@/admin-site/pages/StudioAI";
import { StudioAutomations } from "@/admin-site/pages/StudioAutomations";
import StudioResearch from "@/admin-site/pages/StudioResearch";
import {
  StudioApiTokens,
  StudioDistribution,
  StudioSubscribers,
} from "@/admin-site/pages/StudioDeveloper";
import { StudioMcp } from "@/admin-site/pages/StudioMcp";
import { StudioEditor } from "@/admin-site/pages/StudioEditor";
import StudioLeads from "@/admin-site/pages/StudioLeads";
import {
  StudioBusiness,
  StudioCatalogFaqs,
  StudioCatalogTours,
} from "@/admin-site/pages/StudioCatalog";
import {
  StudioFoodMenu,
  StudioVideoReviews,
} from "@/admin-site/pages/StudioShowcase";
import { GravityEditor } from "@/admin-site/pages/GravityEditor";
import StudioPreview from "@/admin-site/pages/StudioPreview";
import {
  StudioAnalytics,
  StudioAudit,
  StudioCapabilities,
  StudioExport,
  StudioMedia,
  StudioModeration,
  StudioNotifications,
  StudioOverview,
  StudioPosts,
  StudioSettings,
  StudioTaxonomy,
  StudioTeam,
} from "@/admin-site/pages/Studio";

function resolveStudioView(pathname: string) {
  const base = pathname.replace(/^\/studio/, "").replace(/\/+$/, "");
  const parts = base.split("/").filter(Boolean);
  switch (parts[0]) {
    case "posts":
      if (parts[1] === "new") return StudioEditor;
      if (parts[1]) return StudioEditor;
      return StudioPosts;
    case "gravity":
      return GravityEditor;
    case "preview":
      return StudioPreview;
    case "media":
      return StudioMedia;
    case "taxonomy":
      return StudioTaxonomy;
    case "moderation":
      return StudioModeration;
    case "analytics":
      return StudioAnalytics;
    case "research":
      return StudioResearch;
    case "team":
      return StudioTeam;
    case "leads":
      return StudioLeads;
    case "catalog-tours":
      return StudioCatalogTours;
    case "catalog-faqs":
      return StudioCatalogFaqs;
    case "business":
      return StudioBusiness;
    case "reviews":
      return StudioVideoReviews;
    case "food-menu":
      return StudioFoodMenu;
    case "notifications":
      return StudioNotifications;
    case "ai":
      return StudioAIProviders;
    case "agent":
      return AgentWorkspace;
    case "automations":
      return StudioAutomations;
    case "settings":
      return StudioSettings;
    case "brand":
      return StudioBranding;
    case "pages":
      return StudioPages;
    case "sections":
      return StudioSections;
    case "capabilities":
      return StudioCapabilities;
    case "audit":
      return StudioAudit;
    case "export":
      return StudioExport;
    case "subscribers":
      return StudioSubscribers;
    case "api-tokens":
      return StudioApiTokens;
    case "mcp":
      return StudioMcp;
    case "distribution":
      return StudioDistribution;
    default:
      return StudioOverview;
  }
}

export default function StudioRoute() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading studio…</p>
      </div>
    );
  }

  const View = resolveStudioView(pathname);
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <View />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
