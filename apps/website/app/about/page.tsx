import type { Metadata } from "next";
import Link from "next/link";
import { buildWhatsAppUrl, defaultWhatsAppMessage } from "@web/lib/business";
import { getBrand, getBusiness } from "@web/lib/catalogue";
import { BOAT_IMAGE } from "@web/lib/travel-data";
import { Compass, HeartHandshake, MapPin, MessageCircle, Phone, Route, ShieldCheck } from "lucide-react";

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || "https://sundarbanyatra.com";

export const metadata: Metadata = {
  title: "About Sundarban Yatri — Local Guidance for the Sundarbans",
  description: "Sundarban Yatri helps travellers understand the Sundarbans before they go — honest routes, realistic plans and human help on call and WhatsApp.",
  alternates: { canonical: "/about" },
  openGraph: { type: "website", siteName: "Sundarban Yatri", url: `${siteUrl()}/about`, images: [{ url: `${siteUrl()}/og-default.png`, width: 1200, height: 630 }] },
};

const VALUES = [
  { icon: Compass, t: "Local first", d: "Routes, tides, seasons and forest rules — from people who work the delta, not a call centre script." },
  { icon: Route, t: "Realistic plans", d: "Itineraries built around actual travel times and tide windows. If a plan is too rushed, we say so." },
  { icon: HeartHandshake, t: "Human replies", d: "Call or WhatsApp reaches a person in working hours. No bots pushing sales, no spam after." },
  { icon: ShieldCheck, t: "No fiction", d: "We never publish fabricated ratings, fake reviews, invented availability or guaranteed sightings." },
];

export default async function AboutPage() {
  const [business, brand] = await Promise.all([getBusiness(), getBrand()]);
  const wa = buildWhatsAppUrl(defaultWhatsAppMessage, business.whatsapp);
  const aboutImage = brand.aboutImageUrl.trim() || BOAT_IMAGE;
  return (
    <>
      <section className="border-b border-border bg-[#eff4ee]">
        <div className="container grid items-center gap-10 py-14 md:py-20 lg:grid-cols-2">
          <div>
            <p className="font-label text-[11px] text-primary">About Sundarban Yatri</p>
            <h1 className="mt-3 h1 font-display">Explore. Experience. Understand the Sundarbans.</h1>
            <p className="mt-4 body-lg text-muted-foreground">We are a Sundarban-focused travel team: practical guides, thoughtfully planned tours, and straight answers before you spend a rupee.</p>
            <p className="mt-4 inline-block rounded-full border border-border bg-white px-4 py-1.5 text-[13px] text-muted-foreground">Organised by <span className="font-semibold text-foreground">{business.organiser}</span> · {business.location}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/tours" className="inline-flex h-12 items-center rounded-full bg-primary px-7 text-[15px] font-bold text-white hover:bg-[#0f4532]">Browse Tours</Link>
              <Link href="/contact" className="inline-flex h-12 items-center rounded-full border border-border bg-white px-7 text-[15px] font-semibold hover:border-primary/40 hover:text-primary">Contact Us</Link>
            </div>
          </div>
          <img src={aboutImage} alt="Boat cruising a Sundarban creek" className="aspect-[4/3] w-full rounded-[24px] object-cover" />
        </div>
      </section>

      <section className="container yatri-section">
        <p className="font-label text-[11px] text-primary">How we work</p>
        <h2 className="mt-3 h2 font-display max-w-2xl">A publication and a tour desk, not a marketplace</h2>
        <p className="mt-4 max-w-2xl leading-8 text-muted-foreground">Most visitors arrive with a question — how to reach, how many days, what a safari involves. Our guides answer it. When you are ready, our tours carry it out: licensed boats, forest permits, guides, stay and meals, confirmed in writing before you decide.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v) => (
            <div key={v.t} className="rounded-[20px] border border-border bg-white p-6">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#ddebe3] text-primary"><v.icon className="h-5 w-5" /></span>
              <h3 className="mt-4 font-display text-[1.1rem] font-semibold">{v.t}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{v.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-white">
        <div className="container yatri-section grid gap-10 lg:grid-cols-2">
          <div>
            <p className="font-label text-[11px] text-primary">What we promise</p>
            <h2 className="mt-3 h2 font-display">Clear quotes, licensed boats, honest briefings</h2>
            <ul className="mt-6 grid gap-2.5 text-[14.5px] leading-7 text-muted-foreground">
              {["Written quote with inclusions listed before you decide", "Licensed motor boats with forest permits and trained guides", "Realistic safari briefing — wildlife depends on nature and luck", "Help with route, timing, stay and tour selection — even if you book nothing"].map((x) => (
                <li key={x} className="flex gap-2.5"><MapPin className="mt-1.5 h-4 w-4 shrink-0 text-primary" /> {x}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-label text-[11px] text-primary">What we will not do</p>
            <h2 className="mt-3 h2 font-display">No pressure, no fiction</h2>
            <ul className="mt-6 grid gap-2.5 text-[14.5px] leading-7 text-muted-foreground">
              {["No fake reviews, invented ratings or made-up availability", "No guaranteed tiger sightings — ever", "No hidden extras surfacing after you pay", "No spam calls or messages after your trip"].map((x) => (
                <li key={x} className="flex gap-2.5"><ShieldCheck className="mt-1.5 h-4 w-4 shrink-0 text-primary" /> {x}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="container yatri-section">
        <div className="rounded-[24px] bg-[#0f4532] p-7 text-white lg:p-9">
          <p className="font-label text-[11px] text-[#d59b43]">Talk to us — {business.hours}</p>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight lg:text-3xl">Questions? A human replies.</h2>
          <p className="mt-3 max-w-xl leading-7 text-white/75">Call or WhatsApp with your dates and group size. If we are not the right fit, we will tell you that too.</p>
          <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
            <a href={`tel:${business.phone}`} className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-[15px] font-bold text-[#0f4532] transition-colors hover:bg-[#f5e7cc]"><Phone className="h-4 w-4" /> {business.phoneDisplay}</a>
            <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1fa855] px-6 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#178a45]"><MessageCircle className="h-4 w-4" /> WhatsApp Us</a>
          </div>
        </div>
      </section>
    </>
  );
}
