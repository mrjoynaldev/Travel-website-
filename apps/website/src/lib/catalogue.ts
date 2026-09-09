import { serverTrpc } from "./trpc-server";
import {
  TOURS,
  TOUR_DETAILS,
  FAQS,
  getTour as staticGetTour,
  type Tour,
  type TourDetail,
} from "./travel-data";
import { businessConfig } from "./business";

export type { Tour, TourDetail };
export type FAQItem = { q: string; a: string };
export type Business = typeof businessConfig;
export type TourWithDetail = Tour & TourDetail;

type TourRow = Awaited<ReturnType<typeof serverTrpc.blog.tours.query>>[number];
type TourDetailRow = Awaited<ReturnType<typeof serverTrpc.blog.tourBySlug.query>>;

function mapDetail(row: { detail?: Record<string, unknown> }): TourDetail {
  const d = (row.detail ?? {}) as Record<string, unknown>;
  const str = (key: string) => (typeof d[key] === "string" ? (d[key] as string) : "");
  const list = (key: string) =>
    Array.isArray(d[key]) ? (d[key] as string[]).filter((x): x is string => typeof x === "string") : [];
  const itinerary = Array.isArray(d.itinerary)
    ? (d.itinerary as Array<{ day?: string; title?: string; desc?: string }>).map(item => ({
        day: typeof item.day === "string" ? item.day : "",
        title: typeof item.title === "string" ? item.title : "",
        desc: typeof item.desc === "string" ? item.desc : "",
      }))
    : [];
  return {
    startPoint: str("startPoint"),
    overview: list("overview"),
    highlights: list("highlights"),
    gallery: list("gallery"),
    itinerary,
    inclusions: list("inclusions"),
    exclusions: list("exclusions"),
    meetingPoint: str("meetingPoint"),
    transport: str("transport"),
    stay: str("stay"),
  };
}

function toCard(row: TourRow): Tour {
  return {
    slug: row.slug,
    title: row.title,
    duration: row.duration || "",
    days: row.days ?? 1,
    group: row.category || "",
    summary: row.summary || "",
    image: row.image_url || "",
    featured: row.featured || undefined,
    priceNote: row.price_note || undefined,
    bestFor: row.best_for || undefined,
  };
}

export async function getTours(): Promise<Tour[]> {
  try {
    const rows = await serverTrpc.blog.tours.query();
    if (rows.length) return rows.map(toCard);
  } catch {
    // fall through to static data
  }
  return TOURS;
}

export async function getTour(slug: string): Promise<TourWithDetail | undefined> {
  try {
    const row = await serverTrpc.blog.tourBySlug.query({ slug });
    return { ...toCard(row), ...mapDetail(row) };
  } catch {
    return staticGetTour(slug);
  }
}

export async function getRelatedTours(slug: string, limit = 3): Promise<Tour[]> {
  const tours = await getTours();
  return tours.filter(t => t.slug !== slug).slice(0, limit);
}

export async function getFaqs(): Promise<FAQItem[]> {
  try {
    const rows = await serverTrpc.blog.faqs.query();
    if (rows.length)
      return rows.map(row => ({ q: row.question, a: row.answer }));
  } catch {
    // fall through to static data
  }
  return FAQS.map(item => ({ q: item.q, a: item.a }));
}

export type VideoReview = {
  id: string;
  customer_name: string;
  tour_slug: string | null;
  video_url: string;
  thumbnail_url: string | null;
  quote: string | null;
  rating: number | null;
};

export type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price_note: string | null;
  image_url: string | null;
  category: string | null;
};

export async function getVideoReviews(): Promise<VideoReview[]> {
  try {
    const rows = await serverTrpc.blog.videoReviews.query();
    return (rows ?? []) as VideoReview[];
  } catch {
    return [];
  }
}

export async function getFoodMenu(): Promise<MenuItem[]> {
  try {
    const rows = await serverTrpc.blog.foodMenu.query();
    return (rows ?? []).filter(row => row.image_url) as MenuItem[];
  } catch {
    return [];
  }
}

export type TrustItem = { icon: string; title: string; desc: string };

export type Brand = {
  heroMediaType: "image" | "video";
  heroImageUrl: string;
  heroVideoUrl: string;
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  safariImageUrl: string;
  safariTitle: string;
  safariText: string;
  safariPoints: string[];
  aboutImageUrl: string;
  trustItems: TrustItem[];
};

const DEFAULT_BRAND: Brand = {
  heroMediaType: "image",
  heroImageUrl: "",
  heroVideoUrl: "",
  heroEyebrow: "",
  heroTitle: "",
  heroSubtitle: "",
  safariImageUrl: "",
  safariTitle: "",
  safariText: "",
  safariPoints: [],
  aboutImageUrl: "",
  trustItems: [],
};

const str = (brand: Partial<Brand>, key: keyof Brand): string => {
  const value = brand[key];
  return typeof value === "string" ? value : "";
};

export async function getBrand(): Promise<Brand> {
  try {
    const publication = await serverTrpc.blog.publication.query();
    const brand = (publication?.settings?.brand ?? {}) as Partial<Brand>;
    return {
      heroMediaType: brand.heroMediaType === "video" ? "video" : "image",
      heroImageUrl: str(brand, "heroImageUrl"),
      heroVideoUrl: str(brand, "heroVideoUrl"),
      heroEyebrow: str(brand, "heroEyebrow"),
      heroTitle: str(brand, "heroTitle"),
      heroSubtitle: str(brand, "heroSubtitle"),
      safariImageUrl: str(brand, "safariImageUrl"),
      safariTitle: str(brand, "safariTitle"),
      safariText: str(brand, "safariText"),
      safariPoints: Array.isArray(brand.safariPoints)
        ? brand.safariPoints.filter((x): x is string => typeof x === "string").slice(0, 6)
        : [],
      aboutImageUrl: str(brand, "aboutImageUrl"),
      trustItems: Array.isArray(brand.trustItems)
        ? brand.trustItems
            .filter((x): x is TrustItem => !!x && typeof x.title === "string" && typeof x.desc === "string")
            .map(x => ({ icon: typeof x.icon === "string" ? x.icon : "Compass", title: x.title, desc: x.desc }))
            .slice(0, 6)
        : [],
    };
  } catch {
    return DEFAULT_BRAND;
  }
}

export async function getBusiness(): Promise<Business> {
  try {
    const publication = await serverTrpc.blog.publication.query();
    const contact = (publication?.settings?.contact ?? {}) as Partial<Business>;
    return { ...businessConfig, ...contact };
  } catch {
    return businessConfig;
  }
}
