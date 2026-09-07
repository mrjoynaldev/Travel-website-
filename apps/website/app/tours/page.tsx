import type { Metadata } from "next";
import { TourCard } from "@web/components/travel/TourCard";
import { SectionHeader } from "@web/components/travel/SectionHeader";
import { Faq } from "@web/components/conversion/Faq";
import { businessConfig, buildWhatsAppUrl, defaultWhatsAppMessage } from "@web/lib/business";
import { FAQS, TOURS } from "@web/lib/travel-data";
import { MessageCircle, Phone } from "lucide-react";

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || "https://sundarbanyatra.in";

export const metadata: Metadata = {
  title: "Sundarban Tour Packages — 1 Day, 2D/1N, 3D/2N & Custom",
  description: "Explore short trips, overnight itineraries and custom Sundarban journeys. Call or WhatsApp for dates, safari slots and a clear quote.",
  alternates: { canonical: "/tours" },
  openGraph: { type: "website", siteName: "Sundarban Yatra", url: `${siteUrl()}/tours`, images: [{ url: `${siteUrl()}/og-default.png`, width: 1200, height: 630 }] },
};

export default function ToursPage() {
  const wa = buildWhatsAppUrl(defaultWhatsAppMessage);
  return (
    <>
      <section className="border-b border-border bg-[#eff4ee]">
        <div className="container py-14 md:py-20">
          <p className="font-label text-[11px] text-primary">Sundarban Tours</p>
          <h1 className="mt-3 h1 font-display max-w-3xl">Sundarban Tour Packages</h1>
          <p className="mt-4 max-w-2xl body-lg text-muted-foreground">Short trips, overnight itineraries and custom journeys — every plan confirmed on call with route, safari, stay and inclusions.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={`tel:${businessConfig.phone}`} className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-[15px] font-bold text-white hover:bg-[#0f4532]"><Phone className="h-4 w-4" /> {businessConfig.phoneDisplay}</a>
            <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center gap-2 rounded-full bg-[#1fa855] px-6 text-[15px] font-semibold text-white hover:bg-[#178a45]"><MessageCircle className="h-4 w-4" /> WhatsApp Us</a>
          </div>
        </div>
      </section>
      <section className="container yatra-section">
        <SectionHeader eyebrow="All tours" title="Pick your pace" desc="Open a tour for the full day-wise plan, inclusions and best advice on dates." />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {TOURS.map((t) => <TourCard key={t.slug} tour={t} />)}
        </div>
        <p className="mt-6 text-[13px] text-muted-foreground">How to choose: 1 day for a taste • 2 days / 1 night for the classic safari + stay • 3 days to slow down • Custom for private groups. Prices vary by season and group size — confirmed in writing before you decide.</p>
      </section>
      <section className="border-t border-border bg-white">
        <div className="container yatra-section max-w-4xl">
          <h2 className="h2 font-display text-center">Tour questions, answered</h2>
          <div className="mt-8"><Faq items={FAQS} /></div>
        </div>
      </section>
    </>
  );
}
