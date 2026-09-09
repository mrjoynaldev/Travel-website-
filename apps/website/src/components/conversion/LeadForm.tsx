"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpcClient } from "@web/lib/trpc-client";
import { buildWhatsAppUrl, tourWhatsAppMessage } from "@web/lib/business";

export function LeadForm({
  tourSlug,
  tourTitle,
  compact = false,
  ctaLabel = "Get a Tour Quote",
}: {
  tourSlug?: string;
  tourTitle?: string;
  compact?: boolean;
  ctaLabel?: string;
}) {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", date: "", travellers: "2", message: "" });

  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error("Please add your name and phone / WhatsApp.");
      return;
    }
    setSending(true);
    try {
      await trpcClient.blog.submitLead.mutate({
        name: form.name.trim(),
        phone: form.phone.trim(),
        travelDate: form.date || undefined,
        travellers: form.travellers ? Number.parseInt(form.travellers, 10) || undefined : undefined,
        tour: tourTitle ?? tourSlug ?? undefined,
        need: form.message.trim() || undefined,
        source: tourSlug ? `tour-${tourSlug}` : "lead-form",
      });
      setSubmitted(true);
      toast.success("Enquiry received.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send. Try WhatsApp instead.");
    } finally {
      setSending(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-[#cbd8c5] bg-[#eff4ee] p-6 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
        <h3 className="mt-3 font-display text-xl font-semibold">Enquiry received</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Thanks {form.name.split(" ")[0] || "traveller"} — our team will help you plan. For a faster reply, continue on WhatsApp.
        </p>
        <a
          href={buildWhatsAppUrl(tourWhatsAppMessage(tourTitle ?? "a Sundarban tour"))}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex h-11 items-center rounded-full bg-[#1fa855] px-6 text-sm font-semibold text-white hover:bg-[#178a45] transition-colors"
        >
          Continue on WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <div className={`grid gap-3 ${compact ? "" : "sm:grid-cols-2"}`}>
        <Input required placeholder="Your name" value={form.name} onChange={set("name")} className="h-11 bg-white rounded-xl" />
        <Input required placeholder="Phone / WhatsApp" value={form.phone} onChange={set("phone")} className="h-11 bg-white rounded-xl" />
      </div>
      <div className={`grid gap-3 ${compact ? "" : "sm:grid-cols-2"}`}>
        <Input type="date" aria-label="Travel date" value={form.date} onChange={set("date")} className="h-11 bg-white rounded-xl" />
        <Input
          type="number"
          min={1}
          max={100}
          aria-label="Travellers"
          placeholder="Travellers (e.g. 2)"
          value={form.travellers}
          onChange={set("travellers")}
          className="h-11 bg-white rounded-xl"
        />
      </div>
      {!compact && (
        <Textarea
          placeholder="Tell us about your trip — dates, starting city, interests…"
          rows={3}
          value={form.message}
          onChange={set("message")}
          className="bg-white rounded-xl"
        />
      )}
      <Button type="submit" disabled={sending} className="h-12 rounded-full text-[15px] font-semibold shadow-[0_14px_28px_-14px_rgba(24,92,67,.6)]">
        {sending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Sending…
          </>
        ) : (
          ctaLabel
        )}
      </Button>
      <p className="text-center text-xs leading-5 text-muted-foreground">
        No spam, no advance needed for enquiry. We reply within working hours.
      </p>
    </form>
  );
}
