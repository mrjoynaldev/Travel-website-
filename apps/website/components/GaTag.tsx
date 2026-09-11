"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function GaTag() {
  const pathname = usePathname();

  useEffect(() => {
    if (!MEASUREMENT_ID || typeof window.gtag !== "function") return;
    window.gtag("config", MEASUREMENT_ID, {
      page_path: pathname,
    });
  }, [pathname]);

  if (!MEASUREMENT_ID) return null;

  // Plain <script> elements: identical loading behaviour to next/script with
  // strategy="afterInteractive", without the version-sensitive wrapper types.
  return (
    <>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`} />
      <script
        dangerouslySetInnerHTML={{
          __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${MEASUREMENT_ID}', { send_page_view: true });
        `,
        }}
      />
    </>
  );
}
