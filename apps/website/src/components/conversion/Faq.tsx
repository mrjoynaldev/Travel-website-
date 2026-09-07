"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="grid gap-3">
      {items.map((f, i) => {
        const isOpen = open === i;
        return (
          <div
            key={i}
            className={`rounded-2xl border bg-white transition-colors ${isOpen ? "border-primary/30 shadow-[0_16px_36px_-24px_rgba(15,69,50,.4)]" : "border-border"}`}
          >
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 p-5 text-left"
            >
              <span className="font-display font-semibold text-[1.02rem] leading-snug">{f.q}</span>
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border transition ${isOpen ? "bg-primary text-white border-primary" : "border-border text-muted-foreground"}`}
              >
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </span>
            </button>
            {isOpen && <p className="px-5 pb-5 text-[14.5px] leading-7 text-muted-foreground">{f.a}</p>}
          </div>
        );
      })}
    </div>
  );
}
