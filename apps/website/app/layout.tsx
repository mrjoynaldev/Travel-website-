import type { Metadata, Viewport } from "next";
import { PublicShell, type PublicPageInfo, type PublicationInfo } from "@/components/public/PublicShell";
import { GaTag } from "../components/GaTag";
import { Toaster } from "@/components/ui/sonner";
import { serverTrpc } from "@web/lib/trpc-server";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://codereportglobal.indevs.in";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "CodeReport Global", template: "%s · CodeReport Global" },
  description: "Developer-first AI news, analysis, and practical guides for people who build and ship software.",
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
    siteName: "CodeReport Global",
    locale: "en_US",
    url: "/",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "CodeReport Global" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CodeReport Global",
    description: "Developer-first AI news, analysis, and practical guides for people who build and ship software.",
    images: ["/og-default.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  verification: {
    yandex: "f5a900063c4544c5",
  },
};

export const viewport: Viewport = { themeColor: "#1b563f" };

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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Playfair+Display:opsz,wght@5..120,500;5..120,600;5..120,700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": `${SITE_URL}/#organization`,
                  name: publication?.name || "CodeReport Global",
                  url: SITE_URL,
                  logo: `${SITE_URL}/logo.png`,
                  description: publication?.description || "Developer-first AI news, analysis, and practical guides for people who build and ship software.",
                },
                {
                  "@type": "WebSite",
                  "@id": `${SITE_URL}/#website`,
                  url: SITE_URL,
                  name: publication?.name || "CodeReport Global",
                  alternateName: ["Code Report Global", "CodeReport", "The Code Report"],
                  description: publication?.description || "Developer-first AI news, analysis, and practical guides for people who build and ship software.",
                  publisher: { "@id": `${SITE_URL}/#organization` },
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
