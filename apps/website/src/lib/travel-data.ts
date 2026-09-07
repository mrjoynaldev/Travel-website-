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
  "sundarban-1-day-tour": {
    startPoint: "Kolkata / Canning / Godkhali",
    overview: [
      "A crisp one-day introduction to the Sundarbans for travellers short on time. You cruise the creeks, climb the Sajnekhali watchtower, walk a forest village and return by evening — with permits, guide and lunch handled.",
      "Expect an early start (around 6–7am pickup) and return by 7–8pm. It is a full day, but paced around the tide and forest entry timings.",
    ],
    highlights: ["Creek cruise with licensed forest guide", "Sajnekhali watchtower + interpretation centre", "Sudhanyakhali watchtower (as per entry)", "Riverside lunch on / near the boat", "Village walk — honey, crab & local life"],
    gallery: [img("photo-1500530855697-b586d89ba3ee"), img("photo-1441974231531-c6227db76b6e", 900), img("photo-1439066615861-d1af74d74000", 900)],
    itinerary: [
      { day: "Morning", title: "Pickup & cruise begins", desc: "Pickup from Kolkata / Canning, drive to Godkhali jetty, board the boat with permits and guide. Cruise the narrow creeks as the forest wakes up." },
      { day: "Midday", title: "Sajnekhali + lunch", desc: "Sajnekhali watchtower, museum and interpretation centre. Riverside lunch, then cruise toward Sudhanyakhali." },
      { day: "Afternoon", title: "Watchtower & village", desc: "Sudhanyakhali watchtower (entry permitting), a short village walk, then cruise back to Godkhali." },
      { day: "Evening", title: "Drive back", desc: "Disembark at Godkhali and drive back to Kolkata by evening." },
    ],
    inclusions: ["Pickup & drop (Kolkata / Canning, shared or private as quoted)", "Licensed motor boat with forest permits", "Forest guide throughout the cruise", "Lunch + tea / snacks on board", "All entry fees in the itinerary"],
    exclusions: ["Breakfast & dinner", "Camera / video fees levied by the forest department", "Personal expenses & tips", "Anything not mentioned in inclusions"],
    meetingPoint: "Godkhali jetty (or Canning station if you take the train — we receive you there).",
    transport: "AC car / traveller ex-Kolkata to Godkhali and back, then licensed motor boat with shade, life jackets and washroom.",
    stay: "No stay — this is a day trip. Want sunrise + sunset on the water? Look at the 2-day tour.",
  },
  "sundarban-2-days-1-night": {
    startPoint: "Kolkata / Canning / Godkhali",
    overview: [
      "Our most-booked journey — the sweet spot of safari, stay and slow river time. Day one cruises deep to Pakhiralay with Sajnekhali and a river sunset; day two starts with a misty sunrise cruise and the Dobanki canopy walk before returning via Gosaba.",
      "You stay one night in a riverside resort on the water's edge — simple, clean, close to the forest sounds.",
    ],
    highlights: ["Sunrise + sunset boat cruises", "Sajnekhali, Sudhanyakhali & Dobanki watchtowers", "Dobanki canopy walk above the mangroves", "Overnight riverside resort stay", "Gosaba — Hamilton bungalow & market"],
    gallery: [img("photo-1439066615861-d1af74d74000"), img("photo-1470071459604-3b5ec3a7fe05", 900), img("photo-1502082553048-f009c37129b9", 900)],
    itinerary: [
      { day: "Day 1 · Morning", title: "Kolkata → Godkhali → cruise", desc: "Early pickup, drive to Godkhali, board with permits and guide. Cruise the creeks toward Pakhiralay." },
      { day: "Day 1 · Afternoon", title: "Sajnekhali & sunset", desc: "Sajnekhali watchtower and interpretation centre, riverside lunch, then a slow sunset cruise. Check in to the riverside resort; evening at leisure." },
      { day: "Day 2 · Morning", title: "Sunrise cruise + Dobanki", desc: "Pre-dawn tea, sunrise cruise through misty creeks, Dobanki watchtower and canopy walk. Breakfast on board." },
      { day: "Day 2 · Afternoon", title: "Gosaba & return", desc: "Gosaba village — Hamilton bungalow, market and river ghats — then cruise back to Godkhali and drive to Kolkata by evening." },
    ],
    inclusions: ["Pickup & drop (Kolkata / Canning)", "1 night riverside resort stay", "Licensed motor boat with forest permits (both days)", "Forest guide throughout", "All meals during the tour (Day 1 lunch → Day 2 lunch)", "All entry fees in the itinerary"],
    exclusions: ["Train / flight to Kolkata", "Camera / video fees levied by the forest department", "Personal expenses, laundry & tips", "Anything not mentioned in inclusions"],
    meetingPoint: "Godkhali jetty (or Canning station — we receive you there). Exact pickup time shared a day before.",
    transport: "AC car / traveller ex-Kolkata and licensed motor boat with shade, life jackets and washroom on both days.",
    stay: "1 night in a riverside resort at Pakhiralay — attached washroom, meals included, forest on the horizon.",
  },
  "sundarban-3-days-2-nights": {
    startPoint: "Kolkata / Canning / Godkhali",
    overview: [
      "For slow travellers — three days lets the delta breathe. Beyond the classic watchtowers you reach Jharkhali's quieter side, spend unhurried time in Gosaba, and catch both sunrise and sunset cruises without rushing.",
      "Two nights in a riverside resort, mornings for birds, evenings for river light and village stories.",
    ],
    highlights: ["Everything in the 2-day tour, unhurried", "Jharkhali — butterfly park & rescue centre side", "Dedicated birding morning with guide", "Village experience — honey, crab, folk stories", "Two river sunsets + two sunrises"],
    gallery: [img("photo-1470071459604-3b5ec3a7fe05"), img("photo-1500530855697-b586d89ba3ee", 900), img("photo-1544551763-46a013bb70d5", 900)],
    itinerary: [
      { day: "Day 1", title: "Arrive & first cruise", desc: "Pickup, Godkhali boarding, creek cruise to Pakhiralay. Sajnekhali watchtower, sunset cruise, resort check-in." },
      { day: "Day 2", title: "Dobanki + Jharkhali side", desc: "Sunrise cruise, Dobanki canopy walk, then the quieter Jharkhali reach — butterfly park, rescue centre, long horizons. Village walk in the evening." },
      { day: "Day 3", title: "Gosaba & return", desc: "Birding morning cruise, breakfast on board, Gosaba — Hamilton bungalow and markets — then back to Godkhali and Kolkata by evening." },
    ],
    inclusions: ["Pickup & drop (Kolkata / Canning)", "2 nights riverside resort stay", "Licensed motor boat with forest permits (all days)", "Forest guide + dedicated birding morning", "All meals during the tour", "All entry fees in the itinerary"],
    exclusions: ["Train / flight to Kolkata", "Camera / video fees levied by the forest department", "Personal expenses, laundry & tips", "Anything not mentioned in inclusions"],
    meetingPoint: "Godkhali jetty (or Canning station — we receive you there). Exact pickup time shared a day before.",
    transport: "AC car / traveller ex-Kolkata and licensed motor boat with shade, life jackets and washroom on all days.",
    stay: "2 nights in a riverside resort at Pakhiralay — attached washroom, all meals, evenings on the deck.",
  },
  "sundarban-custom-tour": {
    startPoint: "Decided together",
    overview: [
      "A private itinerary stitched around your dates, group and interests — photography pace, senior-friendly pacing, honeymoon quiet, or a school / corporate group.",
      "Tell us the basics on call or WhatsApp; we draft 1–2 options with a clear written quote. You confirm only when sure.",
    ],
    highlights: ["Private boat & flexible timings", "Photography / birding / honeymoon pacing", "Choice of stay — resort or camp", "Senior & kid-friendly routing", "Written quote before you decide"],
    gallery: [img("photo-1502082553048-f009c37129b9"), img("photo-1441974231531-c6227db76b6e", 900), img("photo-1470252649378-9c29740c9fa8", 900)],
    itinerary: [
      { day: "Step 1", title: "Tell us the basics", desc: "Dates, group size, starting city and interests — on call, WhatsApp or the enquiry form." },
      { day: "Step 2", title: "We draft options", desc: "1–2 itineraries with route, safari slots, stay and inclusions — plus an honest note on what to skip." },
      { day: "Step 3", title: "Confirm & travel", desc: "Lock dates with a small advance; permits, boat and stay handled. Pay the rest as agreed." },
    ],
    inclusions: ["Everything agreed in your written quote", "Licensed boat, permits & forest guide", "Stay & meals as per the chosen plan"],
    exclusions: ["Anything outside the written quote", "Personal expenses & forest camera fees unless included"],
    meetingPoint: "Decided with you — usually Godkhali jetty or Canning station.",
    transport: "Private car + private boat sized to your group.",
    stay: "Your choice — riverside resort, eco-camp or day-trip without stay.",
  },
};

