import type { Metadata } from "next";
import Link from "next/link";
import { TourCard } from "@web/components/travel/TourCard";
import { SectionHeader } from "@web/components/travel/SectionHeader";
import { Faq } from "@web/components/conversion/Faq";
import { buildWhatsAppUrl, defaultWhatsAppMessage } from "@web/lib/business";
import { getBusiness, getFaqs, getTours } from "@web/lib/catalogue";
import { MessageCircle, Phone } from "lucide-react";

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || "https://sundarbanyatra.com";

export const metadata: Metadata = {
  title: "Sundarban Tour Packages — 1 Day, 2D/1N, 3D/2N & Custom",
  description: "Explore short trips, overnight itineraries and custom Sundarban journeys. Call or WhatsApp for dates, safari slots and a clear quote.",
  alternates: { canonical: "/tours" },
  openGraph: { type: "website", siteName: "Sundarban Yatri", url: `${siteUrl()}/tours`, images: [{ url: `${siteUrl()}/og-default.png`, width: 1200, height: 630 }] },
};

export default async function ToursPage() {
  const [tours, faqs, business] = await Promise.all([getTours(), getFaqs(), getBusiness()]);
  const wa = buildWhatsAppUrl(defaultWhatsAppMessage, business.whatsapp);
  return (
    <>
      <section className="border-b border-border bg-[#eff4ee]">
        <div className="container py-14 md:py-20">
          <p className="font-label text-[11px] text-primary">Sundarban Tours</p>
          <h1 className="mt-3 h1 font-display max-w-3xl">Sundarban Tour Packages</h1>
          <p className="mt-4 max-w-2xl body-lg text-muted-foreground">Seasonal festival journeys ex-Canning / Sonakhali — winter feast and monsoon hilsa specials — every plan confirmed on call with route, safari, stay and inclusions.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={`tel:${business.phone}`} className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-[15px] font-bold text-white hover:bg-[#0f4532]"><Phone className="h-4 w-4" /> {business.phoneDisplay}</a>
            <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center gap-2 rounded-full bg-[#1fa855] px-6 text-[15px] font-semibold text-white hover:bg-[#178a45]"><MessageCircle className="h-4 w-4" /> WhatsApp Us</a>
          </div>
        </div>
      </section>
      <section className="container yatri-section">
        <SectionHeader eyebrow="All tours" title="Pick your pace" desc="Open a tour for the full day-wise plan, inclusions and best advice on dates." />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {tours.map((t) => <TourCard key={t.slug} tour={t} />)}
        </div>
        <p className="mt-6 text-[13px] text-muted-foreground">Both festivals run 3 days / 2 nights with the full safari circuit. Winter for feast + safari; July–September for hilsa. Need other dates or a private group? <Link href="/hire" className="font-semibold text-primary hover:underline">Ask for a custom plan →</Link></p>
      </section>
      <section className="border-t border-border bg-white">
        <div className="container yatri-section max-w-4xl">
          <h2 className="h2 font-display text-center">Tour questions, answered</h2>
          <div className="mt-8"><Faq items={faqs} /></div>
        </div>
      </section>
    </>
  );
}
