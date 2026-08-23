import type { Metadata } from "next";
import HireView from "@web/components/HireView";

export const metadata: Metadata = {
  title: "Hire — Fix errors fast with AI | CodeReport Global",
  description: "Need a bug fixed, a landing page, or an automation? I build and fix with AI — fast, no fluff. See services, pricing, and contact.",
  alternates: { canonical: "/hire" },
  openGraph: {
    title: "Hire — Fix errors fast with AI",
    description: "Need a bug fixed, a landing page, or an automation? I build and fix with AI — fast.",
    type: "website",
    url: "/hire",
    siteName: "CodeReport Global",
  },
};

export default function HirePage() {
  return <HireView />;
}
