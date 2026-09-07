import { ArrowRight, Clock3 } from "lucide-react";
import Link from "next/link";
import type { Tour } from "@web/lib/travel-data";

export function TourCard({ tour }: { tour: Tour }) {
  return (
    <article className="yatri-card group overflow-hidden flex flex-col">
      <Link href={`/tours/${tour.slug}`} aria-label={`View ${tour.title}`} className="block">
        <div className="relative aspect-[3/2] overflow-hidden">
          <img
            src={tour.image}
            alt={tour.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-80" />
          <span className="absolute left-4 top-4 yatri-chip bg-white/95 text-foreground shadow-sm">
            {tour.featured ? "Most popular" : tour.group}
          </span>
          <span className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
            <Clock3 className="h-3.5 w-3.5" /> {tour.duration}
          </span>
        </div>
        <div className="p-5 lg:p-6 flex flex-col flex-1">
          <h3 className="font-display text-[1.25rem] lg:text-[1.35rem] font-semibold tracking-tight leading-snug group-hover:text-primary transition-colors">
            {tour.title}
          </h3>
          <p className="mt-2 text-sm lg:text-[14.5px] leading-6 text-muted-foreground line-clamp-2">{tour.summary}</p>
          {tour.priceNote && (
            <p className="mt-4 text-[13px] font-semibold text-primary bg-[#ddebe3] self-start rounded-full px-3 py-1">
              {tour.priceNote}
            </p>
          )}
          <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{tour.bestFor}</span>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
              View Tour <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
