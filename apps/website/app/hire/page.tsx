import type { Metadata } from "next";
import HireView from "@web/components/HireView";
import { getBusiness, getFaqs, getTours } from "@web/lib/catalogue";

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || "https://sundarbanyatri.com";

export const metadata: Metadata = {
  // Note: the root layout appends "· Sundarban Yatri" via the title template,
  // so the brand must not appear here or it renders twice.
  title: "Plan Your Trip — Get a Sundarban Tour Quote",
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

type HireQuery = { tour?: string; interest?: string; destination?: string; from?: string };

const firstParam = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? undefined;

export default async function HirePage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const [tours, faqs, business] = await Promise.all([getTours(), getFaqs(), getBusiness()]);
  // Read the query server-side (instead of useSearchParams in the view) so the
  // page — including its <h1> — renders in the initial HTML for SEO.
  const sp = (await searchParams) ?? {};
  const query: HireQuery = {
    tour: firstParam(sp.tour),
    interest: firstParam(sp.interest),
    destination: firstParam(sp.destination),
    from: firstParam(sp.from),
  };
  return <HireView tours={tours} faqs={faqs} business={business} query={query} />;
}
