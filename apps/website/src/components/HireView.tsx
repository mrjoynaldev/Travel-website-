"use client";

import { LeadForm } from "@web/components/conversion/LeadForm";
import { Faq } from "@web/components/conversion/Faq";
import { TourCard } from "@web/components/travel/TourCard";
import { SectionHeader } from "@web/components/travel/SectionHeader";
import { businessConfig, buildWhatsAppUrl } from "@web/lib/business";
import type { Business, FAQItem } from "@web/lib/catalogue";
import { TOURS, FAQS } from "@web/lib/travel-data";
import type { Tour } from "@web/lib/travel-data";
import { Check, Clock3, Globe2, Phone, ShieldCheck } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const DEFAULT_FAQS: FAQItem[] = FAQS.map(item => ({ q: item.q, a: item.a }));

function PlanTripInner({ tours, faqs, business }: { tours?: Tour[]; faqs?: FAQItem[]; business?: Business }) {
  const params = useSearchParams();
  const tourSlug = params.get("tour") || undefined;
  const interest = params.get("interest") || undefined;
  const biz = business ?? businessConfig;
  const toursList = tours ?? TOURS;
  const faqList = faqs ?? DEFAULT_FAQS;
  const prefill = [tourSlug, interest, params.get("destination"), params.get("from")]
    .filter(Boolean)
    .join(" • ");
  const activeTour = toursList.find((t) => t.slug === tourSlug);
  const wa = buildWhatsAppUrl(
    activeTour
      ? `Hello Sundarban Yatri, I am interested in the ${activeTour.title}.\n\nTravel date:\nTravellers:\nStarting location:`
      : "Hello Sundarban Yatri, I want to plan a Sundarban trip. Please share tour options.",
    biz.whatsapp
  );

  return (
    <>
      <section className="border-b border-border bg-[#eff4ee]">
        <div className="container py-14 md:py-20 lg:py-24">
          <p className="font-label text-[11px] text-primary">Plan Your Trip • Talk to a human</p>
          <h1 className="mt-3 h1 font-display max-w-3xl">One call sorts your whole Sundarban trip.</h1>
          <p className="mt-4 max-w-xl body-lg text-muted-foreground">
            Dates, safari slots, stay, route — fastest on call or WhatsApp. No payment, no spam, reply in working hours.
          </p>
          <div className="mt-6 flex flex-wrap gap-6 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4 text-primary" /> {biz.hours}</span>
            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> No advance needed to enquire</span>
          </div>

          {/* Primary: Call + WhatsApp cards */}
          <div className="mt-8 grid gap-4 md:grid-cols-2 max-w-3xl">
            <a
              href={`tel:${biz.phone}`}
              className="yatri-card group flex items-center gap-5 p-6 lg:p-7 !bg-primary !border-primary text-white"
            >
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/15"><Phone className="h-6 w-6" /></span>
              <span>
                <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-white/70">Call us — fastest</span>
                <span className="mt-1 block font-display text-2xl lg:text-[1.7rem] font-bold tracking-tight">{biz.phoneDisplay}</span>
                <span className="mt-1 block text-[13px] text-white/70">Tap to call • {biz.hours}</span>
              </span>
            </a>
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="yatri-card group flex items-center gap-5 p-6 lg:p-7"
            >
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#1fa855]/12 text-[#1fa855]"><WhatsAppIcon className="h-6 w-6" /></span>
              <span>
                <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">WhatsApp us</span>
                <span className="mt-1 block font-display text-2xl lg:text-[1.7rem] font-bold tracking-tight group-hover:text-primary transition-colors">Chat now →</span>
                <span className="mt-1 block text-[13px] text-muted-foreground">Send dates + group size, we reply with options</span>
              </span>
            </a>
          </div>
          {prefill && <p className="mt-4 inline-block rounded-full bg-white border border-border px-4 py-1.5 text-[13px] text-muted-foreground">Looking at: <span className="font-semibold text-foreground">{prefill}</span> — mention it on call / WhatsApp.</p>}

          {/* Secondary: form for international / email-first travellers */}
          <div className="mt-10 max-w-3xl rounded-[24px] border border-dashed border-border bg-white/70 p-6 lg:p-8">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"><Globe2 className="h-4 w-4" /> Outside India, or prefer email?</p>
            <h2 className="mt-2 font-display text-xl font-semibold">Send an enquiry form instead</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">We reply by email / WhatsApp in working hours (IST).</p>
            <div className="mt-5">
              <LeadForm tourSlug={tourSlug} tourTitle={activeTour?.title} ctaLabel={activeTour ? `Ask About This Tour` : "Send Enquiry"} />
            </div>
          </div>
        </div>
      </section>

      <section className="container yatri-section">
        <SectionHeader eyebrow="Tours" title="Which tour fits you?" desc="Pick a starting point — then call or WhatsApp us to lock dates. Every itinerary can be customised." />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {toursList.map((t) => <TourCard key={t.slug} tour={t} />)}
        </div>
      </section>

      <section className="border-y border-border bg-white">
        <div className="container yatri-section grid gap-10 lg:grid-cols-2">
          <div>
            <p className="font-label text-[11px] text-primary">What happens next</p>
            <h2 className="mt-3 h2 font-display">Simple, human, no pressure</h2>
            <ul className="mt-6 grid gap-3">
              {["You call or WhatsApp with dates + group size.", "We suggest 1–2 fitting tours with clear inclusions.", "You confirm on call — pay only when sure."].map((s, i) => (
                <li key={i} className="flex gap-3 rounded-2xl border border-border bg-background p-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-white">{i + 1}</span>
                  <span className="text-[14.5px] leading-6">{s}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground"><Check className="h-4 w-4 text-primary" /> Licensed boats • Forest permits handled • Honest safari briefing</div>
          </div>
          <div>
            <h3 className="font-display text-xl font-semibold">Quick questions</h3>
            <div className="mt-4"><Faq items={faqList.slice(0, 4)} /></div>
          </div>
        </div>
      </section>
    </>
  );
}

export default function HireView({ tours, faqs, business }: { tours?: Tour[]; faqs?: FAQItem[]; business?: Business }) {
  return (
    <Suspense fallback={<div className="container py-24 text-center text-sm text-muted-foreground">Loading trip planner…</div>}>
      <PlanTripInner tours={tours} faqs={faqs} business={business} />
    </Suspense>
  );
}
