"use client";

import { ArticleCard, type ArticleCardPost } from "@/components/public/ArticleCard";
import { SearchField } from "@/components/public/PublicShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TripPlannerCard } from "@web/components/conversion/TripPlannerCard";
import { LeadForm } from "@web/components/conversion/LeadForm";
import { Faq } from "@web/components/conversion/Faq";
import { SectionHeader } from "@web/components/travel/SectionHeader";
import { TourCard } from "@web/components/travel/TourCard";
import { DestinationCard, ActivityCard } from "@web/components/travel/Cards";
import { buildWhatsAppUrl, businessConfig, defaultWhatsAppMessage } from "@web/lib/business";
import { TOURS, DESTINATIONS, ACTIVITIES, FAQS, PLANNING_GUIDES, HERO_IMAGE, SAFARI_IMAGE } from "@web/lib/travel-data";
import { ArrowRight, ArrowUpRight, Binoculars, BookOpen, Compass, HeartHandshake, Loader2, Mail, MapPin, MessageCircle, Phone, Route, Ship } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition, useState } from "react";
import { toast } from "sonner";
import { trpcClient } from "@web/lib/trpc-client";

type HomepageSection = {
  id: string;
  title: string;
  section_type: "featured" | "latest" | "category" | "tag" | "custom";
  subtitle: string | null;
  rendered_html: string | null;
  posts: ArticleCardPost[];
};

type Category = { id: string; name: string; slug: string; description: string | null };

type HomeViewProps = {
  categories: Category[];
  sections: HomepageSection[];
  posts: { items: ArticleCardPost[]; total: number; page: number; totalPages: number };
  search: string;
  category?: string;
  page: number;
};

function buildQuery(params: Record<string, string | number | undefined>) {
  const url = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    url.set(key, String(value));
  }
  const qs = url.toString();
  return qs ? `/?${qs}` : "/";
}

const TRUST = [
  { icon: Compass, title: "Trusted Local Guidance", desc: "Helpful destination knowledge and practical trip-planning support from people who know the delta." },
  { icon: Route, title: "Thoughtful Itineraries", desc: "Trips designed around realistic travel times, tides and forest entry rules — never rushed." },
  { icon: HeartHandshake, title: "Clear Communication", desc: "Easy access on WhatsApp, phone and enquiry forms. Real replies, no bots pushing sales." },
  { icon: MapPin, title: "Planning Support", desc: "Guidance for route, timing, stay and tour selection — even if you book nothing with us." },
];

