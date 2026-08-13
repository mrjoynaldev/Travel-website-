import type { Metadata, Viewport } from "next";
import { PublicShell, type PublicPageInfo, type PublicationInfo } from "@/components/public/PublicShell";
import { Toaster } from "@/components/ui/sonner";
import { serverTrpc } from "@web/lib/trpc-server";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "CodeReport Global", template: "%s · CodeReport Global" },
  description: "Developer-first AI news, analysis, and practical guides for people who build and ship software.",
  icons: { icon: "/favicon.png" },
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
      </head>
      <body>
        <PublicShell publication={publication} pages={pages}>{children}</PublicShell>
        <Toaster />
      </body>
    </html>
  );
}
