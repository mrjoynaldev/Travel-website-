import type { Metadata } from "next";
import HireView from "@web/components/HireView";
import { getBusiness, getFaqs, getTours } from "@web/lib/catalogue";

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || "https://sundarbanyatri.com";

export const metadata: Metadata = {
  title: "Plan Your Trip — Get a Sundarban Tour Quote | Sundarban Yatri",
  description: "Tell us your dates, group size and interests. Get honest Sundarban tour options, safari guidance and a clear quote on WhatsApp or call.",
  alternates: { canonical: "/hire" },
  openGraph: {
    title: "Plan Your Sundarban Trip",
    description: "Get honest Sundarban tour options, safari guidance and a clear quote.",
    type: "website",
    url: `${siteUrl()}/hire`,
    siteName: "Sundarban Yatri",
    images: [{ url: `${siteUrl()}/og-default.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Plan Your Sundarban Trip",
    description: "Get honest Sundarban tour options, safari guidance and a clear quote.",
    images: [`${siteUrl()}/og-default.png`],
  },
};

export default async function HirePage() {
  const [tours, faqs, business] = await Promise.all([getTours(), getFaqs(), getBusiness()]);
  return <HireView tours={tours} faqs={faqs} business={business} />;
}
