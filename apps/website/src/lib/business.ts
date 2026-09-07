export const businessConfig = {
  name: "Sundarban Yatra",
  tagline: "Explore. Experience. Understand the Sundarbans.",
  phoneDisplay: "+91 98765 43210",
  // E.164 without + for tel:, digits for wa.me
  phone: "+919876543210",
  whatsapp: "919876543210",
  email: "hello@sundarbanyatra.in",
  hours: "Mon–Sat, 9am–7pm IST",
};

export function buildWhatsAppUrl(message: string, tourTitle?: string) {
  const base = `https://wa.me/${businessConfig.whatsapp}`;
  const text = tourTitle ? `${message}\n\nTour: ${tourTitle}` : message;
  return `${base}?text=${encodeURIComponent(text)}`;
}

export const defaultWhatsAppMessage =
  "Hello Sundarban Yatra, I want to plan a Sundarban trip. Please share tour options.";

export const tourWhatsAppMessage = (tourTitle: string) =>
  `Hello Sundarban Yatra, I am interested in the ${tourTitle}.\n\nTravel date:\nTravellers:\nStarting location:`;

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
    "Hello Sundarban Yatra, I want to plan a Sundarban trip.",
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

export function tripWhatsAppUrl(d: TripDetails) {
  return buildWhatsAppUrl(tripWhatsAppMessage(d));
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
