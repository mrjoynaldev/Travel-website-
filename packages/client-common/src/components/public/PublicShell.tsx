import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { ArrowUpRight, Menu, Search, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

type NavigationItem = { label: string; path: string };
type Brand = { tagline?: string; logoUrl?: string; logoAlt?: string };
type Contact = { email?: string; name?: string };

const defaultNavigation: NavigationItem[] = [
  { label: "Latest", path: "/" }, { label: "Topics", path: "/#topics" }, { label: "Archive", path: "/archive" }, { label: "About", path: "/#about" },
];

export function PublicShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const isStudio = location.startsWith("/studio");
  const { data: publication } = trpc.blog.publication.useQuery();
  const { data: pages = [] } = trpc.blog.pages.useQuery();
  const settings = publication?.settings as { navigation?: NavigationItem[]; brand?: Brand; footer_links?: NavigationItem[]; contact?: Contact } | undefined;
  const brand = settings?.brand ?? {};
  const siteName = publication?.name || "Fieldnote";
  const initial = siteName.slice(0, 1).toUpperCase() || "F";
  const navigation = settings?.navigation?.length ? settings.navigation : defaultNavigation;
  const footerLinks = settings?.footer_links?.length ? settings.footer_links : pages.map(page => ({ label: page.title, path: `/${page.slug}` }));
  const contact = settings?.contact ?? {};
  const mark = (dark = false) => brand.logoUrl ? <img src={brand.logoUrl} alt={brand.logoAlt || `${siteName} logo`} className="h-8 w-8 rounded-full object-cover" /> : <span className={`grid h-8 w-8 place-items-center rounded-full text-sm font-bold ${dark ? "bg-[#e4a741] text-[#17271f]" : "bg-primary text-primary-foreground"}`}>{initial}</span>;
  return <div className="min-h-screen bg-background"><a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">Skip to content</a>
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between gap-5">
        <Link href="/" className="flex items-center gap-3" aria-label={`${siteName} home`}>{mark()}<span className="font-display text-xl font-semibold tracking-tight">{siteName}</span></Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex" aria-label="Primary navigation">{navigation.map(item => <a key={`${item.label}-${item.path}`} href={item.path} className="transition-colors hover:text-foreground">{item.label}</a>)}</nav>
        <div className="hidden items-center gap-2 md:flex"><Link href="/studio"><Button variant="ghost" size="sm" className="gap-2"><Sparkles className="h-4 w-4" />{isStudio ? "Studio" : "Write"}</Button></Link><a href="#newsletter"><Button size="sm" className="gap-2">Subscribe <ArrowUpRight className="h-4 w-4" /></Button></a></div>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Toggle navigation" onClick={() => setOpen(!open)}>{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</Button>
      </div>
      {open && <nav className="border-t border-border bg-background px-4 py-4 md:hidden" aria-label="Mobile navigation"><div className="flex flex-col gap-2">{navigation.map(item => <a key={`${item.label}-${item.path}`} href={item.path} onClick={() => setOpen(false)} className="rounded-md px-3 py-2 hover:bg-muted">{item.label}</a>)}<Link href="/studio" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-primary hover:bg-muted">Open Studio</Link></div></nav>}
    </header>
    <main id="main">{children}</main>
    <footer id="about" className="border-t border-border bg-[#1b382d] text-[#edf4ea]"><div className="container grid gap-10 py-14 md:grid-cols-[1.2fr_.8fr_.8fr]"><div><div className="flex items-center gap-3">{mark(true)}<span className="font-display text-2xl font-semibold">{siteName}</span></div><p className="mt-5 max-w-sm text-sm leading-6 text-[#c6d5ca]">{brand.tagline || publication?.description || "A considered home for people doing the slow work of making sense of what matters."}</p></div><div><p className="font-label text-xs text-[#a7c0af]">Explore</p><div className="mt-4 flex flex-col gap-2 text-sm"><Link href="/" className="hover:text-[#e4a741]">Latest stories</Link><a href="/#topics" className="hover:text-[#e4a741]">Browse topics</a><Link href="/archive" className="hover:text-[#e4a741]">Publication archive</Link>{footerLinks.map(item => <a key={`${item.label}-${item.path}`} href={item.path} className="hover:text-[#e4a741]">{item.label}</a>)}</div></div><div><p className="font-label text-xs text-[#a7c0af]">Publishing</p><p className="mt-4 text-sm leading-6 text-[#c6d5ca]">{contact.name || "Thoughtful words, clear sources, and an editorial process built to respect readers."}</p>{contact.email && <a href={`mailto:${contact.email}`} className="mt-3 block text-sm text-[#e4a741] hover:underline">{contact.email}</a>}</div></div><div className="border-t border-[#396550] py-5 text-center text-xs text-[#a7c0af]">© {new Date().getFullYear()} {siteName}. Made for considered reading.</div></footer>
  </div>;
}

export function SearchField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={value} onChange={event => onChange(event.target.value)} placeholder="Search the journal" className="h-11 border-border bg-white pl-10 shadow-sm" aria-label="Search articles" /></div>;
}
