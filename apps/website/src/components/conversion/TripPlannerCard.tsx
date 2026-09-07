"use client";

import { useState } from "react";
import { CalendarDays, MapPin, Users, Clock3, MessageCircle, Phone } from "lucide-react";
import { businessConfig, tripWhatsAppUrl } from "@web/lib/business";

export function TripPlannerCard() {
  const [date, setDate] = useState("");
  const [travellers, setTravellers] = useState("2");
  const [days, setDays] = useState("2");
  const [from, setFrom] = useState("");
  const [interest, setInterest] = useState("Tour + Safari");

  const details = { date, travellers, days, from, interest };
  const waUrl = tripWhatsAppUrl(details);

  const hireQuery = (() => {
    const q = new URLSearchParams();
    if (date) q.set("date", date);
    if (travellers) q.set("travellers", travellers);
    if (days) q.set("days", days);
    if (from) q.set("from", from);
    if (interest) q.set("interest", interest);
    const s = q.toString();
    return s ? `/hire?${s}` : "/hire";
  })();

  const field =
    "h-12 w-full rounded-xl border border-border bg-white px-4 text-[14.5px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition";

  return (
    <div className="rounded-[24px] border border-border bg-white/95 p-6 lg:p-8 shadow-[0_28px_60px_-28px_rgba(15,69,50,.35)] backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-xl lg:text-[1.4rem] font-semibold tracking-tight">Plan Your Trip</h3>
        <span className="yatri-chip">Fastest on call</span>
      </div>
      <p className="mt-1.5 text-sm text-muted-foreground">Fill the basics, then send it to us in one tap — we reply with the right tour.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="grid gap-1.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" /> Date
          </span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={field} />
        </label>
        <label className="grid gap-1.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Users className="h-3.5 w-3.5" /> Travellers
          </span>
          <select value={travellers} onChange={(e) => setTravellers(e.target.value)} className={field}>
            {["1", "2", "3", "4", "5-8", "9+"].map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Clock3 className="h-3.5 w-3.5" /> Days
          </span>
          <select value={days} onChange={(e) => setDays(e.target.value)} className={field}>
            <option value="1">1 day</option>
            <option value="2">2 days</option>
            <option value="3">3 days</option>
            <option value="custom">Custom</option>
          </select>
        </label>
        <label className="grid gap-1.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" /> From
          </span>
          <input placeholder="Kolkata" value={from} onChange={(e) => setFrom(e.target.value)} className={field} />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {["Tour + Safari", "Safari only", "Custom trip"].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setInterest(v)}
            className={`h-9 rounded-full border px-4 text-sm font-medium transition ${
              interest === v
                ? "border-primary bg-primary text-white shadow-sm"
                : "border-border bg-white text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Primary: WhatsApp + Call. Form is secondary (international). */}
      <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1fa855] px-6 py-3.5 text-[15px] font-semibold text-white hover:bg-[#178a45] transition-colors shadow-[0_16px_32px_-14px_rgba(31,168,85,.6)]"
        >
          <MessageCircle className="h-4 w-4" /> Send on WhatsApp
        </a>
        <a
          href={`tel:${businessConfig.phone}`}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-[15px] font-semibold text-white hover:bg-[#0f4532] transition-colors shadow-[0_16px_32px_-14px_rgba(24,92,67,.6)]"
        >
          <Phone className="h-4 w-4" /> Call {businessConfig.phoneDisplay}
        </a>
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        {businessConfig.hours} • Outside India? <a href={hireQuery} className="font-semibold text-primary hover:underline">Send an enquiry form instead →</a>
      </p>
    </div>
  );
}
