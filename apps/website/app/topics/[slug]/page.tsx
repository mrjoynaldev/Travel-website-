import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArticleCard } from "@/components/public/ArticleCard";
import { serverTrpc } from "@web/lib/trpc-server";

export const revalidate = 300;

type PostListItem = Awaited<ReturnType<typeof serverTrpc.blog.list.query>>["items"][number];

type Props = { params: Promise<{ slug: string }> };

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || "https://sundarbanyatra.in";

// Pillar FAQ per hub: short, honest, answer-first. Generic fallback otherwise.
const HUB_FAQS: Record<string, Array<{ q: string; a: string }>> = {
  safari: [
    { q: "How does a Sundarban boat safari work?", a: "You cruise permitted creeks with a licensed boat and forest guide, stopping at watchtowers like Sajnekhali and Dobanki. Routes and timings follow forest department rules." },
    { q: "Will I see a tiger on safari?", a: "No honest operator can promise that — sightings depend on nature, season and luck. Deer, crocodiles, wild boar and rich birdlife are far more common." },
    { q: "Which watchtowers do safaris cover?", a: "Typically Sajnekhali, Sudhanyakhali and Dobanki (with its canopy walk) — exactly which depends on permits and the day's route." },
  ],
  "how-to-reach": [
    { q: "How do I reach the Sundarbans from Kolkata?", a: "Most travellers go Kolkata → Canning (train) or drive to Godkhali jetty (2.5–4 hrs), then continue by boat. Share your starting point and we map the smoothest route." },
    { q: "Where do tours usually start?", a: "Godkhali jetty or Canning station — our tours receive you at either, with the exact pickup time shared a day before." },
    { q: "Can I do it as a day trip from Kolkata?", a: "Yes — expect an early start (6–7am) and return by evening. Two days with a night stay is far more relaxed." },
  ],
  "best-time": [
    { q: "Which months are best for the Sundarbans?", a: "October to March is pleasant for most travellers. Monsoon (June–September) is lush but wet with route restrictions; April–May is hot but quiet." },
    { q: "Is winter fog a problem for safari?", a: "Early mornings can be misty — atmospheric, though cruises may start a little later. It rarely cancels a day." },
    { q: "When is birding best?", a: "November to February, when winter migrants join resident kingfishers, egrets and raptors over the backwaters." },
  ],
  cost: [
    { q: "What drives a Sundarban tour's cost?", a: "Boat size and type, stay standard, group size, season and inclusions (meals, transfers, permits). Compare written quotes line by line." },
    { q: "Are permits and guide fees included?", a: "In our tours, yes — licensed boat, forest permits, guide and listed entries are in the written quote. Confirm the same with any operator." },
    { q: "Is there a forest camera fee?", a: "The forest department may levy still/video camera fees separately — carry cash and ask us for the current rates." },
  ],
  itinerary: [
    { q: "How many days are enough?", a: "One day for a taste, 2 days / 1 night for the classic safari + stay, 3 days to slow down with Jharkhali and Gosaba." },
    { q: "What does a typical 2-day plan look like?", a: "Day 1: cruise to Pakhiralay, Sajnekhali, sunset, resort stay. Day 2: sunrise cruise, Dobanki canopy walk, Gosaba, return by evening." },
    { q: "Can itineraries be customised?", a: "Yes — private boat, photography pace, senior-friendly routing. Send dates and group size and we draft options." },
  ],
  places: [
    { q: "Which places matter most in the Sundarbans?", a: "Sajnekhali and Dobanki for safari, Gosaba as the gateway village, Pakhiralay for stays, Jharkhali for the quieter wild side." },
    { q: "Is Gosaba worth stopping at?", a: "Yes — Hamilton bungalow, local markets and river ghats show the human side of the delta most tours rush past." },
    { q: "What is the Dobanki canopy walk?", a: "An elevated walkway above the mangroves with a watchtower view — one of the best non-boat wildlife vantage points." },
  ],
};