export default function HomeView({ categories, sections, posts, search, category, page }: HomeViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(search);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(category);
  const [showEnquiry, setShowEnquiry] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(searchTimer.current), []);

  const navigate = (params: Record<string, string | number | undefined>) => {
    startTransition(() => router.push(buildQuery({ search: searchInput.trim() || undefined, category: categoryFilter, ...params })));
  };

  const onSearchChange = (value: string) => {
    setSearchInput(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      startTransition(() => router.push(buildQuery({ search: value.trim() || undefined, category: categoryFilter, page: 1 })));
    }, 350);
  };

  const setTopic = (topic?: string) => {
    clearTimeout(searchTimer.current);
    setCategoryFilter(topic);
    navigate({ category: topic, page: 1 });
  };

  const subscribe = async () => {
    if (!email) return;
    setSubmitting(true);
    try {
      await trpcClient.blog.subscribe.mutate({ email });
      setEmail("");
      toast.success("Subscribed — Sundarban trip notes will reach you.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Subscription could not be saved.");
    } finally {
      setSubmitting(false);
    }
  };

  const waGeneral = buildWhatsAppUrl(defaultWhatsAppMessage);
  const isFiltering = Boolean(search || category);
  const isLoading = isPending;

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-[#0a1913] text-white">
        <img src={HERO_IMAGE} alt="Mangrove waterways of the Sundarbans at dawn" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 yatra-hero-veil" />
        <div className="relative container pb-24 pt-16 md:pb-32 md:pt-24 lg:pb-36 lg:pt-28">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] backdrop-blur-sm border border-white/20">
            Sundarban Travel • Tours • Guides
          </p>
          <h1 className="mt-5 max-w-3xl hero-title font-display">
            Plan Your Sundarban Journey with Confidence
          </h1>
          <p className="mt-5 max-w-xl text-[1.05rem] lg:text-lg leading-8 text-white/85">
            Discover mangrove waterways, wildlife, villages and memorable boat journeys — with practical guides and thoughtfully planned Sundarban tours.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#tours" className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-[15px] font-semibold text-[#0f4532] hover:bg-[#f5e7cc] transition-colors">
              Explore Sundarban Tours <ArrowRight className="h-4 w-4" />
            </a>
            <a href={waGeneral} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center gap-2 rounded-full bg-[#1fa855] px-7 text-[15px] font-semibold text-white hover:bg-[#178a45] transition-colors">
              <MessageCircle className="h-4 w-4" /> WhatsApp Us
            </a>
          </div>
          <p className="mt-6 text-[13px] tracking-wide text-white/70">Local guidance • Flexible itineraries • Easy enquiry</p>
        </div>
      </section>

      {/* TRIP PLANNER — overlaps hero */}
      <section className="container relative z-10 -mt-14 md:-mt-16">
        <TripPlannerCard />
      </section>

      {/* POPULAR TOURS */}
      <section id="tours" className="container yatra-section scroll-mt-24">
        <SectionHeader
          eyebrow="Popular tours"
          title="Sundarban Tours Made for Your Trip"
          desc="Choose a ready-made itinerary or tell us what kind of Sundarban experience you are looking for."
          action={<a href="/hire" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2.5 transition-all">Compare all tours <ArrowRight className="h-4 w-4" /></a>}
        />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {TOURS.map((t) => (
            <TourCard key={t.slug} tour={t} />
          ))}
        </div>
        <p className="mt-5 text-[13px] text-muted-foreground">Prices vary by season, group size and boat type — we share a clear written quote before you decide.</p>
      </section>

      {/* WHY CHOOSE US */}
      <section className="border-y border-border bg-white">
        <div className="container yatra-section">
          <SectionHeader eyebrow="Why choose us" title="Why Travellers Choose Sundarban Yatra" align="center" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            {TRUST.map((f) => (
              <div key={f.title} className="rounded-[20px] border border-border bg-background p-6 lg:p-7">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#ddebe3] text-primary"><f.icon className="h-5 w-5" /></span>
                <h3 className="mt-4 font-display text-[1.1rem] font-semibold tracking-tight">{f.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DESTINATIONS */}
      <section id="destinations" className="container yatra-section scroll-mt-24">
        <SectionHeader
          eyebrow="Destinations"
          title="Explore the Sundarbans"
          desc="Six places that shape most journeys — from gateway jetties to quiet forest villages."
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {DESTINATIONS.map((d) => (
            <DestinationCard key={d.slug} d={d} />
          ))}
        </div>
      </section>

      {/* THINGS TO DO */}
      <section id="things-to-do" className="border-y border-border bg-[#eff4ee] scroll-mt-24">
        <div className="container yatra-section">
          <SectionHeader
            eyebrow="Experiences"
            title="Things To Do in the Sundarbans"
            desc="Beyond the tiger trail — slow boats, birds, villages and river light. Wildlife sightings depend on natural conditions, season and luck."
          />
          <div className="grid gap-3 md:grid-cols-2 lg:gap-4">
            {ACTIVITIES.map((a) => (
              <ActivityCard key={a.slug} a={a} />
            ))}
          </div>
        </div>
      </section>

      {/* SAFARI FEATURE */}
      <section id="safari" className="container yatra-section scroll-mt-24">
        <div className="grid overflow-hidden rounded-[28px] border border-border bg-white lg:grid-cols-2">
          <div className="relative min-h-[320px] lg:min-h-[480px]">
            <img src={SAFARI_IMAGE} alt="Royal Bengal Tiger habitat in the Sundarban mangroves" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            <span className="absolute left-5 top-5 yatra-chip bg-white/95">Safari • Licensed boats</span>
          </div>
          <div className="p-7 md:p-10 lg:p-12 flex flex-col justify-center">
            <p className="font-label text-[11px] text-primary">Sundarban Safari</p>
            <h2 className="mt-3 h2 font-display">Creeks, watchtowers and quiet patience</h2>
            <p className="mt-4 leading-8 text-muted-foreground">
              Safari here is a water journey — permitted creeks, forest guides, and watchtowers at Sajnekhali, Sudhanyakhali and Dobanki. Mornings are misty, afternoons golden, and every turn feels unscripted.
            </p>
            <ul className="mt-5 grid gap-2 text-[14.5px] text-foreground">
              <li className="flex gap-2.5"><Binoculars className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Forest guide + permits handled</li>
              <li className="flex gap-2.5"><Ship className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Small-group boats, shade + washroom</li>
              <li className="flex gap-2.5"><BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Honest briefing — no guaranteed sightings</li>
            </ul>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="/hire?interest=safari" className="inline-flex h-12 items-center rounded-full bg-primary px-7 text-[15px] font-semibold text-white hover:bg-[#0f4532] transition-colors">Explore Safari Tours</a>
              <a href="#guides" className="inline-flex h-12 items-center rounded-full border border-border bg-white px-7 text-[15px] font-semibold hover:border-primary/40 hover:text-primary transition-colors">Read Safari Guide</a>
            </div>
          </div>
        </div>
      </section>

      {/* TRAVEL GUIDES — static planning cornerstones */}
      <section id="guides" className="border-y border-border bg-white scroll-mt-24">
        <div className="container yatra-section">
          <SectionHeader
            eyebrow="Travel guides"
            title="Plan Your Sundarban Trip Better"
            desc="Practical, honest answers — routes, costs, seasons and itineraries. Start with a cornerstone guide."
            action={<a href="/archive" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">All guides <ArrowUpRight className="h-4 w-4" /></a>}
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {PLANNING_GUIDES.map((g) => (
              <a key={g.title} href="/archive" className="yatra-card group block p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">Guide • {g.read} read</p>
                <h3 className="mt-2.5 font-display text-[1.2rem] font-semibold tracking-tight group-hover:text-primary transition-colors">{g.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{g.desc}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">Read Guide <ArrowRight className="h-4 w-4" /></span>
              </a>
            ))}
          </div>

          {/* Live editorial feed (existing CMS posts become guides) */}
          <div className="mt-12">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-label text-[11px] text-primary">From the travel guide</p>
                <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight">Latest from the Sundarban Travel Guide</h3>
              </div>
              <div className="w-full max-w-sm"><SearchField value={searchInput} onChange={onSearchChange} /></div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button onClick={() => setTopic()} className={`h-9 shrink-0 rounded-full border px-4 text-sm font-medium transition ${!categoryFilter ? "bg-primary text-white border-primary" : "bg-white border-border hover:border-primary/40"}`}>All</button>
              {categories.map((c) => (
                <button key={c.id} onClick={() => setTopic(c.slug)} className={`h-9 shrink-0 rounded-full border px-4 text-sm font-medium transition ${categoryFilter === c.slug ? "bg-primary text-white border-primary" : "bg-white border-border hover:border-primary/40"}`}>{c.name}</button>
              ))}
            </div>
            {isLoading ? (
              <div className="grid min-h-40 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : posts.items.length ? (
              <>
                <div className="mt-6 grid gap-x-7 gap-y-10 md:grid-cols-3">
                  {posts.items.slice(0, 6).map((p) => (
                    <ArticleCard key={p.id} post={p} />
                  ))}
                </div>
                {posts.totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <Button variant="outline" disabled={page <= 1} onClick={() => navigate({ page: page - 1 })} className="rounded-full">Previous</Button>
                    <span className="text-sm text-muted-foreground">Page {page} of {posts.totalPages}</span>
                    <Button variant="outline" disabled={page >= posts.totalPages} onClick={() => navigate({ page: page + 1 })} className="rounded-full">Next</Button>
                  </div>
                )}
              </>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-border bg-background px-6 py-12 text-center">
                <p className="font-display text-xl">Guides are being written.</p>
                <p className="mt-2 text-sm text-muted-foreground">Our editors are documenting routes, costs and seasons. Check the planning guides above meanwhile.</p>
              </div>
            )}
          </div>

          {/* Admin-configured sections (preserved) */}
          {!isFiltering && sections.length > 0 && (
            <div className="mt-14 space-y-12 border-t border-border pt-12">
              {sections.map((s) => (
                <section key={s.id}>
                  <p className="font-label text-[11px] text-primary">{s.section_type === "custom" ? "Editorial note" : "Curated"}</p>
                  <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight">{s.title}</h3>
                  {s.subtitle && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{s.subtitle}</p>}
                  {s.section_type === "custom" ? (
                    <div className="article-prose mt-4 rounded-2xl border border-border bg-background p-6" dangerouslySetInnerHTML={{ __html: s.rendered_html || "" }} />
                  ) : s.posts.length ? (
                    <div className="mt-6 grid gap-x-7 gap-y-10 md:grid-cols-3">{s.posts.map((p) => <ArticleCard key={p.id} post={p} />)}</div>
                  ) : null}
                </section>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FAQ — honest substitute for fabricated reviews */}
      <section id="faq" className="container yatra-section scroll-mt-24">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          <div>
            <p className="font-label text-[11px] text-primary">Good to know</p>
            <h2 className="mt-3 h2 font-display">Questions Travellers Ask Before They Go</h2>
            <p className="mt-4 leading-7 text-muted-foreground">Straight answers on routes, days, inclusions and seasons. For anything specific, WhatsApp us — a human replies.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={waGeneral} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-2 rounded-full bg-[#1fa855] px-6 text-sm font-semibold text-white"><MessageCircle className="h-4 w-4" /> Ask on WhatsApp</a>
              <a href="/hire" className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-white px-6 text-sm font-semibold hover:border-primary/40 hover:text-primary">Get a Quote</a>
            </div>
          </div>
          <Faq items={FAQS} />
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="container pb-16 lg:pb-24">
        <div className="relative overflow-hidden rounded-[28px] bg-[#0f4532] px-7 py-12 md:p-14 lg:p-16 text-white">
          <div className="absolute inset-0 opacity-[0.14]" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 60%, #fff 1px, transparent 1px)", backgroundSize: "26px 26px" }} />
          <div className="relative grid gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
            <div>
              <p className="font-label text-[11px] text-[#d59b43]">Ready when you are</p>
              <h2 className="mt-3 font-display text-3xl md:text-4xl lg:text-[2.8rem] font-bold tracking-tight leading-[1.05]">Ready to Plan Your Sundarban Trip?</h2>
              <p className="mt-4 max-w-lg leading-8 text-white/80">One call sorts it all — dates, safari, stay. Tap below and talk to a human.</p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <a href={`tel:${businessConfig.phone}`} className="inline-flex min-h-14 flex-col items-center justify-center rounded-2xl bg-white px-6 py-3 text-[#0f4532] hover:bg-[#f5e7cc] transition-colors">
                  <span className="flex items-center gap-2 text-[15px] font-bold"><Phone className="h-5 w-5" /> {businessConfig.phoneDisplay}</span>
                  <span className="mt-0.5 block text-xs font-medium text-[#0f4532]/70">Tap to call • {businessConfig.hours}</span>
                </a>
                <a href={waGeneral} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#1fa855] px-6 py-3.5 text-[15px] font-semibold text-white hover:bg-[#178a45] transition-colors"><MessageCircle className="h-5 w-5" /> WhatsApp Us</a>
              </div>
              <button onClick={() => setShowEnquiry((v) => !v)} aria-expanded={showEnquiry} className="mt-4 text-sm font-medium text-white/70 underline underline-offset-4 hover:text-white transition-colors">
                {showEnquiry ? "Hide enquiry form ↑" : "Outside India? Send an enquiry form instead →"}
              </button>
              {showEnquiry && (
                <div className="mt-4 rounded-[20px] bg-white p-6 text-foreground">
                  <LeadForm ctaLabel="Send Enquiry" />
                </div>
              )}
            </div>
            <div className="rounded-[20px] bg-white p-6 lg:p-7 text-foreground">
              <h3 className="font-display text-lg font-semibold">Get trip notes in your inbox</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">Season alerts, new guides, honest cost updates. No spam.</p>
              <form onSubmit={(e) => { e.preventDefault(); subscribe(); }} className="mt-4 flex flex-col gap-2.5 sm:flex-row">
                <div className="relative flex-1">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="h-12 rounded-full bg-background pl-10" />
                </div>
                <Button type="submit" disabled={submitting} className="h-12 rounded-full px-6 font-semibold">{submitting ? "Joining…" : "Subscribe"}</Button>
              </form>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">By subscribing, you acknowledge our <Link href="/privacy" className="font-medium text-primary underline underline-offset-2">Privacy policy</Link>.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
