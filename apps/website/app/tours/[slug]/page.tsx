import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TourDetail } from "@web/components/travel/TourDetail";
import { getBusiness, getFaqs, getRelatedTours, getTour, getTours } from "@web/lib/catalogue";

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || "https://sundarbanyatra.com";

export async function generateStaticParams() {
  const tours = await getTours();
  return tours.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tour = await getTour(slug);
  if (!tour) return { title: "Tour not found" };
  const image = (tour.gallery && tour.gallery[0]) || tour.image;
  return {
    title: `${tour.title} — Itinerary, Inclusions & Booking | Sundarban Yatri`,
    description: tour.summary,
    alternates: { canonical: `/tours/${slug}` },
    openGraph: {
      type: "website",
      siteName: "Sundarban Yatri",
      url: `${siteUrl()}/tours/${slug}`,
      title: tour.title,
      description: tour.summary,
      images: image ? [{ url: image, width: 1200, height: 630 }] : undefined,
    },
  };
}

export default async function TourPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [tour, related, faqs, business] = await Promise.all([getTour(slug), getRelatedTours(slug), getFaqs(), getBusiness()]);
  if (!tour) notFound();
  return <TourDetail tour={tour} related={related} faqs={faqs} business={business} />;
}