const GENERIC_FAQS = [
  { q: "What will I find in this hub?", a: "Every published Sundarban Yatra guide on this topic — practical, honest answers written from real trip experience." },
  { q: "How often is this hub updated?", a: "Every new guide in this topic appears here automatically, newest first." },
];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const categoriesResult = await serverTrpc.blog.categories.query();
    const category = categoriesResult.find(item => item.slug === slug);
    if (!category) return {};
    const title = category.name;
    return {
      title,
      description: category.description || `Sundarban travel guides from Sundarban Yatra on ${category.name}.`,
      alternates: { canonical: `/topics/${category.slug}` },
      openGraph: { type: "website", siteName: "Sundarban Yatra", locale: "en_US", url: `${siteUrl()}/topics/${category.slug}`, title, description: category.description || undefined, images: [{ url: `${siteUrl()}/og-default.png`, width: 1200, height: 630 }] },
      twitter: { card: "summary_large_image", images: [`${siteUrl()}/og-default.png`], title },
    };
  } catch {
    return {};
  }
}

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let category: { id: string; name: string; slug: string; description: string | null } | undefined;
  let items: PostListItem[] = [];
  try {
    const [categoriesResult, listResult] = await Promise.all([
      serverTrpc.blog.categories.query(),
      serverTrpc.blog.list.query({ category: slug, page: 1 }),
    ]);
    category = categoriesResult.find(item => item.slug === slug);
    items = listResult.items;
  } catch {
    notFound();
  }
  const name = category?.name || "Topic";
  const description = category?.description || "A collection of Sundarban travel guides organized around a shared theme.";
  const hubUrl = `${siteUrl()}/topics/${slug}`;
  const faqs = HUB_FAQS[slug] || GENERIC_FAQS;
  const [startHere, ...rest] = items;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${hubUrl}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl()}/` },
          { "@type": "ListItem", position: 2, name, item: hubUrl },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${hubUrl}#faq`,
        mainEntity: faqs.map(item => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
    ],
  };

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <section className="border-b border-border bg-[#e8ede6]">
      <div className="container max-w-5xl lg:max-w-6xl py-14 md:py-20 lg:py-24 xl:py-28">
        <p className="font-label text-[10px] lg:text-[11px] text-primary">Topic hub · {items.length} {items.length === 1 ? "guide" : "guides"}</p>
        <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight md:text-6xl lg:text-[3.4rem] xl:text-6xl lg:leading-[0.95]">{name}</h1>
        <p className="mt-5 max-w-2xl lg:max-w-[42rem] text-lg lg:text-[19px] leading-8 lg:leading-9 text-muted-foreground">{description}</p>
      </div>
    </section>
    {startHere ? (
      <section className="container py-12 md:py-16 lg:py-20">
        <p className="font-label text-xs lg:text-[11px] text-primary">Start here</p>
        <div className="mt-6 lg:mt-8"><ArticleCard post={startHere} featured /></div>
        {rest.length > 0 && <>
          <h2 className="mt-14 lg:mt-20 font-display text-3xl lg:text-[2rem] font-semibold tracking-tight">All {name} guides</h2>
          <div className="mt-8 lg:mt-10 grid gap-x-7 lg:gap-x-8 xl:gap-x-9 gap-y-12 lg:gap-y-14 md:grid-cols-3">
            {rest.map(post => <ArticleCard key={post.id} post={post} />)}
          </div>
          <div className="mt-12 lg:mt-16 rounded-xl border border-border bg-[#fbfcfa] p-6 lg:p-7">
            <p className="font-label text-xs lg:text-[11px] text-primary">Every guide in this hub</p>
            <ol className="mt-4 space-y-3">
              {items.map((post, index) => <li key={post.id} className="flex items-start gap-3 text-sm lg:text-[14.5px]">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10 font-label text-[10px] text-primary">{index + 1}</span>
                <Link href={`/articles/${post.slug}`} className="font-medium text-primary hover:underline leading-6 lg:leading-7">{post.title}</Link>
              </li>)}
            </ol>
          </div>
        </>}
      </section>
    ) : (
      <section className="container py-12 md:py-16">
        <div className="rounded-xl lg:rounded-2xl border border-dashed border-border bg-white p-14 lg:p-16 text-center">
          <p className="font-display text-2xl lg:text-[1.7rem]">Guides for {name} are on the way.</p>
          <p className="mt-2 text-sm lg:text-[15px] text-muted-foreground">The next Sundarban guide in this hub is being written now.</p>
          <Link href="/" className="mt-5 inline-block text-sm lg:text-[15px] font-semibold text-primary hover:underline">Browse all guides</Link>
        </div>
      </section>
    )}
    <section className="border-t border-border bg-white">
      <div className="container max-w-4xl lg:max-w-5xl py-14 lg:py-20">
        <p className="font-label text-xs lg:text-[11px] text-primary">Questions</p>
        <h2 className="mt-2 font-display text-3xl lg:text-[2rem] font-semibold tracking-tight">{name} FAQ</h2>
        <div className="mt-8 lg:mt-10 space-y-6 lg:space-y-8">
          {faqs.map(item => <div key={item.q} className="border-b border-border pb-6 lg:pb-8 last:border-b-0">
            <h3 className="font-semibold text-base lg:text-[17px]">{item.q}</h3>
            <p className="mt-2 text-sm lg:text-[15px] leading-6 lg:leading-7 text-muted-foreground">{item.a}</p>
          </div>)}
        </div>
      </div>
    </section>
  </>;
}
