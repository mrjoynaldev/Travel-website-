export type Tour = {
  slug: string;
  title: string;
  duration: string;
  days: number;
  group: string;
  summary: string;
  image: string;
  featured?: boolean;
  priceNote?: string;
  bestFor?: string;
};

export type Destination = {
  slug: string;
  name: string;
  summary: string;
  image: string;
  tag?: string;
};

export type Activity = {
  slug: string;
  title: string;
  summary: string;
  image: string;
  duration?: string;
};

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const HERO_IMAGE = img("photo-1441974231531-c6227db76b6e", 2000);
export const SAFARI_IMAGE = img("photo-1561731216-c3a4d99437d5", 1400);
export const BOAT_IMAGE = img("photo-1544551763-46a013bb70d5", 1400);

export type ItineraryDay = { day: string; title: string; desc: string };
export type TourDetail = {
  startPoint: string;
  overview: string[];
  highlights: string[];
  gallery: string[];
  itinerary: ItineraryDay[];
  inclusions: string[];
  exclusions: string[];
  meetingPoint: string;
  transport: string;
  stay: string;
};

export const TOUR_DETAILS: Record<string, TourDetail> = {
  "sundarban-winter-festival": {
    startPoint: "Canning / Sonakhali",
    overview: [
      "Our winter celebration — three days of grand Bengali feasting matched with the full safari circuit. Prawn malai curry, katla kalia, slow-cooked mutton kosha and seasonal winter delicacies, served between creek cruises and watchtowers.",
      "The route runs Canning / Sonakhali → Gosaba → Pakhiralay / Bali / Dayapur / Jharkhali, with safari from Sajnekhali across Sudhanyakhali, Dobanki, Pirkhali, Gazikhali, Bonbibi Bharani, Deul Bharani and Panchamukhani.",
    ],
    highlights: ["Grand winter feast — Bengali menus across all 3 days", "Sajnekhali, Sudhanyakhali & Dobanki safari circuit", "Jharkhali Tiger Rescue Centre visit", "Gosaba — Tagore bungalow & Hamilton bungalow", "Loknath Baba Temple & Bonmata Temple"],
    gallery: [img("photo-1470252649378-9c29740c9fa8"), img("photo-1500530855697-b586d89ba3ee", 900), img("photo-1441974231531-c6227db76b6e", 900)],
    itinerary: [
      { day: "Day 1", title: "Grand welcome feast", desc: "Journey from Canning / Sonakhali to Gosaba by boat — Tagore bungalow and Hamilton bungalow — then on to Pakhiralay / Bali / Dayapur / Jharkhali for hotel check-in. Morning luchi and aloo dum, prawn fritters mid-morning, grand Bengali lunch with prawn malai curry and katla kalia, evening riverside leisure." },
      { day: "Day 2", title: "Flavours of Bengal + safari", desc: "Jungle safari from Sajnekhali watchtower across Sudhanyakhali, Dobanki canopy walk, Pirkhali, Gazikhali, Bonbibi Bharani, Deul Bharani and Panchamukhani, plus the Jharkhali Tiger Rescue Centre. Naan puri and chana masala breakfast, fried fish mid-morning, bhetki kalia and mustard bhola lunch, chicken pakora evening, fried rice and chilli chicken dinner." },
      { day: "Day 3", title: "Farewell feast & return", desc: "Morning visit to Loknath Baba Temple and Bonmata Temple, village walks and nearby sightseeing, then return to Sonakhali Ferry Ghat. Kachuri and cholar dal breakfast, farewell lunch with pabda in poppy-seed gravy and chicken kosha." },
    ],
    inclusions: ["All festival meals as per the winter menu (Day 1 breakfast → Day 3 lunch)", "2 nights hotel stay", "Licensed motor boat with forest permits + forest guide", "Canning / Sonakhali transfers and all sightseeing in the itinerary", "All entry fees in the itinerary"],
    exclusions: ["Train / flight to Kolkata", "Camera / video fees levied by the forest department", "Personal expenses & tips", "Anything not mentioned in inclusions"],
    meetingPoint: "Canning / Sonakhali — exact pickup time shared a day before.",
    transport: "Car to the jetty and licensed motor boat with shade, life jackets and washroom on all days.",
    stay: "2 nights hotel at Pakhiralay / Bali Island / Dayapur / Jharkhali side.",
  },
  "sundarban-hilsa-festival": {
    startPoint: "Canning / Sonakhali",
    overview: [
      "July to September — the monsoon belongs to the hilsa. Our Hilsa Festival pairs the season's most loved fish with three unhurried days on the water: mustard hilsa, steamed hilsa, hilsa with pui greens, doi hilsa and a farewell hilsa biryani.",
      "Between meals: day-long boat cruising, the full watchtower circuit, comfortable overnight stay and traditional evenings with Adivasi folk performances and Baul music.",
    ],
    highlights: ["Six+ hilsa preparations across 3 days, incl. hilsa biryani finale", "Monsoon cruising through creeks and mangrove forest", "Sajnekhali to Panchamukhani safari circuit + rescue centre", "Adivasi folk & Baul music evenings", "Gosaba bungalows, island villages and temple visits"],
    gallery: [img("photo-1439066615861-d1af74d74000"), img("photo-1544551763-46a013bb70d5", 900), img("photo-1470071459604-3b5ec3a7fe05", 900)],
    itinerary: [
      { day: "Day 1", title: "The welcome feast", desc: "Canning / Sonakhali → Gosaba by boat, Tagore and Hamilton bungalows, then hotel check-in at Pakhiralay / Bali / Dayapur / Jharkhali. Luchi-kachuri welcome, fried local fish mid-morning, grand lunch with pui-green hilsa, steamed mustard hilsa and bagda prawn malai curry." },
      { day: "Day 2", title: "A true Bengali feast + safari", desc: "Full-day safari from Sajnekhali across Sudhanyakhali, Dobanki, Pirkhali, Gazikhali, Bonbibi Bharani, Deul Bharani and Panchamukhani, plus Jharkhali Tiger Rescue Centre. Prawn fritters mid-morning, lunch with kachu-green hilsa, pabda curry and mustard hilsa, folk-music evening." },
      { day: "Day 3", title: "Hilsa biryani farewell", desc: "Loknath Baba and Bonmata temples, village walks, then the grand farewell — authentic Bengali hilsa biryani with chicken kosha — before returning to Sonakhali Ferry Ghat." },
    ],
    inclusions: ["All festival meals including the hilsa specials (Day 1 breakfast → Day 3 lunch)", "2 nights hotel stay", "Licensed motor boat with forest permits + forest guide", "Canning / Sonakhali transfers and all sightseeing in the itinerary", "Traditional folk-music evening"],
    exclusions: ["Train / flight to Kolkata", "Camera / video fees levied by the forest department", "Personal expenses & tips", "Monsoon route changes follow forest rules — confirmed before travel"],
    meetingPoint: "Canning / Sonakhali — exact pickup time shared a day before.",
    transport: "Car to the jetty and licensed motor boat with shade, life jackets and washroom on all days.",
    stay: "2 nights hotel at Pakhiralay / Bali Island / Dayapur / Jharkhali side.",
  },
};