export function getTour(slug: string) {
  const tour = TOURS.find((t) => t.slug === slug);
  const detail = TOUR_DETAILS[slug];
  return tour && detail ? { ...tour, ...detail } : undefined;
}

export const TOURS: Tour[] = [
  {
    slug: "sundarban-1-day-tour",
    title: "1 Day Sundarban Tour",
    duration: "1 Day",
    days: 1,
    group: "Day trip",
    summary:
      "A crisp introduction — creek cruise, Sajnekhali watchtower, village walk and return by evening. Ideal if you are short on time.",
    image: img("photo-1500530855697-b586d89ba3ee"),
    priceNote: "Best for first-timers",
    bestFor: "Weekend travellers",
  },
  {
    slug: "sundarban-2-days-1-night",
    title: "2 Days / 1 Night Sundarban Tour",
    duration: "2 Days • 1 Night",
    days: 2,
    group: "Most popular",
    summary:
      "Our most-booked journey — overnight stay, sunrise boat safari, Dobanki canopy walk and slow mangrove creeks.",
    image: img("photo-1439066615861-d1af74d74000"),
    featured: true,
    priceNote: "Most popular",
    bestFor: "Couples & families",
  },
  {
    slug: "sundarban-3-days-2-nights",
    title: "3 Days / 2 Nights Sundarban Tour",
    duration: "3 Days • 2 Nights",
    days: 3,
    group: "Slow travel",
    summary:
      "Go deeper — Jharkhali, Gosaba, Pakhiralay and quieter creeks with time for birds, villages and river sunsets.",
    image: img("photo-1470071459604-3b5ec3a7fe05"),
    priceNote: "For slow travellers",
    bestFor: "Nature lovers",
  },
  {
    slug: "sundarban-custom-tour",
    title: "Custom Sundarban Tour",
    duration: "Flexible",
    days: 0,
    group: "Private",
    summary:
      "Tell us your dates, group size and interests — we stitch a private itinerary around safari, stay and pace.",
    image: img("photo-1502082553048-f009c37129b9"),
    priceNote: "Tailor-made",
    bestFor: "Groups & photographers",
  },
];

