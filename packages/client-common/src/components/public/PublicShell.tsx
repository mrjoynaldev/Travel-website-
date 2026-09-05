"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUpRight, Menu, Search, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type NavigationItem = { label: string; path: string };
type Brand = { tagline?: string; logoUrl?: string; logoAlt?: string };
type Contact = { email?: string; name?: string };

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

const defaultNavigation: NavigationItem[] = [
  { label: "Latest", path: "/" }, { label: "Topics", path: "/#topics" }, { label: "Archive", path: "/archive" }, { label: "About", path: "/#about" },
];

export function PublicShell({ publication, pages = [], children }: { publication?: PublicationInfo | null; pages?: PublicPageInfo[]; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  // Lock background scroll while the full-screen mobile menu is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);
  const settings = publication?.settings ?? {};
  const brand = settings.brand ?? {};
  const siteName = publication?.name || "CodeReport Global";
  const initial = siteName.slice(0, 1).toUpperCase() || "C";
  const navigation = settings.navigation?.length ? settings.navigation : defaultNavigation;
  const footerLinks = settings.footer_links?.length ? settings.footer_links : pages.map(page => ({ label: page.title, path: `/${page.slug}` }));
  const contact = settings.contact ?? {};
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL;
  const smartlinkUrl = process.env.NEXT_PUBLIC_ADS_SMARTLINK_URL || "https://wrenlull.com/vk6k61dju4?key=ca18f84300a969f749f54160a5f813c5";
  const adsEnabled = process.env.NEXT_PUBLIC_ADS_ENABLED !== "0";
  const mark = (dark = false, size = "h-8 w-8") => brand.logoUrl ? <img src={brand.logoUrl} alt={brand.logoAlt || `${siteName} logo`} className={`${size} rounded-full object-cover`} /> : <span className={`grid ${size} place-items-center rounded-full text-sm font-bold ${dark ? "bg-[#e4a741] text-[#17271f]" : "bg-primary text-primary-foreground"}`}>{initial}</span>;
  return <div className="min-h-screen bg-background"><a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">Skip to content</a>
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 lg:h-[68px] items-center justify-between gap-5 lg:gap-8">
        <Link href="/" className="flex items-center gap-4 lg:gap-5" aria-label={`${siteName} home`}>{mark(false, "h-[29px] w-[29px] lg:h-[31px] lg:w-[31px]")}<span className="font-display text-2xl lg:text-[1.65rem] font-semibold tracking-tight">{siteName}</span></Link>
        <nav className="hidden items-center gap-6 lg:gap-7 xl:gap-8 text-sm lg:text-[14.5px] font-medium text-muted-foreground md:flex" aria-label="Primary navigation">{navigation.map(item => <a key={`${item.label}-${item.path}`} href={item.path} className="relative transition-colors hover:text-foreground hover:underline hover:underline-offset-[6px] hover:decoration-primary/25">{item.label}</a>)}</nav>
        <div className="hidden items-center gap-2 lg:gap-3 md:flex">{adminUrl && <Link href={adminUrl}><Button variant="ghost" size="sm" className="gap-2 lg:h-9"><Sparkles className="h-4 w-4" />Write</Button></Link>}<a href="#newsletter"><Button size="sm" className="gap-2 lg:h-9 shadow-sm hover:shadow">Subscribe <ArrowUpRight className="h-4 w-4" /></Button></a></div>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></Button>
      </div>
    </header>
    {open && <div className="fixed inset-0 z-[60] flex flex-col bg-background md:hidden" role="dialog" aria-modal="true" aria-label="Site menu"><div className="container flex h-16 shrink-0 items-center justify-between gap-5 border-b border-border/60"><Link href="/" className="flex items-center gap-4" aria-label={`${siteName} home`} onClick={() => setOpen(false)}>{mark(false, "h-[29px] w-[29px]")}<span className="font-display text-2xl font-semibold tracking-tight">{siteName}</span></Link><Button variant="ghost" size="icon" aria-label="Close menu" onClick={() => setOpen(false)}><X className="h-5 w-5" /></Button></div><nav className="container flex min-h-0 flex-1 flex-col justify-center gap-1 overflow-y-auto py-6" aria-label="Mobile navigation">{navigation.map((item, index) => <a key={`${item.label}-${item.path}`} href={item.path} onClick={() => setOpen(false)} className="flex items-center gap-4 border-b border-border/60 py-4 font-display text-3xl font-semibold tracking-tight transition-colors hover:text-primary"><span className="font-label text-[11px] text-muted-foreground">0{index + 1}</span>{item.label}</a>)}{adminUrl && <Link href={adminUrl} onClick={() => setOpen(false)} className="flex items-center gap-2 py-4 text-lg font-medium text-primary">Open Studio <ArrowUpRight className="h-5 w-5" /></Link>}</nav><div className="container shrink-0 pb-10"><a href="#newsletter" onClick={() => setOpen(false)}><Button className="h-12 w-full gap-2 text-base">Subscribe <ArrowUpRight className="h-4 w-4" /></Button></a></div></div>}
    <main id="main">{children}</main>
    <footer id="about" className="border-t border-border bg-[#1b382d] text-[#edf4ea]"><div className="container grid gap-10 lg:gap-12 xl:gap-16 py-14 lg:py-16 xl:py-20 md:grid-cols-[1.2fr_.8fr_.8fr] lg:grid-cols-[1.3fr_.85fr_.85fr]"><div><div className="flex items-center gap-3">{mark(true)}<span className="font-display text-2xl lg:text-[1.6rem] font-semibold">{siteName}</span></div><p className="mt-5 max-w-sm lg:max-w-[22rem] text-sm lg:text-[14.5px] leading-6 lg:leading-7 text-[#c6d5ca]">{brand.tagline || publication?.description || "Developer-first AI news, analysis, and practical guides for people who build and ship software."}</p></div><div><p className="font-label text-xs text-[#a7c0af] lg:text-[11px]">Explore</p><div className="mt-4 lg:mt-5 flex flex-col gap-2 lg:gap-2.5 text-sm lg:text-[14.5px]"><Link href="/" className="transition-colors hover:text-[#e4a741]">Latest stories</Link><a href="/#topics" className="transition-colors hover:text-[#e4a741]">Browse topics</a><Link href="/archive" className="transition-colors hover:text-[#e4a741]">Publication archive</Link>{footerLinks.map(item => <a key={`${item.label}-${item.path}`} href={item.path} className="transition-colors hover:text-[#e4a741]">{item.label}</a>)}</div></div><div><p className="font-label text-xs text-[#a7c0af] lg:text-[11px]">Publishing</p><p className="mt-4 lg:mt-5 text-sm lg:text-[14.5px] leading-6 lg:leading-7 text-[#c6d5ca]">{contact.name || "Clear-eyed reporting and practical guidance on the AI landscape, built to respect your attention."}</p>{contact.email && <a href={`mailto:${contact.email}`} className="mt-3 block text-sm text-[#e4a741] hover:underline">{contact.email}</a>}</div></div><div className="border-t border-[#396550] py-5 lg:py-6 text-center text-xs lg:text-[13px] text-[#a7c0af]">© {new Date().getFullYear()} {siteName}. Developer-first AI news & analysis.{adsEnabled && <><span aria-hidden="true"> · </span><a href={smartlinkUrl} target="_blank" rel="sponsored nofollow noopener" className="transition-colors hover:text-[#e4a741]">Sponsored</a></>}</div></footer>
  </div>;
}

export function SearchField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={value} onChange={event => onChange(event.target.value)} placeholder="Search AI news, guides, tools" className="h-11 border-border bg-white pl-10 shadow-sm" aria-label="Search articles" /></div>;
}