export function getTour(slug: string) {
  const tour = TOURS.find((t) => t.slug === slug);
  const detail = TOUR_DETAILS[slug];
  return tour && detail ? { ...tour, ...detail } : undefined;
}

export const TOURS: Tour[] = [
  {
    slug: "sundarban-winter-festival",
    title: "Sundarban Winter Festival",
    duration: "3 Days • 2 Nights",
    days: 3,
    group: "Festival special",
    summary:
      "A winter feast in the delta — prawn malai curry, katla kalia, mutton kosha and seasonal delicacies across 3 days, plus the full safari circuit.",
    image: img("photo-1470252649378-9c29740c9fa8"),
    priceNote: "Festival dates",
    bestFor: "Food lovers & families",
  },
  {
    slug: "sundarban-hilsa-festival",
    title: "Sundarban Hilsa Festival",
    duration: "3 Days • 2 Nights",
    days: 3,
    group: "Monsoon special",
    summary:
      "July–September monsoon special — mustard hilsa, steamed hilsa, hilsa biryani and more, with cruising, village stays and Baul folk evenings.",
    image: img("photo-1439066615861-d1af74d74000"),
    priceNote: "July – September",
    bestFor: "Food lovers",
  },
];

export type TrustFeature = { icon: string; title: string; desc: string };

