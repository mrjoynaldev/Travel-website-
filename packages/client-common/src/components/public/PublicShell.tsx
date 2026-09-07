"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUpRight, Menu, MessageCircle, Phone, Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type NavigationItem = { label: string; path: string };
type Brand = { tagline?: string; logoUrl?: string; logoAlt?: string };
type Contact = { email?: string; name?: string; phone?: string; whatsapp?: string };

export type PublicPageInfo = {
  page_type: string;
  title: string;
  slug: string;
  meta_title: string | null;
  meta_description: string | null;
  updated_at: string | null;
};

export type PublicationInfo = {
  name: string;
  description: string | null;
  settings?: {
    navigation?: NavigationItem[];
    brand?: Brand;
    footer_links?: NavigationItem[];
    contact?: Contact;
  } | null;
};

// Sundarban Yatri IA — matches design spec §8. Stored navigation still wins when set.
const defaultNavigation: NavigationItem[] = [
  { label: "Tours", path: "/tours" },
  { label: "Winter Festival", path: "/tours/sundarban-winter-festival" },
  { label: "Hilsa Festival", path: "/tours/sundarban-hilsa-festival" },
  { label: "Guides", path: "/archive" },
  { label: "About", path: "/about" },
];

const FALLBACK_WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "918513819474";
const FALLBACK_PHONE = "+918513819474";
const FALLBACK_EMAIL = "hello@sundarbanyatra.in";

