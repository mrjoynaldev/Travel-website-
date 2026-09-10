import type { Metadata, Viewport } from "next";
import { Inter, DM_Mono } from "next/font/google";
import { PublicShell, type PublicPageInfo, type PublicationInfo } from "@/components/public/PublicShell";
import { GaTag } from "../components/GaTag";
import { Toaster } from "@/components/ui/sonner";
import { serverTrpc } from "@web/lib/trpc-server";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-mono",
  weight: ["400", "500"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://sundarbanyatri.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "Sundarban Yatri",
  title: { default: "Sundarban Yatri — Plan Your Sundarban Journey with Confidence", template: "%s · Sundarban Yatri" },
  description: "Discover mangrove waterways, wildlife, villages and boat journeys with practical Sundarban travel guides and thoughtfully planned tours.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icon-96.png", sizes: "96x96", type: "image/png" },
      { url: "/icon-144.png", sizes: "144x144", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "Sundarban Yatri",
    locale: "en_US",
    url: SITE_URL,
    images: [{ url: `${SITE_URL}/og-default.png`, width: 1200, height: 630, alt: "Sundarban Yatri — Sundarban tours, destinations and travel guides" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sundarban Yatri",
    description: "Discover mangrove waterways, wildlife, villages and boat journeys with practical Sundarban travel guides and thoughtfully planned tours.",
    images: [`${SITE_URL}/og-default.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  verification: {
    google: "38f216160dda9ea59525512b52c19573",
    yandex: "f5a900063c4544c5",
  },
};

export const viewport: Viewport = { themeColor: "#0f4532" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let publication: PublicationInfo | null = null;
  let pages: PublicPageInfo[] = [];
  try {
    const [publicationResult, pagesResult] = await Promise.all([
      serverTrpc.blog.publication.query(),
      serverTrpc.blog.pages.query(),
    ]);
    publication = publicationResult;
    pages = pagesResult;
  } catch {
    // The shell renders with sensible defaults if the API is temporarily unreachable.
  }

  return (
    <html lang="en" className={`${inter.variable} ${dmMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": `${SITE_URL}/#organization`,
                  name: publication?.name || "Sundarban Yatri",
                  url: SITE_URL,
                  logo: `${SITE_URL}/logo.png`,
                  description: publication?.description || "Your trusted guide to planning a Sundarban journey — tours, destinations, safari and practical travel guides.",
                },
                {
                  "@type": "LocalBusiness",
                  "@id": `${SITE_URL}/#localbusiness`,
                  name: "Sundarban Yatri",
                  url: SITE_URL,
                  logo: `${SITE_URL}/logo.png`,
                  description: "Sundarban-focused travel team — tours, safari, destinations and practical travel guides for the Sundarbans.",
                  areaServed: {
                    "@type": "Place",
                    name: "Sundarbans",
                    address: {
                      "@type": "PostalAddress",
                      addressRegion: "West Bengal",
                      addressCountry: "IN",
                    },
                  },
                  serviceType: ["Sundarban Tours", "Sundarban Safari", "Travel Guides"],
                  priceRange: "$$",
                  telephone: "+91-8513819474",
                  email: "hello@sundarbanyatri.com",
                  sameAs: [],
                },
                {
                  "@type": "WebSite",
                  "@id": `${SITE_URL}/#website`,
                  url: SITE_URL,
                  name: publication?.name || "Sundarban Yatri",
                  alternateName: ["Sundarban Yatri", "Sundarban Tours", "Sundarban Travel Guide"],
                  description: publication?.description || "Your trusted guide to planning a Sundarban journey — tours, destinations, safari and practical travel guides.",
                  publisher: { "@id": `${SITE_URL}/#organization` },
                  potentialAction: {
                    "@type": "SearchAction",
                    target: `${SITE_URL}/?search={search_term_string}`,
                    "query-input": "required name=search_term_string",
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body>
        <GaTag />
        <PublicShell publication={publication} pages={pages}>{children}</PublicShell>
        <Toaster />
      </body>
    </html>
  );
}
