export const businessConfig = {
  name: "Sundarban Yatri",
  tagline: "Explore. Experience. Understand the Sundarbans.",
  organiser: "Joynal Abedin Gazi",
  location: "Sonakhali, Sundarban, West Bengal, India",
  phoneDisplay: "+91 85138 19474",
  // E.164 without + for tel:, digits for wa.me
  phone: "+918513819474",
  whatsapp: "918513819474",
  email: "hello@sundarbanyatri.com",
  hours: "Mon–Sat, 9am–7pm IST",
};

export function buildWhatsAppUrl(message: string, whatsapp?: string) {
  const number = whatsapp ?? businessConfig.whatsapp;
  const base = `https://wa.me/${number}`;
  return `${base}?text=${encodeURIComponent(message)}`;
}

export const defaultWhatsAppMessage =
  "Hello Sundarban Yatri, I want to plan a Sundarban trip. Please share tour options.";

export const tourWhatsAppMessage = (tourTitle: string) =>
  `Hello Sundarban Yatri, I am interested in the ${tourTitle}.\n\nTravel date:\nTravellers:\nStarting location:`;

export type TripDetails = {
  date?: string;
  travellers?: string;
  days?: string;
  from?: string;
  interest?: string;
  tour?: string;
};

// Builds a pre-filled WhatsApp enquiry from the trip planner fields so
// travellers can send their trip in one tap — no form needed.
export function tripWhatsAppMessage(d: TripDetails) {
  const lines = [
    "Hello Sundarban Yatri, I want to plan a Sundarban trip.",
    "",
    d.tour ? `Tour: ${d.tour}` : null,
    `Travel date: ${d.date || "-"}`,
    `Travellers: ${d.travellers || "-"}`,
    `Days: ${d.days || "-"}`,
    `Starting from: ${d.from || "-"}`,
    `Interested in: ${d.interest || "-"}`,
  ].filter((l): l is string => l !== null);
  return lines.join("\n");
}

export function tripWhatsAppUrl(d: TripDetails, whatsapp?: string) {
  return buildWhatsAppUrl(tripWhatsAppMessage(d), whatsapp);
}

export function trackEvent(name: string, props?: Record<string, unknown>) {
  try {
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", name, props ?? {});
    }
  } catch {
    // analytics is best-effort
  }
}
