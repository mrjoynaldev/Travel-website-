"use client";

import Script from "next/script";
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

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${MEASUREMENT_ID}', { send_page_view: true });
        `}
      </Script>
    </>
  );
}
