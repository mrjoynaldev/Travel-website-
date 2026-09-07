import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@web/components/travel/SectionHeader";
import { LeadForm } from "@web/components/conversion/LeadForm";
import { Faq } from "@web/components/conversion/Faq";
import { businessConfig, buildWhatsAppUrl, defaultWhatsAppMessage } from "@web/lib/business";
import { FAQS } from "@web/lib/travel-data";
import { Clock3, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || "https://sundarbanyatra.in";

export const metadata: Metadata = {
  title: "Contact Sundarban Yatri — Call, WhatsApp or Enquire",
  description: "Reach Sundarban Yatri by call, WhatsApp, email or enquiry form. Working hours Mon–Sat, 9am–7pm IST. Operating ex-Kolkata / Canning / Godkhali.",
  alternates: { canonical: "/contact" },
  openGraph: { type: "website", siteName: "Sundarban Yatri", url: `${siteUrl()}/contact`, images: [{ url: `${siteUrl()}/og-default.png`, width: 1200, height: 630 }] },
};

export default function ContactPage() {
  const wa = buildWhatsAppUrl(defaultWhatsAppMessage);
  return (
    <>
      <section className="border-b border-border bg-[#eff4ee]">
        <div className="container py-14 md:py-20">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Contact" }]} />
          <p className="mt-5 font-label text-[11px] text-primary">Contact • Talk to a human</p>
          <h1 className="mt-3 h1 font-display max-w-3xl">Call, WhatsApp, or send an enquiry.</h1>
          <p className="mt-4 max-w-2xl body-lg text-muted-foreground">Fastest in working hours ({businessConfig.hours}). No payment and no spam — just trip help.</p>
        </div>
      </section>

      <section className="container yatri-section">
        <div className="grid gap-4 md:grid-cols-3">
          <a href={`tel:${businessConfig.phone}`} className="yatri-card flex items-center gap-5 p-6 lg:p-7">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><Phone className="h-6 w-6" /></span>
            <span>
              <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Call — fastest</span>
              <span className="mt-1 block font-display text-xl font-bold">{businessConfig.phoneDisplay}</span>
              <span className="mt-1 block text-[13px] text-muted-foreground">{businessConfig.hours}</span>
            </span>
          </a>
          <a href={wa} target="_blank" rel="noopener noreferrer" className="yatri-card flex items-center gap-5 p-6 lg:p-7">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#1fa855]/12 text-[#1fa855]"><MessageCircle className="h-6 w-6" /></span>
            <span>
              <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">WhatsApp</span>
              <span className="mt-1 block font-display text-xl font-bold">Chat now →</span>
              <span className="mt-1 block text-[13px] text-muted-foreground">Send dates + group size</span>
            </span>
          </a>
          <a href={`mailto:${businessConfig.email}`} className="yatri-card flex items-center gap-5 p-6 lg:p-7">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#f5e7cc] text-[#7a5410]"><Mail className="h-6 w-6" /></span>
            <span className="min-w-0">
              <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Email</span>
              <span className="mt-1 block truncate font-display text-xl font-bold">{businessConfig.email}</span>
              <span className="mt-1 block text-[13px] text-muted-foreground">Replies in working hours</span>
            </span>
          </a>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-14">
          <div>
            <h2 className="h2 font-display">Send an enquiry form</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Best from outside India, or if you prefer email. We reply by email / WhatsApp in working hours (IST).</p>
            <div className="mt-5"><LeadForm ctaLabel="Send Enquiry" /></div>
          </div>
          <div>
            <h2 className="h2 font-display">Where we operate</h2>
            <div className="mt-5 grid gap-3">
              <div className="flex gap-3 rounded-2xl border border-border bg-white p-5">
                <MapPin className="mt-1 h-5 w-5 shrink-0 text-primary" />
                <p className="text-[14.5px] leading-7 text-muted-foreground">Find us at {businessConfig.location}. Tours run ex-Kolkata / Canning / Sonakhali — pickup, drive, licensed boat, guide, stay and meals arranged from there. There is no walk-in office; the delta is our workplace.</p>
              </div>
              <div className="flex gap-3 rounded-2xl border border-border bg-white p-5">
                <Clock3 className="mt-1 h-5 w-5 shrink-0 text-primary" />
                <p className="text-[14.5px] leading-7 text-muted-foreground">{businessConfig.hours}. Messages outside hours are answered the next working morning.</p>
              </div>
            </div>
            <h3 className="mt-8 font-display text-xl font-semibold">Before you write</h3>
            <div className="mt-4"><Faq items={[FAQS[0], FAQS[1], FAQS[6]]} /></div>
            <p className="mt-5 text-sm text-muted-foreground">Planning instead of asking? <Link href="/hire" className="font-semibold text-primary hover:underline">Open the trip planner →</Link></p>
          </div>
        </div>
      </section>
    </>
  );
}
