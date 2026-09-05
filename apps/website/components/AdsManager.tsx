"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { ADS } from "@web/lib/ads";

const POP_KEY = "crg_pop_ts";

function injectScript(src: string): boolean {
  if (document.querySelector(`script[src="${src}"]`)) return false;
  const el = document.createElement("script");
  el.src = src;
  el.async = true;
  document.body.appendChild(el);
  return true;
}

function optedOut(): boolean {
  try {
    if (navigator.doNotTrack === "1") return true;
    if (localStorage.getItem("crg_token") || localStorage.getItem("crg_admin")) return true;
    if (document.cookie.includes("admin")) return true;
    if (window.location.search.includes("preview")) return true;
    if (document.referrer) {
      const path = new URL(document.referrer).pathname;
      if (path.startsWith("/studio")) return true;
    }
  } catch {
    return true;
  }
  return false;
}

function popunderCapped(): boolean {
  try {
    const last = Number(localStorage.getItem(POP_KEY) || 0);
    return Date.now() - last < ADS.popunderCapMs;
  } catch {
    return true;
  }
}

function markPopunderShown(): void {
  try {
    localStorage.setItem(POP_KEY, String(Date.now()));
  } catch {
    /* storage unavailable — treat as capped next time */
  }
}

export function AdsManager() {
  const pathname = usePathname();
  const armed = useRef(false);

  // Social Bar: site-wide, after browser idle + delay (official: before </body>).
  useEffect(() => {
    if (!ADS.enabled || optedOut()) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = () => {
      timer = setTimeout(() => injectScript(ADS.socialBarSrc), ADS.socialBarDelayMs);
    };
    if ("requestIdleCallback" in window) {
      (window as unknown as { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(load);
    } else {
      load();
    }
    return () => clearTimeout(timer);
  }, []);

  // Popunder: per-route, only after real engagement, max once per 24h.
  // The vendor script fires on user click once armed — arming late is what
  // keeps it aligned with behavior instead of entry (official guidance).
  useEffect(() => {
    if (!ADS.enabled || armed.current || optedOut() || popunderCapped()) return;
    if (ADS.popunderBlockedPrefixes.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`))) return;

    const arm = () => {
      if (armed.current) return;
      armed.current = true;
      markPopunderShown();
      injectScript(ADS.popunderSrc);
      cleanup();
    };
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      if (max > 0 && window.scrollY / max >= ADS.popunderScrollDepth) arm();
    };
    const dwell = setTimeout(arm, ADS.popunderDwellMs);
    const cleanup = () => {
      clearTimeout(dwell);
      window.removeEventListener("scroll", onScroll, true);
    };
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    return cleanup;
  }, [pathname]);

  return null;
}
