export type Tour = {
  slug: string;
  title: string;
  duration: string;
  days: number;
  group: string;
  summary: string;
  image: string;
  featured?: boolean;
  price?: string;
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
  safety?: string;
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
      { day: "Day 1", title: "Grand welcome feast", desc: "Depart from Kolkata by local train to Canning (approximately 1 hour 10 minutes from Sealdah station) or by car via the Basanti highway to Sonakhali. From Canning, take an auto or car to Sonakhali Launch Ghat where the licensed motor boat awaits. The boat cruises through the Matla and Bidyadhari rivers towards Gosaba Island, passing mangrove-lined creeks where kingfishers and egrets fish along the banks. Stop at Gosaba to visit the Tagore Bungalow — where Rabindranath Tagore stayed during his Sundarban visits — and the nearby Hamilton Bungalow, a colonial-era estate. Continue by boat to Pakhiralay or Bali Island for hotel check-in. The evening opens with a grand Bengali welcome feast: luchi with aloo dum, prawn fritters, and a spread of seasonal winter delicacies served riverside." },
      { day: "Day 2", title: "Flavours of Bengal + full safari circuit", desc: "Board the licensed motor boat at dawn for a full-day safari from Sajnekhali Wildlife Sanctuary. The boat weaves through creeks — Pirkhali, Gazikhali, Bonbibi Bharani, Deul Bharani — stopping at watchtowers where forest guides scan for pugmarks, spotted deer, wild boar, and salt-water crocodiles. Visit the Dobanki canopy walk, a 500-metre elevated trail through the mangrove canopy, then continue to Sudhanyakhali watchtower, famous for tiger sighting opportunities. The afternoon takes in the Jharkhali Tiger Rescue Centre, where injured and orphaned tigers are rehabilitated. Between stops, the onboard kitchen serves naan puri with chana masala breakfast, fried fish mid-morning, bhetki kalia with mustard bhola for lunch, chicken pakora as an evening snack, and fried rice with chilli chicken for dinner." },
      { day: "Day 3", title: "Farewell feast & return", desc: "Begin the final morning with a visit to Loknath Baba Temple on the riverbank and the nearby Bonmata Temple, both important spiritual landmarks for the fishing communities of the Sundarbans. Walk through the island villages to see how daily life revolves around the tides — fishermen mending nets, women sorting prawns, children heading to school by boat. Return to Sonakhali Ferry Ghat by late morning for the journey back to Kolkata. The farewell lunch on the boat features pabda in poppy-seed gravy and chicken kosha, a final taste of Bengal before the trip ends." },
    ],
    inclusions: ["All festival meals as per the winter menu (Day 1 breakfast → Day 3 lunch)", "2 nights hotel stay", "Licensed motor boat with forest permits + forest guide", "Canning / Sonakhali transfers and all sightseeing in the itinerary", "All entry fees in the itinerary"],
    exclusions: ["Train / flight to Kolkata", "Camera / video fees levied by the forest department", "Personal expenses & tips", "Anything not mentioned in inclusions"],
    meetingPoint: "Canning / Sonakhali — exact pickup time shared a day before.",
    transport: "Car to the jetty and licensed motor boat with shade, life jackets and washroom on all days.",
    stay: "2 nights hotel at Pakhiralay / Bali Island / Dayapur / Jharkhali side.",
    safety: "Forest permits are arranged in advance and included in the tour cost. All boats carry life jackets and follow forest department safety rules. The Sundarbans is a plastic-free zone — carry a reusable water bottle and take all waste back. Wildlife sightings depend on nature, tides, and season — never guaranteed. Carry photo ID (required for forest entry), mosquito repellent, and sun protection. Avoid bright colours and loud music in the forest.",
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
      { day: "Day 1", title: "The welcome feast", desc: "Depart Kolkata by local train from Sealdah to Canning (1 hour 10 minutes) or by car to Sonakhali. From Canning, take an auto to Sonakhali Launch Ghat and board the licensed motor boat. Cruise through the Matla and Bidyadhari rivers to Gosaba Island, stopping at the Tagore Bungalow and Hamilton Bungalow — both steeped in colonial and literary history. Continue by boat to Pakhiralay or Bali Island for hotel check-in. The afternoon welcome feast celebrates the monsoon hilsa season: luchi-kachuri breakfast fare, fried local fish mid-morning, and a grand lunch of pui-green hilsa, steamed mustard hilsa, and bagda prawn malai curry served with fragrant rice." },
      { day: "Day 2", title: "A true Bengali feast + safari", desc: "Board the boat at dawn for a full-day safari through the Sajnekhali Wildlife Sanctuary. The licensed motor boat weaves through Pirkhali, Gazikhali, Bonbibi Bharani, Deul Bharani, and Panchamukhani creeks, stopping at watchtowers where forest guides scan for pugmarks, spotted deer, and salt-water crocodiles. Visit the Dobanki canopy walk and Sudhanyakhali watchtower, then continue to the Jharkhali Tiger Rescue Centre. Between safari stops, enjoy prawn fritters mid-morning, lunch with kachu-green hilsa, pabda curry, and mustard hilsa, then an evening of Adivasi folk performances and Baul music by the river." },
      { day: "Day 3", title: "Hilsa biryani farewell", desc: "Visit Loknath Baba Temple and Bonmata Temple on the riverbank, both important spiritual sites for the fishing communities. Walk through island villages to see daily life revolving around the tides — fishermen sorting hilsa, women repairing nets, children boarding boats to school. Return to Sonakhali Ferry Ghat by late morning. The grand farewell lunch features authentic Bengali hilsa biryani with chicken kosha, a fitting finale to a monsoon food-and-wildlife journey before the trip ends." },
    ],
    inclusions: ["All festival meals including the hilsa specials (Day 1 breakfast → Day 3 lunch)", "2 nights hotel stay", "Licensed motor boat with forest permits + forest guide", "Canning / Sonakhali transfers and all sightseeing in the itinerary", "Traditional folk-music evening"],
    exclusions: ["Train / flight to Kolkata", "Camera / video fees levied by the forest department", "Personal expenses & tips", "Monsoon route changes follow forest rules — confirmed before travel"],
    meetingPoint: "Canning / Sonakhali — exact pickup time shared a day before.",
    transport: "Car to the jetty and licensed motor boat with shade, life jackets and washroom on all days.",
    stay: "2 nights hotel at Pakhiralay / Bali Island / Dayapur / Jharkhali side.",
    safety: "Forest permits are arranged in advance and included in the tour cost. All boats carry life jackets and follow forest department safety rules. The Sundarbans is a plastic-free zone — carry a reusable water bottle and take all waste back. Monsoon routes may change based on tides and weather — confirmed before travel. Carry photo ID (required for forest entry), mosquito repellent, and rain gear. Avoid bright colours and loud music in the forest. Wildlife sightings depend on nature and are never guaranteed.",
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
    price: "₹5,500",
    priceNote: "per person · Dec – Feb",
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
    price: "₹5,000",
    priceNote: "per person · Jul – Sep",
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
  title: "Sundarban Safari",
  text: "Experience the beauty of the Sundarbans through its winding waterways, dense mangrove forests, and rich wildlife. Safari tours are planned to provide a comfortable and enjoyable way to explore this unique ecosystem.",
  points: [
    "Experienced forest guides",
    "Required permits arranged",
    "Comfortable boats with shade and washroom facilities",
    "Small-group safari options",
    "Explore the forest, waterways, and watchtowers",
    "Wildlife sightings depend on nature, tides, and luck",
  ],
};

export const FAQS = [
  {
    q: "How do I reach the Sundarbans?",
    a: "Most travellers reach Canning from Kolkata by train or car. From Canning, take a car or auto to Sonakhali Launch Ghat, where you'll board a boat to the Sundarbans. Share your starting point so the team can help plan the easiest route.",
  },
  {
    q: "How many days are enough for a Sundarban trip?",
    a: "3 Days / 2 Nights — Best Choice. The most recommended option for a complete Sundarban experience, with more time for wildlife safaris, exploring Jharkhali, beautiful sunrises and sunsets on the water, and a less rushed experience. 2 Days / 1 Night — Good for a Short Trip. A good option for travellers with limited time, with a Sundarban safari, a comfortable stay, and a taste of the region's wildlife and natural beauty. 1 Day — Quick Visit. Best for travellers with very limited time: a short Sundarban experience, but the trip will be more rushed with less time for exploration.",
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
