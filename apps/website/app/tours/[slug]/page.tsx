import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TourDetail } from "@web/components/travel/TourDetail";
import { getBusiness, getFaqs, getRelatedTours, getTour, getTours } from "@web/lib/catalogue";

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || "https://sundarbanyatri.com";

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
    twitter: {
      card: "summary_large_image",
      title: tour.title,
      description: tour.summary,
      images: image ? [image] : undefined,
    },
  };
}

export default async function TourPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [tour, related, faqs, business] = await Promise.all([getTour(slug), getRelatedTours(slug), getFaqs(), getBusiness()]);
  if (!tour) notFound();

  const base = siteUrl();
  const tourUrl = `${base}/tours/${slug}`;
  const image = (tour.gallery && tour.gallery[0]) || tour.image;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TouristTrip",
        "@id": `${tourUrl}#tour`,
        name: tour.title,
        description: tour.summary,
        url: tourUrl,
        image: image || undefined,
        touristType: tour.bestFor || undefined,
        itinerary: {
          "@type": "ItemList",
          numberOfItems: tour.itinerary.length,
          itemListElement: tour.itinerary.map((day, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: `${day.day}: ${day.title}`,
            description: day.desc,
          })),
        },
        provider: { "@id": `${base}/#organization` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${tourUrl}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${base}/` },
          { "@type": "ListItem", position: 2, name: "Tours", item: `${base}/tours` },
          { "@type": "ListItem", position: 3, name: tour.title, item: tourUrl },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <TourDetail tour={tour} related={related} faqs={faqs} business={business} />
    </>
  );
}
