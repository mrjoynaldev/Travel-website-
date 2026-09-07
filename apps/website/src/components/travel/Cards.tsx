import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { Destination, Activity } from "@web/lib/travel-data";

export function DestinationCard({ d }: { d: Destination }) {
  return (
    <Link
      href={`/hire?destination=${d.slug}`}
      className="yatra-card group relative block overflow-hidden !p-0"
      aria-label={`Explore ${d.name}`}
    >
      <div className="relative aspect-[4/5] sm:aspect-[4/3] lg:aspect-[4/5] overflow-hidden">
        <img
          src={d.image}
          alt={d.name}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1913]/85 via-[#0a1913]/20 to-transparent" />
        {d.tag && (
          <span className="absolute left-4 top-4 yatra-chip bg-white/95 text-foreground">{d.tag}</span>
        )}
        <div className="absolute inset-x-0 bottom-0 p-5 lg:p-6">
          <h3 className="font-display text-2xl lg:text-[1.6rem] font-semibold text-white tracking-tight">{d.name}</h3>
          <p className="mt-1.5 text-sm leading-6 text-white/80 line-clamp-2">{d.summary}</p>
          <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-white">
            Explore <ArrowUpRight className="h-4 w-4 text-[#f5e7cc]" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ActivityCard({ a }: { a: Activity }) {
  return (
    <Link
      href={`/hire?interest=${a.slug}`}
      className="group flex items-center gap-4 rounded-2xl border border-border bg-white p-3 pr-5 hover:border-primary/30 hover:shadow-[0_16px_36px_-20px_rgba(15,69,50,.35)] transition-all"
    >
      <span className="relative h-20 w-20 lg:h-24 lg:w-24 shrink-0 overflow-hidden rounded-xl">
        <img src={a.image} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
      </span>
      <span className="min-w-0">
        <span className="block font-display font-semibold text-[1.02rem] leading-snug truncate group-hover:text-primary transition-colors">
          {a.title}
        </span>
        <span className="mt-1 block text-[13px] leading-5 text-muted-foreground line-clamp-2">{a.summary}</span>
        {a.duration && <span className="mt-1.5 inline-block text-xs font-semibold text-primary">{a.duration}</span>}
      </span>
    </Link>
  );
}