export const DESTINATIONS: Destination[] = [
  {
    slug: "sundarban",
    name: "Sundarban",
    summary: "Mangrove waterways, watchtowers and the forest that defines the delta.",
    image: img("photo-1441974231531-c6227db76b6e", 900),
    tag: "Signature",
  },
  {
    slug: "gosaba",
    name: "Gosaba",
    summary: "The last inhabited gateway — Hamilton bungalow, markets and river ghats.",
    image: img("photo-1500530855697-b586d89ba3ee", 900),
  },
  {
    slug: "godkhali",
    name: "Godkhali",
    summary: "Where most journeys begin — jetty, boats and first glimpse of the creeks.",
    image: img("photo-1439066615861-d1af74d74000", 900),
  },
  {
    slug: "pakhiralay",
    name: "Pakhiralay",
    summary: "Stay village on the water's edge — birds, calm mornings, local life.",
    image: img("photo-1470071459604-3b5ec3a7fe05", 900),
  },
  {
    slug: "sajnekhali",
    name: "Sajnekhali",
    summary: "Watchtower, museum and interpretation centre inside the reserve zone.",
    image: img("photo-1502082553048-f009c37129b9", 900),
  },
  {
    slug: "jharkhali",
    name: "Jharkhali",
    summary: "Quieter, wilder side — butterfly park, rescue centre and long horizons.",
    image: img("photo-1544551763-46a013bb70d5", 900),
  },
];

export const ACTIVITIES: Activity[] = [
  {
    slug: "sundarban-safari",
    title: "Sundarban Safari",
    summary: "Licensed boat safari through creeks and watchtowers with forest guides.",
    image: img("photo-1561731216-c3a4d99437d5", 800),
    duration: "3–4 hrs",
  },
  {
    slug: "boat-journey",
    title: "Boat Journey",
    summary: "Slow cruising past mangrove walls, fishing boats and river bends.",
    image: img("photo-1544551763-46a013bb70d5", 800),
    duration: "Full day",
  },
  {
    slug: "wildlife-watching",
    title: "Wildlife Watching",
    summary: "Deer, crocodiles, wild boar — and if luck holds, the elusive tiger. Sightings depend on nature.",
    image: img("photo-1534177616072-ef7dc120449d", 800),
    duration: "Dawn / dusk",
  },
  {
    slug: "birdwatching",
    title: "Birdwatching",
    summary: "Kingfishers, egrets, eagles and winter migrants over quiet backwaters.",
    image: img("photo-1444464666168-49d633b86797", 800),
    duration: "2–3 hrs",
  },
  {
    slug: "village-experience",
    title: "Village Experience",
    summary: "Honey collectors, crab fishers, folk stories and home-style meals.",
    image: img("photo-1500382017468-9049fed747ef", 800),
    duration: "Half day",
  },
  {
    slug: "river-sunrise-sunset",
    title: "River Sunrise / Sunset",
    summary: "Still water, low light, birds returning — the delta at its calmest.",
    image: img("photo-1470252649378-9c29740c9fa8", 800),
    duration: "Golden hour",
  },
];

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

export const PLANNING_GUIDES = [
  { title: "How to Reach Sundarban", desc: "Kolkata → Canning → Godkhali route, timings and costs.", read: "6 min" },
  { title: "Best Time to Visit Sundarban", desc: "Month-by-month weather, crowds and safari odds.", read: "5 min" },
  { title: "Sundarban Tour Cost", desc: "What drives price — boat, stay, permits — and how to compare.", read: "7 min" },
  { title: "Sundarban Safari Guide", desc: "Permits, watchtowers, timings and what to expect.", read: "8 min" },
  { title: "Places to Visit in Sundarban", desc: "Gosaba to Jharkhali — which stop suits your trip.", read: "6 min" },
  { title: "Sundarban Itinerary", desc: "1-day, 2-day and 3-day plans that respect travel times.", read: "9 min" },
];
