"use client";

import { MessageCircle, Phone } from "lucide-react";
import { businessConfig, buildWhatsAppUrl, defaultWhatsAppMessage, trackEvent } from "@web/lib/business";

export function StickyMobileCta({ tourTitle }: { tourTitle?: string }) {
  const wa = buildWhatsAppUrl(tourTitle ? `Hello Sundarban Yatri, I am interested in ${tourTitle}.` : defaultWhatsAppMessage);
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 backdrop-blur-md md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-3 gap-2 p-3">
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent("whatsapp_click", { source: "sticky" })}
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-[#1fa855] text-sm font-semibold text-white"
        >
          <MessageCircle className="h-4 w-4" /> WhatsApp
        </a>
        <a
          href={`tel:${businessConfig.phone}`}
          onClick={() => trackEvent("phone_click", { source: "sticky" })}
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full border border-border bg-white text-sm font-semibold"
        >
          <Phone className="h-4 w-4" /> Call
        </a>
        <a
          href="/hire"
          className="inline-flex h-11 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white"
        >
          Get Quote
        </a>
      </div>
    </div>
  );
}