export function PublicShell({ publication, pages = [], children }: { publication?: PublicationInfo | null; pages?: PublicPageInfo[]; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);
  const settings = publication?.settings ?? {};
  const brand = settings.brand ?? {};
  const siteName = publication?.name || "Sundarban Yatri";
  const navigation = settings.navigation?.length ? settings.navigation : defaultNavigation;
  const footerLinks = settings.footer_links?.length ? settings.footer_links : pages.map(page => ({ label: page.title, path: `/${page.slug}` }));
  const contact = settings.contact ?? {};
  const whatsappNumber = contact.whatsapp || FALLBACK_WHATSAPP;
  const waLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hello Sundarban Yatri, I want to plan a Sundarban trip. Please share tour options.")}`;
  const phoneHref = `tel:${contact.phone || FALLBACK_PHONE}`;
  const email = contact.email || FALLBACK_EMAIL;
  const logoUrl = brand.logoUrl || "/logo.png";
  const mark = (_dark = false, size = "h-8 w-8") => <img src={logoUrl} alt={brand.logoAlt || `${siteName} logo`} className={`${size} rounded-full object-cover`} />;
  return <div className="min-h-screen bg-background"><a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">Skip to content</a>
    {/* Top utility strip */}
    <div className="hidden bg-[#0f4532] text-[#cfe0d5] md:block">
      <div className="container flex h-9 items-center justify-between text-xs">
        <p className="tracking-wide">Local guidance • Flexible itineraries • Easy enquiry</p>
        <div className="flex items-center gap-4">
          <a href={waLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-white transition-colors"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</a>
          <a href={phoneHref} className="inline-flex items-center gap-1.5 hover:text-white transition-colors"><Phone className="h-3.5 w-3.5" /> +91 85138 19474</a>
        </div>
      </div>
    </div>
    <header className="sticky top-0 z-40 border-b border-[#DDE1DA] bg-[#F7F6F1]/95 backdrop-blur-md supports-[backdrop-filter]:bg-[#F7F6F1]/90">
      <div className="container flex h-16 lg:h-[72px] items-center justify-between gap-4 lg:gap-6">
        <Link href="/" className="flex items-center gap-3" aria-label={`${siteName} home`}>{mark(false, "h-10 w-10 lg:h-11 lg:w-11")}<span className="leading-none"><span className="block font-display text-[1.35rem] lg:text-[1.5rem] font-bold tracking-tight text-[#10271F]">{siteName}</span><span className="mt-0.5 hidden text-[11px] font-medium tracking-[0.14em] uppercase text-muted-foreground sm:block">Explore the Sundarbans</span></span></Link>
        <nav className="hidden items-center gap-5 lg:gap-6 xl:gap-7 text-[14px] lg:text-[14.5px] font-medium text-muted-foreground lg:flex" aria-label="Primary navigation">{navigation.map(item => <a key={`${item.label}-${item.path}`} href={item.path} className="relative py-2 transition-colors hover:text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-primary after:transition-transform hover:after:scale-x-100">{item.label}</a>)}</nav>
        <div className="hidden items-center gap-3 lg:flex">
          <a href={waLink} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-2 rounded-full bg-[#167A54] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#0D3B2E]"><MessageCircle className="h-4 w-4" /> WhatsApp Us</a>
          <a href="/hire"><Button size="sm" className="h-11 rounded-full px-5 text-sm font-semibold">Plan Your Trip <ArrowUpRight className="h-4 w-4" /></Button></a>
        </div>
        <div className="flex items-center gap-3 lg:hidden">
          <a href={waLink} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp us" className="grid h-11 w-11 place-items-center rounded-full bg-[#167A54] text-white transition-colors hover:bg-[#0D3B2E]"><MessageCircle className="h-5 w-5" /></a>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full border border-[#D5D9D3] text-[#10271F]" aria-label="Open menu" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></Button>
        </div>
      </div>
    </header>
    {open && <div className="fixed inset-0 z-[60] flex flex-col bg-[#f7f6f1] md:hidden" role="dialog" aria-modal="true" aria-label="Site menu"><div className="container flex h-16 shrink-0 items-center justify-between gap-5 border-b border-border/60"><Link href="/" className="flex items-center gap-2.5" aria-label={`${siteName} home`} onClick={() => setOpen(false)}>{mark(false, "h-9 w-9")}<span className="font-display text-xl font-bold tracking-tight">{siteName}</span></Link><Button variant="ghost" size="icon" aria-label="Close menu" onClick={() => setOpen(false)} className="rounded-full border border-border"><X className="h-5 w-5" /></Button></div><nav className="container flex min-h-0 flex-1 flex-col overflow-y-auto py-4" aria-label="Mobile navigation"><a href="/" onClick={() => setOpen(false)} className="border-b border-border/70 py-3.5 font-display text-2xl font-semibold tracking-tight">Home</a>{navigation.map((item) => <a key={`${item.label}-${item.path}`} href={item.path} onClick={() => setOpen(false)} className="border-b border-border/70 py-3.5 font-display text-2xl font-semibold tracking-tight transition-colors hover:text-primary">{item.label}</a>)}<a href="/hire" onClick={() => setOpen(false)} className="border-b border-border/70 py-3.5 font-display text-2xl font-semibold tracking-tight text-primary">Plan Your Trip</a><a href="/archive" onClick={() => setOpen(false)} className="py-3.5 font-display text-2xl font-semibold tracking-tight">All Guides</a></nav><div className="container grid shrink-0 gap-2 pb-6"><a href="/hire" onClick={() => setOpen(false)}><Button className="h-12 w-full rounded-full gap-2 text-base font-semibold">Plan Your Trip <ArrowUpRight className="h-4 w-4" /></Button></a><a href={waLink} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#167A54] text-base font-semibold text-white"><MessageCircle className="h-5 w-5" /> WhatsApp Us</a></div></div>}
    <main id="main">{children}</main>
    {/* Sticky mobile conversion bar — most important CTA per spec §8 */}
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 backdrop-blur-md md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-3 gap-2 p-2.5">
        <a href={waLink} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-[#167A54] text-sm font-semibold text-white"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
        <a href={phoneHref} className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full border border-border bg-white text-sm font-semibold"><Phone className="h-4 w-4" /> Call</a>
        <a href="/hire" className="inline-flex h-11 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">Get Quote</a>
      </div>
    </div>
    <div className="h-[68px] md:hidden" aria-hidden="true" />
    <footer id="about" className="border-t border-border bg-[#0f2a1f] text-[#edf4ea]">
      <div className="container grid gap-10 py-14 lg:py-16 md:grid-cols-2 lg:grid-cols-[1.3fr_.7fr_.7fr_.8fr]">
        <div>
          <div className="flex items-center gap-3">{mark(true, "h-10 w-10")}<span className="font-display text-2xl font-bold tracking-tight">{siteName}</span></div>
          <p className="mt-4 max-w-sm text-sm leading-7 text-[#c6d5ca]">{brand.tagline || publication?.description || "Your trusted guide to planning a Sundarban journey — practical guides and thoughtfully planned tours."}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <a href={waLink} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full bg-[#1fa855] px-4 text-sm font-semibold text-white"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
            <a href="/hire" className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-[#0f2a1f]">Plan Your Trip <ArrowUpRight className="h-4 w-4" /></a>
          </div>
        </div>
        <div><p className="font-label text-[11px] text-[#9db8a5]">Explore</p><div className="mt-4 flex flex-col gap-2.5 text-sm"><a href="/tours" className="transition-colors hover:text-[#d59b43]">Sundarban Tours</a><a href="/tours/sundarban-winter-festival" className="transition-colors hover:text-[#d59b43]">Winter Festival</a><a href="/tours/sundarban-hilsa-festival" className="transition-colors hover:text-[#d59b43]">Hilsa Festival</a><a href="/archive" className="transition-colors hover:text-[#d59b43]">All Guides</a>{footerLinks.slice(0,3).map(item => <a key={`${item.label}-${item.path}`} href={item.path} className="transition-colors hover:text-[#d59b43]">{item.label}</a>)}</div></div>
        <div><p className="font-label text-[11px] text-[#9db8a5]">Plan</p><div className="mt-4 flex flex-col gap-2.5 text-sm"><a href="/hire" className="transition-colors hover:text-[#d59b43]">Plan Your Trip</a><a href="/#faq" className="transition-colors hover:text-[#d59b43]">FAQs</a><a href="/contact" className="transition-colors hover:text-[#d59b43]">Contact</a><a href="/about" className="transition-colors hover:text-[#d59b43]">About</a></div></div>
        <div><p className="font-label text-[11px] text-[#9db8a5]">Contact</p><div className="mt-4 grid gap-2 text-sm text-[#c6d5ca]"><a href="/contact" className="hover:text-white">Contact Page</a><a href={phoneHref} className="hover:text-white">+91 85138 19474</a><a href={waLink} target="_blank" rel="noopener noreferrer" className="hover:text-white">WhatsApp Us</a><a href={`mailto:${email}`} className="text-[#d59b43] hover:underline">{email}</a><span className="text-xs text-[#9db8a5]">Mon–Sat, 9am–7pm IST</span></div><div className="mt-4 flex flex-col gap-2 text-sm"><Link href="/privacy" className="text-[#c6d5ca] hover:text-white">Privacy</Link><Link href="/terms" className="text-[#c6d5ca] hover:text-white">Terms</Link></div></div>
      </div>
      <div className="border-t border-white/10"><div className="container flex flex-col items-center justify-between gap-2 py-5 text-center text-xs text-[#9db8a5] sm:flex-row sm:text-left"><span>© {new Date().getFullYear()} {siteName}. Explore. Experience. Understand the Sundarbans.</span><span>Privacy • Terms • Disclaimer</span></div></div>
    </footer>
  </div>;
}

export function SearchField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <div className="relative"><Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={value} onChange={event => onChange(event.target.value)} placeholder="Search guides, tours, destinations…" className="h-12 rounded-full border-border bg-white pl-11 shadow-sm" aria-label="Search articles" /></div>;
}
