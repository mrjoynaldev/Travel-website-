import { Breadcrumbs } from "@web/components/travel/SectionHeader";
import { TourCard } from "@web/components/travel/TourCard";
import { Faq } from "@web/components/conversion/Faq";
import { LeadForm } from "@web/components/conversion/LeadForm";
import { businessConfig, buildWhatsAppUrl, tourWhatsAppMessage } from "@web/lib/business";
import { FAQS, TOURS, getTour } from "@web/lib/travel-data";
import { BedDouble, CalendarDays, Car, Check, Clock3, MapPin, MessageCircle, Phone, Ship, Users, X } from "lucide-react";
import Link from "next/link";

export function TourDetail({ slug }: { slug: string }) {
  const tour = getTour(slug);
  if (!tour) return null;
  const wa = buildWhatsAppUrl(tourWhatsAppMessage(tour.title));
  const related = TOURS.filter((t) => t.slug !== slug).slice(0, 3);

  return (
    <>
      {/* Above the fold */}
      <section className="border-b border-border bg-[#eff4ee]">
        <div className="container py-10 md:py-14">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Tours", href: "/tours" }, { label: tour.title }]} />
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="yatra-chip">{tour.featured ? "Most popular" : tour.group}</span>
            <span className="yatra-chip yatra-chip-accent">{tour.duration}</span>
          </div>
          <h1 className="mt-4 h1 font-display max-w-3xl">{tour.title}</h1>
          <p className="mt-3 max-w-2xl body-lg text-muted-foreground">{tour.summary}</p>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4 text-primary" /> {tour.duration}</span>
            <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-primary" /> Starts: {tour.startPoint}</span>
            <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4 text-primary" /> Best for {tour.bestFor}</span>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="container pt-8 lg:pt-10">
        <div className="grid gap-3 md:grid-cols-3">
          <img src={tour.gallery[0]} alt={tour.title} className="aspect-[16/10] w-full rounded-[20px] object-cover md:col-span-2 md:aspect-auto md:h-full md:min-h-[320px]" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
            <img src={tour.gallery[1]} alt="" loading="lazy" className="aspect-[16/10] w-full rounded-[20px] object-cover md:aspect-auto md:h-full" />
            <img src={tour.gallery[2]} alt="" loading="lazy" className="aspect-[16/10] w-full rounded-[20px] object-cover md:aspect-auto md:h-full" />
          </div>
        </div>
      </section>

      <section className="container py-10 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[1fr_360px] lg:gap-12">
          {/* Main column */}
          <div className="min-w-0">
            <h2 className="h2 font-display">Overview</h2>
            {tour.overview.map((p, i) => (
              <p key={i} className="mt-4 leading-8 text-muted-foreground">{p}</p>
            ))}

            <h2 className="mt-12 h2 font-display">Highlights</h2>
            <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {tour.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2.5 rounded-2xl border border-border bg-white p-4 text-[14.5px] leading-6">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-primary" /> {h}
                </li>
              ))}
            </ul>

            <h2 className="mt-12 h2 font-display">Day-by-day itinerary</h2>
            <ol className="mt-6 space-y-0">
              {tour.itinerary.map((d, i) => (
                <li key={i} className="relative flex gap-4 pb-8 last:pb-0">
                  {i < tour.itinerary.length - 1 && <span aria-hidden="true" className="absolute left-[19px] top-10 h-[calc(100%-2rem)] w-px bg-border" />}
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-white">{i + 1}</span>
                  <div className="rounded-2xl border border-border bg-white p-5 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">{d.day}</p>
                    <h3 className="mt-1 font-display text-lg font-semibold">{d.title}</h3>
                    <p className="mt-1.5 text-[14.5px] leading-7 text-muted-foreground">{d.desc}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-12 grid gap-4 md:grid-cols-2">
              <div className="rounded-[20px] border border-border bg-white p-6">
                <h3 className="font-display text-lg font-semibold">What&apos;s included</h3>
                <ul className="mt-3 grid gap-2 text-[14.5px] leading-6 text-muted-foreground">
                  {tour.inclusions.map((x) => (
                    <li key={x} className="flex gap-2"><Check className="mt-1 h-4 w-4 shrink-0 text-primary" /> {x}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[20px] border border-border bg-white p-6">
                <h3 className="font-display text-lg font-semibold">What&apos;s not included</h3>
                <ul className="mt-3 grid gap-2 text-[14.5px] leading-6 text-muted-foreground">
                  {tour.exclusions.map((x) => (
                    <li key={x} className="flex gap-2"><X className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" /> {x}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { icon: MapPin, t: "Meeting point", d: tour.meetingPoint },
                { icon: Car, t: "Transport", d: tour.transport },
                { icon: BedDouble, t: "Stay", d: tour.stay },
              ].map((c) => (
                <div key={c.t} className="rounded-[20px] border border-border bg-[#eff4ee] p-5">
                  <c.icon className="h-5 w-5 text-primary" />
                  <h3 className="mt-2.5 font-display font-semibold">{c.t}</h3>
                  <p className="mt-1.5 text-[13.5px] leading-6 text-muted-foreground">{c.d}</p>
                </div>
              ))}
            </div>

            <h2 className="mt-12 h2 font-display">Common questions</h2>
            <div className="mt-5"><Faq items={FAQS.slice(0, 5)} /></div>

            <div className="mt-10 rounded-[24px] bg-[#0f4532] p-7 lg:p-9 text-white">
              <p className="font-label text-[11px] text-[#d59b43]">Like this tour?</p>
              <h2 className="mt-2 font-display text-2xl lg:text-3xl font-bold tracking-tight">Call or WhatsApp — we&apos;ll lock your dates.</h2>
              <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
                <a href={`tel:${businessConfig.phone}`} className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-[15px] font-bold text-[#0f4532] hover:bg-[#f5e7cc] transition-colors"><Phone className="h-4 w-4" /> {businessConfig.phoneDisplay}</a>
                <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1fa855] px-6 py-3.5 text-[15px] font-semibold text-white hover:bg-[#178a45] transition-colors"><MessageCircle className="h-4 w-4" /> WhatsApp This Tour</a>
              </div>
              <p className="mt-4 text-sm text-white/60">Outside India? Use the enquiry form in the side card →</p>
            </div>
          </div>

          {/* Sticky side card */}
          <aside className="lg:sticky lg:top-24 h-fit">
            <div className="rounded-[24px] border border-border bg-white p-6 shadow-[0_28px_60px_-28px_rgba(15,69,50,.35)]">
              <h3 className="font-display text-xl font-semibold">Plan This Tour</h3>
              <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-primary" /> {tour.duration}</span>
                <span className="inline-flex items-center gap-1.5"><Ship className="h-4 w-4 text-primary" /> Licensed boat + permits handled</span>
              </div>
              <div className="mt-5 grid gap-2.5">
                <a href={`tel:${businessConfig.phone}`} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-[15px] font-bold text-white hover:bg-[#0f4532] transition-colors"><Phone className="h-4 w-4" /> Call to Book</a>
                <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1fa855] px-5 py-3 text-[15px] font-semibold text-white hover:bg-[#178a45] transition-colors"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
              </div>
              <div className="my-5 border-t border-dashed border-border" />
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Outside India? Enquire by form</p>
              <div className="mt-3"><LeadForm compact tourSlug={tour.slug} tourTitle={tour.title} ctaLabel="Send Enquiry" /></div>
            </div>
          </aside>
        </div>
      </section>

      {/* Related tours */}
      <section className="border-t border-border bg-white">
        <div className="container yatra-section">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-label text-[11px] text-primary">Keep looking</p>
              <h2 className="mt-2 h2 font-display">Other Sundarban tours</h2>
            </div>
            <Link href="/tours" className="text-sm font-semibold text-primary hover:underline">All tours →</Link>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {related.map((t) => <TourCard key={t.slug} tour={t} />)}
          </div>
        </div>
      </section>
    </>
  );
}
