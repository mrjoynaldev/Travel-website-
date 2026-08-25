import type { Metadata } from "next";
import HireView from "@web/components/HireView";

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || "https://codereportglobal.indevs.in";

export const metadata: Metadata = {
  title: "Hire — Fix errors fast with AI | CodeReport Global",
  description: "Need a bug fixed, a landing page, or an automation? I build and fix with AI — fast, no fluff. See services, pricing, and contact.",
  alternates: { canonical: "/hire" },
  openGraph: {
    title: "Hire — Fix errors fast with AI",
    description: "Need a bug fixed, a landing page, or an automation? I build and fix with AI — fast.",
    type: "website",
    url: `${siteUrl()}/hire`,
    siteName: "CodeReport Global",
    images: [{ url: `${siteUrl()}/og-default.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hire — Fix errors fast with AI",
    description: "Need a bug fixed, a landing page, or an automation? I build and fix with AI — fast.",
    images: [`${siteUrl()}/og-default.png`],
  },
};

export default function HirePage() {
  return <HireView />;
}