// Single source of truth for the "Why choose us" badges: the database
// (brand.trustItems) wins when present; this is the fallback + seed stock.
export const TRUST_FEATURES: TrustFeature[] = [
  { icon: "Compass", title: "Trusted Local Guidance", desc: "Helpful destination knowledge and practical trip-planning support from people who know the delta." },
  { icon: "Route", title: "Thoughtful Itineraries", desc: "Trips designed around realistic travel times, tides and forest entry rules — never rushed." },
  { icon: "HeartHandshake", title: "Clear Communication", desc: "Easy access on WhatsApp, phone and enquiry forms. Real replies, no bots pushing sales." },
  { icon: "MapPin", title: "Planning Support", desc: "Guidance for route, timing, stay and tour selection — even if you book nothing with us." },
];

export const TRUST_ICONS = ["Compass", "Route", "HeartHandshake", "MapPin", "Ship", "Binoculars", "Phone", "Star"] as const;

// Fallback + seed stock for the homepage safari feature block.
export const SAFARI_DEFAULT = {
  title: "Creeks, watchtowers and quiet patience",
  text: "Safari here is a water journey — permitted creeks, forest guides, and watchtowers at Sajnekhali, Sudhanyakhali and Dobanki. Mornings are misty, afternoons golden, and every turn feels unscripted.",
  points: [
    "Forest guide + permits handled",
    "Small-group boats, shade + washroom",
    "Honest briefing — no guaranteed sightings",
  ],
};

export const FAQS = [
  {
    q: "How do I reach the Sundarbans?",
    a: "Most travellers come via Kolkata to Godkhali / Canning (2.5–4 hrs by road + boat). Share your starting point and we will map the smoothest route — train, car and boat handover included.",
  },
  {
    q: "How many days are enough for a Sundarban trip?",
    a: "One day works for a taste. Two days / one night is the sweet spot for safari + stay. Three days lets you slow down, add Jharkhali or Gosaba, and catch sunrise and sunset on the water.",
  },
  {
    q: "What is usually included in a tour?",
    a: "Typically: transfers from the meeting point, licensed boat + forest permits, guide, meals during the cruise, and accommodation for overnight tours. We confirm the exact list before you book — no hidden extras.",
  },
  {
    q: "How does a boat safari work?",
    a: "You cruise with a licensed boat and forest guide through permitted creeks, stopping at watchtowers like Sajnekhali and Dobanki. Entry is regulated — routes and timings follow forest department rules.",
  },
  {
    q: "Which season is suitable for visiting?",
    a: "October to March is pleasant for most travellers. Monsoon (June–September) is lush but wet with route restrictions. April–May is hot but quieter. Tell us your month and we will advise honestly.",
  },
  {
    q: "What should I carry?",
    a: "Light cotton, sun cap, binoculars if you have them, mosquito repellent, ID proof, and a light jacket in winter. Avoid bright colours and loud music — the forest rewards quiet travellers.",
  },
  {
    q: "Can I request a custom itinerary?",
    a: "Yes — custom is our strength. Private boat, photography pace, senior-friendly pacing, or honeymoon quiet. Send dates + group size and we will draft options.",
  },
];
