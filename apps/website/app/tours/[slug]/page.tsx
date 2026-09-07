import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TourDetail } from "@web/components/travel/TourDetail";
import { TOURS, getTour } from "@web/lib/travel-data";

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || "https://sundarbanyatra.in";

export function generateStaticParams() {
  return TOURS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tour = getTour(slug);
  if (!tour) return { title: "Tour not found" };
  return {
    title: `${tour.title} — Itinerary, Inclusions & Booking | Sundarban Yatra`,
    description: tour.summary,
    alternates: { canonical: `/tours/${slug}` },
    openGraph: {
      type: "website",
      siteName: "Sundarban Yatra",
      url: `${siteUrl()}/tours/${slug}`,
      title: tour.title,
      description: tour.summary,
      images: [{ url: tour.gallery[0], width: 1200, height: 630 }],
    },
  };
}

export default async function TourPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!getTour(slug)) notFound();
  return <TourDetail slug={slug} />;
}
